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

/**
 * Green/amber/red are reserved for domain state, but no shared tokens exist for them yet
 * (that lands with the stage 7 kanban) — these are local, one-off utility classes.
 */
export const DEAL_STAGE_BADGE_CLASS: Record<DealStage, string> = {
  [DealStage.LEAD]: 'bg-muted text-muted-foreground',
  [DealStage.BRIEF]: 'bg-muted text-muted-foreground',
  [DealStage.PROPOSAL]: 'bg-muted text-muted-foreground',
  [DealStage.CONTRACT]: 'bg-muted text-muted-foreground',
  [DealStage.IN_PROGRESS]: 'bg-muted text-muted-foreground',
  [DealStage.DELIVERY]: 'bg-muted text-muted-foreground',
  [DealStage.WON]: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  [DealStage.LOST]: 'bg-destructive/10 text-destructive',
};

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

/** Money is stored as integer kopecks; formatting divides back to rubles. */
export function formatMoney(kopecks: number): string {
  return moneyFormatter.format(kopecks / 100);
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
