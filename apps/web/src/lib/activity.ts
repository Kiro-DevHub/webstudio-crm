import { ActivityType, DealStage } from '@crm/shared';
import {
  ArrowRightLeft,
  BadgePlus,
  CheckCircle2,
  ListPlus,
  StickyNote,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { DEAL_STAGE_LABELS } from '@/lib/labels';

/** The slice of an Activity record the feed needs; both clients and deals satisfy it. */
export interface ActivityLike {
  type: ActivityType;
  payload: Record<string, unknown>;
}

function isDealStage(value: unknown): value is DealStage {
  return typeof value === 'string' && value in DealStage;
}

/** Turns a raw Activity record into one Russian sentence for the feed. */
export function describeActivity(activity: ActivityLike): string {
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

export const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  [ActivityType.DEAL_CREATED]: BadgePlus,
  [ActivityType.STAGE_CHANGED]: ArrowRightLeft,
  [ActivityType.TASK_CREATED]: ListPlus,
  [ActivityType.TASK_COMPLETED]: CheckCircle2,
  [ActivityType.NOTE_ADDED]: StickyNote,
  [ActivityType.CLIENT_CREATED]: UserPlus,
};
