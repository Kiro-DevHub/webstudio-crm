import { TaskStatus } from '@crm/shared';
import { AlarmClock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeal } from '@/features/deals/useDeals';
import { TASK_STATUS_LABELS } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { DealFilterCombobox } from './DealFilterCombobox';

const ALL_VALUE = '__all__';
const STATUS_ORDER: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];

interface TasksToolbarProps {
  status: TaskStatus | undefined;
  overdue: boolean;
  dealId: string | undefined;
  hasFilters: boolean;
  onStatusChange: (status: TaskStatus | undefined) => void;
  onOverdueChange: (overdue: boolean) => void;
  onDealChange: (dealId: string | undefined) => void;
  onClear: () => void;
}

export function TasksToolbar({
  status,
  overdue,
  dealId,
  hasFilters,
  onStatusChange,
  onOverdueChange,
  onDealChange,
  onClear,
}: TasksToolbarProps) {
  // A dealId restored from the URL is a bare id; the combobox needs the deal's title to show it.
  const { data: filterDeal } = useDeal(dealId);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Select
        value={status ?? ALL_VALUE}
        onValueChange={(value) => {
          onStatusChange(value === ALL_VALUE || value === null ? undefined : (value as TaskStatus));
        }}
      >
        <SelectTrigger aria-label="Фильтр по статусу" className="w-full sm:w-44">
          <SelectValue placeholder="Статус">
            {(value: string) =>
              value === ALL_VALUE ? 'Все статусы' : TASK_STATUS_LABELS[value as TaskStatus]
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Все статусы</SelectItem>
          {STATUS_ORDER.map((value) => (
            <SelectItem key={value} value={value}>
              {TASK_STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        aria-pressed={overdue}
        onClick={() => {
          onOverdueChange(!overdue);
        }}
        className={cn(overdue && 'border-warning/40 bg-warning/10 text-warning hover:text-warning')}
      >
        <AlarmClock aria-hidden="true" />
        Только просроченные
      </Button>

      <div className="w-full sm:w-64">
        <DealFilterCombobox
          value={
            dealId !== undefined && filterDeal !== undefined
              ? { id: filterDeal.id, title: filterDeal.title }
              : null
          }
          onChange={(deal) => {
            onDealChange(deal?.id);
          }}
        />
      </div>

      {hasFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <X aria-hidden="true" />
          Сбросить
        </Button>
      )}
    </div>
  );
}
