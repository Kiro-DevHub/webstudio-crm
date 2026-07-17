import { ClientSource, DealStage, TaskStatus } from '@crm/shared';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'К выполнению',
  [TaskStatus.IN_PROGRESS]: 'В работе',
  [TaskStatus.DONE]: 'Выполнена',
};

export const CLIENT_SOURCE_LABELS: Record<ClientSource, string> = {
  [ClientSource.WEBSITE]: 'Сайт',
  [ClientSource.REFERRAL]: 'Рекомендация',
  [ClientSource.SOCIAL]: 'Соцсети',
  [ClientSource.COLD]: 'Холодный контакт',
  [ClientSource.OTHER]: 'Другое',
};

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  [DealStage.LEAD]: 'Лид',
  [DealStage.BRIEF]: 'Бриф',
  [DealStage.PROPOSAL]: 'Предложение',
  [DealStage.CONTRACT]: 'Договор',
  [DealStage.IN_PROGRESS]: 'В работе',
  [DealStage.DELIVERY]: 'Сдача',
  [DealStage.WON]: 'Выиграна',
  [DealStage.LOST]: 'Проиграна',
};

/** Green/red mark only terminal domain state; every open stage stays neutral. */
export const DEAL_STAGE_BADGE_CLASS: Record<DealStage, string> = {
  [DealStage.LEAD]: 'bg-muted text-muted-foreground',
  [DealStage.BRIEF]: 'bg-muted text-muted-foreground',
  [DealStage.PROPOSAL]: 'bg-muted text-muted-foreground',
  [DealStage.CONTRACT]: 'bg-muted text-muted-foreground',
  [DealStage.IN_PROGRESS]: 'bg-muted text-muted-foreground',
  [DealStage.DELIVERY]: 'bg-muted text-muted-foreground',
  [DealStage.WON]: 'bg-success/12 text-success dark:bg-success/20',
  [DealStage.LOST]: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
};

/** The pipeline in board order; WON/LOST are terminal and never rendered as columns. */
export const OPEN_DEAL_STAGES: readonly DealStage[] = [
  DealStage.LEAD,
  DealStage.BRIEF,
  DealStage.PROPOSAL,
  DealStage.CONTRACT,
  DealStage.IN_PROGRESS,
  DealStage.DELIVERY,
];

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

/** Money is stored as integer kopecks; formatting divides back to rubles. */
export function formatMoney(kopecks: number): string {
  return moneyFormatter.format(kopecks / 100);
}

const compactMoneyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Column headers, chart axes and drop zones: "4,5 млн ₽" instead of a nine-digit sum. */
export function formatMoneyCompact(kopecks: number): string {
  return compactMoneyFormatter.format(kopecks / 100);
}

const numberFormatter = new Intl.NumberFormat('ru-RU');

/** Plain counts with a thousands separator: "1 284". */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

const percentFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** A ready-made percentage value (already 0–100), e.g. a conversion rate: "42,5 %". */
export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)} %`;
}

const signedPercentFormatter = new Intl.NumberFormat('ru-RU', {
  signDisplay: 'exceptZero',
  maximumFractionDigits: 1,
});

/** A KPI delta with an explicit sign for the trend indicator: "+12,4 %", "−3 %". */
export function formatDeltaPct(value: number): string {
  return `${signedPercentFormatter.format(value)} %`;
}

const monthShortFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'short' });
const monthLongFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });

/** A `YYYY-MM` bucket as a short month tick: "2026-01" -> "янв." */
export function formatMonthShort(month: string): string {
  return monthShortFormatter.format(new Date(`${month}-01T12:00:00`));
}

/** A `YYYY-MM` bucket spelled out for a tooltip heading: "2026-01" -> "январь 2026 г." */
export function formatMonthLong(month: string): string {
  return monthLongFormatter.format(new Date(`${month}-01T12:00:00`));
}

const relativeFormatter = new Intl.RelativeTimeFormat('ru-RU', { numeric: 'auto' });

const RELATIVE_STEPS: readonly {
  limit: number;
  divisor: number;
  unit: Intl.RelativeTimeFormatUnit;
}[] = [
  { limit: 60_000, divisor: 1000, unit: 'second' },
  { limit: 3_600_000, divisor: 60_000, unit: 'minute' },
  { limit: 86_400_000, divisor: 3_600_000, unit: 'hour' },
  { limit: 7 * 86_400_000, divisor: 86_400_000, unit: 'day' },
];

/** "5 минут назад" for the activity feed; falls back to the full date after a week. */
export function formatRelativeTime(value: string): string {
  const elapsed = Date.now() - new Date(value).getTime();
  for (const step of RELATIVE_STEPS) {
    if (Math.abs(elapsed) < step.limit) {
      return relativeFormatter.format(Math.round(-elapsed / step.divisor), step.unit);
    }
  }
  return formatDateTime(value);
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}
