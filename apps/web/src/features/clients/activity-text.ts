import { ActivityType, DealStage } from '@crm/shared';
import { DEAL_STAGE_LABELS } from '@/lib/labels';
import type { ClientActivity } from './clients.types';

function isDealStage(value: unknown): value is DealStage {
  return typeof value === 'string' && value in DealStage;
}

/** Turns a raw Activity record into one Russian sentence for the feed. */
export function describeActivity(activity: ClientActivity): string {
  const { type, payload } = activity;
  switch (type) {
    case ActivityType.CLIENT_CREATED:
      return 'Клиент создан';
    case ActivityType.DEAL_CREATED: {
      const title = typeof payload.title === 'string' ? payload.title : 'сделка';
      return `Создана сделка «${title}»`;
    }
    case ActivityType.STAGE_CHANGED: {
      const from = isDealStage(payload.from)
        ? DEAL_STAGE_LABELS[payload.from]
        : String(payload.from);
      const to = isDealStage(payload.to) ? DEAL_STAGE_LABELS[payload.to] : String(payload.to);
      return `Стадия сделки изменена: ${from} → ${to}`;
    }
    case ActivityType.TASK_CREATED:
      return 'Создана задача';
    case ActivityType.TASK_COMPLETED:
      return 'Задача выполнена';
    case ActivityType.NOTE_ADDED:
      return 'Добавлена заметка';
    default:
      return 'Событие';
  }
}
