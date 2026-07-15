import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma, Task, TaskStatus } from '@prisma/client';
import { ResourceAccessService } from '../../common/access/resource-access.service';
import { paginated, Paginated } from '../../common/dto/paginated';
import { SAFE_USER_SELECT, SafeUser } from '../../common/types/user.types';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const TASK_INCLUDE = {
  assignee: { select: SAFE_USER_SELECT },
  deal: { select: { id: true, title: true, stage: true } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ResourceAccessService,
    private readonly activity: ActivityService,
  ) {}

  async list(query: ListTasksQueryDto): Promise<Paginated<Task>> {
    const where: Prisma.TaskWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.dealId ? { dealId: query.dealId } : {}),
      // "Overdue" means past due and still open — a finished task is never overdue.
      ...(query.overdue ? { dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: TASK_INCLUDE,
      }),
      this.prisma.task.count({ where }),
    ]);
    return paginated(data, total, query);
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async create(dto: CreateTaskDto, actor: SafeUser): Promise<Task> {
    const clientId = dto.dealId ? await this.loadDealClientId(dto.dealId) : null;
    const assigneeId = await this.access.resolveOwnerId(actor, dto.assigneeId);

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({ data: { ...dto, assigneeId } });
      await this.activity.record(
        {
          type: ActivityType.TASK_CREATED,
          payload: { taskId: task.id, title: task.title },
          dealId: task.dealId,
          clientId,
          userId: actor.id,
        },
        tx,
      );
      return task;
    });
  }

  async update(id: string, dto: UpdateTaskDto, actor: SafeUser): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: {
        status: true,
        assigneeId: true,
        dealId: true,
        deal: { select: { clientId: true } },
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    this.access.assertOwnership(actor, task.assigneeId);
    const assigneeId =
      dto.assigneeId === undefined
        ? undefined
        : await this.access.resolveOwnerId(actor, dto.assigneeId);
    const completed = dto.status === TaskStatus.DONE && task.status !== TaskStatus.DONE;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({ where: { id }, data: { ...dto, assigneeId } });
      if (completed) {
        await this.activity.record(
          {
            type: ActivityType.TASK_COMPLETED,
            payload: { taskId: id, title: updated.title },
            dealId: task.dealId,
            clientId: task.deal?.clientId ?? null,
            userId: actor.id,
          },
          tx,
        );
      }
      return updated;
    });
  }

  async remove(id: string, actor: SafeUser): Promise<void> {
    await this.access.assertCanMutate('task', id, actor);
    await this.prisma.task.delete({ where: { id } });
  }

  private async loadDealClientId(dealId: string): Promise<string> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { clientId: true },
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    return deal.clientId;
  }
}
