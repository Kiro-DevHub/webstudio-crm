import { FunnelCard } from './FunnelCard';
import { LostReasonsCard } from './LostReasonsCard';
import { RecentActivityCard } from './RecentActivityCard';
import { RevenueChart } from './RevenueChart';
import { TopManagersCard } from './TopManagersCard';
import { Widget } from './Widget';
import { BarsSkeleton, FeedSkeleton, ManagersSkeleton, RevenueSkeleton } from './skeletons';
import type { AnalyticsParams } from './analytics.types';
import {
  useFunnel,
  useLostReasons,
  useRecentActivity,
  useRevenueByMonth,
  useTopManagers,
} from './useAnalytics';

interface DashboardGridProps {
  params: AnalyticsParams;
}

/**
 * Every widget owns its query, so the grid loads and fails piecewise — one dead endpoint
 * shows its card's retry while the rest keep their data. The bento puts the revenue hero
 * across four columns with the funnel beside it, then three equal analytical cards below.
 */
export function DashboardGrid({ params }: DashboardGridProps) {
  const revenue = useRevenueByMonth(params);
  const funnel = useFunnel(params);
  const managers = useTopManagers(params);
  const lostReasons = useLostReasons(params);
  const activity = useRecentActivity(params);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
      <Widget
        title="Выручка по месяцам"
        description="Сумма выигранных сделок, помесячно"
        errorSubject="выручку"
        className="lg:col-span-4"
        bodyClassName="px-2 pb-3"
        isLoading={revenue.isLoading}
        isError={revenue.isError}
        isFetching={revenue.isFetching}
        isEmpty={revenue.data?.length === 0}
        onRetry={() => void revenue.refetch()}
        skeleton={<RevenueSkeleton />}
      >
        {revenue.data && <RevenueChart data={revenue.data} />}
      </Widget>

      <Widget
        title="Воронка по стадиям"
        description="Где сейчас стоят сделки периода"
        errorSubject="воронку"
        className="lg:col-span-2"
        isLoading={funnel.isLoading}
        isError={funnel.isError}
        isFetching={funnel.isFetching}
        isEmpty={funnel.data?.every((stage) => stage.count === 0)}
        emptyMessage="За период не создано ни одной сделки."
        onRetry={() => void funnel.refetch()}
        skeleton={<BarsSkeleton rows={8} />}
      >
        {funnel.data && <FunnelCard data={funnel.data} />}
      </Widget>

      <Widget
        title="Топ менеджеров"
        description="По выручке за период"
        errorSubject="рейтинг менеджеров"
        className="lg:col-span-2"
        isLoading={managers.isLoading}
        isError={managers.isError}
        isFetching={managers.isFetching}
        isEmpty={managers.data?.length === 0}
        onRetry={() => void managers.refetch()}
        skeleton={<ManagersSkeleton />}
      >
        {managers.data && <TopManagersCard data={managers.data} />}
      </Widget>

      <Widget
        title="Причины проигрыша"
        description="Почему сделки уходят, по частоте"
        errorSubject="причины проигрыша"
        className="lg:col-span-2"
        isLoading={lostReasons.isLoading}
        isError={lostReasons.isError}
        isFetching={lostReasons.isFetching}
        isEmpty={lostReasons.data?.length === 0}
        emptyMessage="За период нет проигранных сделок."
        onRetry={() => void lostReasons.refetch()}
        skeleton={<BarsSkeleton rows={5} />}
      >
        {lostReasons.data && <LostReasonsCard data={lostReasons.data} />}
      </Widget>

      <Widget
        title="Последние действия"
        description="Свежие события студии"
        errorSubject="ленту действий"
        className="lg:col-span-2"
        bodyClassName="px-4 pb-4 max-h-96 overflow-y-auto"
        isLoading={activity.isLoading}
        isError={activity.isError}
        isFetching={activity.isFetching}
        isEmpty={activity.data?.length === 0}
        emptyMessage="Пока нет активности за период."
        onRetry={() => void activity.refetch()}
        skeleton={<FeedSkeleton />}
      >
        {activity.data && <RecentActivityCard data={activity.data} />}
      </Widget>
    </div>
  );
}
