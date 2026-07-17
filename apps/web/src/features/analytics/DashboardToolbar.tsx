import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsersLite } from '@/features/users/useUsersLite';
import { cn } from '@/lib/utils';
import { PERIOD_MONTHS, type PeriodMonths } from './useDashboardParams';

const ALL_VALUE = '__all__';
const PERIOD_LABELS: Record<PeriodMonths, string> = { 3: '3 мес', 6: '6 мес', 12: '12 мес' };

interface DashboardToolbarProps {
  months: PeriodMonths;
  ownerId: string | undefined;
  /** ADMIN sees the manager lens; managers only get the period switch. */
  canFilterByManager: boolean;
  onMonthsChange: (months: PeriodMonths) => void;
  onOwnerChange: (ownerId: string | undefined) => void;
}

/** The one filter row above every widget: it scopes the whole dashboard, so all cards agree. */
export function DashboardToolbar({
  months,
  ownerId,
  canFilterByManager,
  onMonthsChange,
  onOwnerChange,
}: DashboardToolbarProps) {
  const { data: managers } = useUsersLite();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Период"
        className="flex w-fit rounded-lg border border-border p-0.5"
      >
        {PERIOD_MONTHS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={months === value}
            onClick={() => {
              onMonthsChange(value);
            }}
            className={cn(
              'h-7 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              months === value
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {PERIOD_LABELS[value]}
          </button>
        ))}
      </div>

      {canFilterByManager && (
        <Select
          value={ownerId ?? ALL_VALUE}
          onValueChange={(value) => {
            onOwnerChange(value === ALL_VALUE || value === null ? undefined : value);
          }}
        >
          <SelectTrigger aria-label="Фильтр по менеджеру" className="w-full sm:w-52">
            <SelectValue placeholder="Менеджер">
              {(value: string) =>
                value === ALL_VALUE
                  ? 'Все менеджеры'
                  : (managers?.find((manager) => manager.id === value)?.name ?? 'Менеджер')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Все менеджеры</SelectItem>
            {managers?.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                {manager.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
