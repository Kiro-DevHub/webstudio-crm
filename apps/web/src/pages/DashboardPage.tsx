import { Role } from '@crm/shared';
import { DashboardGrid } from '@/features/analytics/DashboardGrid';
import { DashboardToolbar } from '@/features/analytics/DashboardToolbar';
import { KpiRow } from '@/features/analytics/KpiRow';
import { useDashboardParams } from '@/features/analytics/useDashboardParams';
import { useAuth } from '@/features/auth/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const { params, months, ownerId, setMonths, setOwnerId } = useDashboardParams();
  const isAdmin = user?.role === Role.ADMIN;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Обзор</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Показатели студии за выбранный период: выручка, воронка, менеджеры и последние события.
        </p>
      </div>

      <DashboardToolbar
        months={months}
        ownerId={ownerId}
        canFilterByManager={isAdmin}
        onMonthsChange={setMonths}
        onOwnerChange={setOwnerId}
      />

      <KpiRow params={params} />
      <DashboardGrid params={params} />
    </div>
  );
}
