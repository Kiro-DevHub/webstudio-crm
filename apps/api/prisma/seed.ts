import { randomUUID } from 'node:crypto';
import {
  ActivityType,
  ClientSource,
  DealStage,
  PrismaClient,
  Role,
  TaskStatus,
  type Prisma,
} from '@prisma/client';
import { fakerRU as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { AVATAR_COLORS } from '../src/common/constants/avatar-colors';

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date();

const id = () => randomUUID();
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);
const clampToPast = (date: Date, maxDate = daysAgo(0.05)) =>
  date > maxDate ? maxDate : date;

const LEGAL_FORMS = ['ООО', 'АО', 'ИП'];

const SERVICES = [
  'Корпоративный сайт',
  'Интернет-магазин',
  'Лендинг',
  'Редизайн сайта',
  'Мобильное приложение',
  'B2B-портал',
  'CRM-интеграция',
  'Техподдержка сайта',
  'SEO-оптимизация',
  'Брендинг и айдентика',
  'Сайт-каталог',
  'Промо-сайт для акции',
];

const TASK_TITLES = [
  'Подготовить коммерческое предложение',
  'Созвон с клиентом по правкам',
  'Собрать референсы',
  'Согласовать договор с юристом',
  'Выставить счёт на предоплату',
  'Подготовить прототип главной',
  'Провести презентацию концепции',
  'Запросить контент у клиента',
  'Настроить хостинг и домен',
  'Финальное тестирование перед сдачей',
  'Составить смету по доработкам',
  'Обновить статус проекта в отчёте',
];

const NOTE_BODIES = [
  'Клиент просит перенести созвон на следующую неделю.',
  'Обсудили бюджет — готовы двигаться дальше после КП.',
  'ЛПР в отпуске до конца месяца, решение отложено.',
  'Отправил договор на согласование, ждём подписи.',
  'Клиент хочет референсы в стиле минимализм, тёмная тема.',
  'Договорились о поэтапной оплате 50/50.',
  'Нужно уточнить требования к интеграции с 1С.',
  'Клиент доволен прототипом, двигаемся к дизайну.',
  'Просили добавить в смету поддержку на 6 месяцев.',
  'Конкуренты предложили дешевле — готовим аргументацию.',
  'Контент будет от клиента, тексты пришлют до пятницы.',
  'После запуска обсудим отдельный договор на SEO.',
];

const LOST_REASONS = [
  'Выбрали другого подрядчика',
  'Не устроил бюджет',
  'Проект заморожен на неопределённый срок',
  'Нет ответа от клиента',
  'Передумали делать проект',
];

const PIPELINE: DealStage[] = [
  DealStage.LEAD,
  DealStage.BRIEF,
  DealStage.PROPOSAL,
  DealStage.CONTRACT,
  DealStage.IN_PROGRESS,
  DealStage.DELIVERY,
];

/** stage -> how many deals to seed in it */
const STAGE_PLAN: Array<[DealStage, number]> = [
  [DealStage.WON, 60], // ~40%
  [DealStage.LOST, 30], // ~20%
  [DealStage.LEAD, 12],
  [DealStage.BRIEF, 9],
  [DealStage.PROPOSAL, 9],
  [DealStage.CONTRACT, 8],
  [DealStage.IN_PROGRESS, 10],
  [DealStage.DELIVERY, 6],
];

// fakerRU embeds legal forms (ОАО/ЗАО/ГУП/…) inside company names; \b does not
// work for Cyrillic, so strip them token-wise before wrapping in our own form.
const EMBEDDED_FORMS = new Set([
  'ООО', 'АО', 'ЗАО', 'ПАО', 'ОАО', 'ИП', 'НКО', 'ГУП', 'МУП', 'ФГУП', 'ТСЖ', 'ОП',
]);

function companyName(): string {
  const raw = faker.company
    .name()
    .split(/\s+/)
    .filter((word) => !EMBEDDED_FORMS.has(word))
    .join(' ')
    .trim();
  return `${faker.helpers.arrayElement(LEGAL_FORMS)} «${raw}»`;
}

/** Random amount 80k–1.5M RUB expressed in kopecks, rounded to 5k RUB. */
function dealAmountKopecks(): number {
  const rub = faker.number.int({ min: 16, max: 300 }) * 5_000;
  return rub * 100;
}

/** Sorted random timestamps strictly inside (from, to) for stage transitions. */
function transitionDates(from: Date, to: Date, count: number): Date[] {
  const span = to.getTime() - from.getTime();
  return Array.from({ length: count }, () => new Date(from.getTime() + span * (0.05 + 0.9 * Math.random())))
    .sort((a, b) => a.getTime() - b.getTime());
}

async function main(): Promise<void> {
  faker.seed(42);

  console.log('Clearing existing data...');
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('Demo1234!', 10);
  const users = [
    { id: id(), email: 'admin@crm.dev', name: 'Александр Орлов', role: Role.ADMIN },
    { id: id(), email: 'olga@crm.dev', name: 'Ольга Соколова', role: Role.MANAGER },
    { id: id(), email: 'dmitry@crm.dev', name: 'Дмитрий Ковалёв', role: Role.MANAGER },
  ].map((u, i) => ({
    ...u,
    passwordHash,
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
    createdAt: daysAgo(400),
  }));
  await prisma.user.createMany({ data: users });
  const managers = users.filter((u) => u.role === Role.MANAGER);

  const activities: Prisma.ActivityCreateManyInput[] = [];

  console.log('Seeding clients...');
  const clients = Array.from({ length: 40 }, () => {
    const owner = faker.helpers.weightedArrayElement([
      { value: managers[0], weight: 4 },
      { value: managers[1], weight: 4 },
      { value: users[0], weight: 1 },
    ]);
    // Skew client signups to the past so deals spread across ~13 months and the
    // analytics "previous period" (6-12 months back) has real numbers to compare to.
    const createdAt = faker.date.between(
      Math.random() < 0.6
        ? { from: daysAgo(390), to: daysAgo(150) }
        : { from: daysAgo(150), to: daysAgo(10) },
    );
    return {
      id: id(),
      companyName: companyName(),
      contactName: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number({ style: 'international' }),
      source: faker.helpers.weightedArrayElement([
        { value: ClientSource.WEBSITE, weight: 3 },
        { value: ClientSource.REFERRAL, weight: 3 },
        { value: ClientSource.SOCIAL, weight: 2 },
        { value: ClientSource.COLD, weight: 1 },
        { value: ClientSource.OTHER, weight: 1 },
      ]),
      ownerId: owner.id,
      createdAt,
      updatedAt: createdAt,
    };
  });
  await prisma.client.createMany({ data: clients });
  for (const client of clients) {
    activities.push({
      id: id(),
      type: ActivityType.CLIENT_CREATED,
      payload: { companyName: client.companyName },
      clientId: client.id,
      userId: client.ownerId,
      createdAt: client.createdAt,
    });
  }

  console.log('Seeding deals...');
  const deals: Prisma.DealCreateManyInput[] = [];
  const tasks: Prisma.TaskCreateManyInput[] = [];
  const notes: Prisma.NoteCreateManyInput[] = [];

  const oldestClient = clients.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b));

  for (const [stage, count] of STAGE_PLAN) {
    for (let i = 0; i < count; i++) {
      const isClosed = stage === DealStage.WON || stage === DealStage.LOST;

      // Closed deals: pick the creation date uniformly across the whole history
      // FIRST, then a client that already existed — otherwise closures pile up in
      // recent months and analytics charts get near-empty early months.
      let client: (typeof clients)[number];
      let createdAt: Date;
      if (isClosed) {
        createdAt = faker.date.between({ from: daysAgo(375), to: daysAgo(45) });
        const existing = clients.filter((c) => c.createdAt <= createdAt);
        client = existing.length > 0 ? faker.helpers.arrayElement(existing) : oldestClient;
        if (createdAt < client.createdAt) createdAt = client.createdAt;
      } else {
        client = faker.helpers.arrayElement(clients);
        createdAt = faker.date.between({ from: client.createdAt, to: daysAgo(3) });
      }
      // Managers mostly own their clients' deals; sometimes another manager picks one up.
      const ownerId =
        Math.random() < 0.8 ? client.ownerId : faker.helpers.arrayElement(managers).id;
      const closedAt = isClosed
        ? clampToPast(addDays(createdAt, faker.number.int({ min: 10, max: 75 })))
        : null;

      // How far along the pipeline this deal travelled before its current/terminal stage.
      const reached = isClosed
        ? stage === DealStage.WON
          ? PIPELINE.length // walked the whole pipeline, then WON
          : faker.number.int({ min: 1, max: PIPELINE.length }) // dropped somewhere, then LOST
        : PIPELINE.indexOf(stage) + 1;
      const path = [...PIPELINE.slice(0, reached), ...(isClosed ? [stage] : [])];

      const historyEnd = closedAt ?? clampToPast(addDays(createdAt, 60));
      const changeDates = transitionDates(createdAt, historyEnd, path.length - 1);
      if (isClosed) changeDates[changeDates.length - 1] = closedAt as Date;
      const lastTouch = changeDates.length > 0 ? changeDates[changeDates.length - 1] : createdAt;

      const dealId = id();
      const deal: Prisma.DealCreateManyInput = {
        id: dealId,
        title: `${faker.helpers.arrayElement(SERVICES)} для ${client.companyName}`,
        amount: dealAmountKopecks(),
        stage,
        clientId: client.id,
        ownerId,
        expectedCloseDate: addDays(createdAt, faker.number.int({ min: 30, max: 90 })),
        closedAt,
        lostReason: stage === DealStage.LOST ? faker.helpers.arrayElement(LOST_REASONS) : null,
        createdAt,
        updatedAt: lastTouch,
      };
      deals.push(deal);

      activities.push({
        id: id(),
        type: ActivityType.DEAL_CREATED,
        payload: { title: deal.title, amount: deal.amount },
        dealId,
        clientId: client.id,
        userId: ownerId,
        createdAt,
      });
      for (let step = 1; step < path.length; step++) {
        activities.push({
          id: id(),
          type: ActivityType.STAGE_CHANGED,
          payload: { from: path[step - 1], to: path[step] },
          dealId,
          clientId: client.id,
          userId: ownerId,
          createdAt: changeDates[step - 1],
        });
      }

      // Tasks: open deals get the most attention, closed ones keep their history.
      const taskCount = isClosed
        ? faker.number.int({ min: 0, max: 2 })
        : faker.number.int({ min: 1, max: 3 });
      for (let t = 0; t < taskCount; t++) {
        const taskCreatedAt = faker.date.between({ from: createdAt, to: lastTouch });
        const done = isClosed ? Math.random() < 0.85 : Math.random() < 0.35;
        const dueDate = addDays(taskCreatedAt, faker.number.int({ min: 2, max: 21 }));
        const task: Prisma.TaskCreateManyInput = {
          id: id(),
          title: faker.helpers.arrayElement(TASK_TITLES),
          description: Math.random() < 0.4 ? faker.helpers.arrayElement(NOTE_BODIES) : null,
          status: done
            ? TaskStatus.DONE
            : faker.helpers.arrayElement([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
          dueDate,
          dealId,
          assigneeId: ownerId,
          createdAt: taskCreatedAt,
        };
        tasks.push(task);
        activities.push({
          id: id(),
          type: ActivityType.TASK_CREATED,
          payload: { taskId: task.id, title: task.title },
          dealId,
          clientId: client.id,
          userId: ownerId,
          createdAt: taskCreatedAt,
        });
        if (done) {
          const completedAt = clampToPast(
            addDays(dueDate, faker.number.int({ min: -2, max: 3 })),
          );
          activities.push({
            id: id(),
            type: ActivityType.TASK_COMPLETED,
            payload: { taskId: task.id, title: task.title },
            dealId,
            clientId: client.id,
            userId: ownerId,
            createdAt: completedAt < taskCreatedAt ? taskCreatedAt : completedAt,
          });
        }
      }

      const noteCount = faker.number.int({ min: 0, max: 2 });
      for (let n = 0; n < noteCount; n++) {
        const noteCreatedAt = faker.date.between({ from: createdAt, to: lastTouch });
        const note: Prisma.NoteCreateManyInput = {
          id: id(),
          body: faker.helpers.arrayElement(NOTE_BODIES),
          dealId,
          authorId: ownerId,
          createdAt: noteCreatedAt,
        };
        notes.push(note);
        activities.push({
          id: id(),
          type: ActivityType.NOTE_ADDED,
          payload: { noteId: note.id },
          dealId,
          clientId: client.id,
          userId: ownerId,
          createdAt: noteCreatedAt,
        });
      }
    }
  }

  // A few standalone tasks not linked to any deal (internal studio chores).
  for (let t = 0; t < 10; t++) {
    const assignee = faker.helpers.arrayElement(users);
    const taskCreatedAt = faker.date.between({ from: daysAgo(40), to: daysAgo(1) });
    tasks.push({
      id: id(),
      title: faker.helpers.arrayElement(TASK_TITLES),
      description: null,
      status: faker.helpers.arrayElement([
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
        TaskStatus.DONE,
      ]),
      dueDate: addDays(taskCreatedAt, faker.number.int({ min: -5, max: 20 })),
      dealId: null,
      assigneeId: assignee.id,
      createdAt: taskCreatedAt,
    });
  }

  await prisma.deal.createMany({ data: deals });
  await prisma.task.createMany({ data: tasks });
  await prisma.note.createMany({ data: notes });
  await prisma.activity.createMany({ data: activities });

  console.log(
    `Seeded: ${users.length} users, ${clients.length} clients, ${deals.length} deals, ` +
      `${tasks.length} tasks, ${notes.length} notes, ${activities.length} activities.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
