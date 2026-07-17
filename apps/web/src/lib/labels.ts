import { ClientSource, DealStage } from '@crm/shared';

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

/** Column headers and drop zones: "4,5 млн ₽" instead of a nine-digit sum. */
export function formatMoneyCompact(kopecks: number): string {
  return compactMoneyFormatter.format(kopecks / 100);
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
