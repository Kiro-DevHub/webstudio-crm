import { DealStage } from '@crm/shared';
import { AlertCircle, ArrowLeft, Building2, CalendarClock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { DealActivityTimeline } from '@/features/deals/DealActivityTimeline';
import { DealNotesCard } from '@/features/deals/DealNotesCard';
import { DealTasksCard } from '@/features/deals/DealTasksCard';
import { StageStepper } from '@/features/deals/StageStepper';
import { useDeal } from '@/features/deals/useDeals';
import { DEAL_STAGE_BADGE_CLASS, DEAL_STAGE_LABELS, formatDate, formatMoney } from '@/lib/labels';

export function DealPage() {
  const { id } = useParams<{ id: string }>();
  const { data: deal, isLoading, isError, refetch } = useDeal(id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Link
        to="/deals"
        className="flex w-fit items-center gap-1 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Сделки
      </Link>

      {isLoading && (
        <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
          <span className="sr-only">Загрузка сделки…</span>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <AlertCircle aria-hidden="true" className="size-6 text-destructive" strokeWidth={1.5} />
          <p className="max-w-sm text-sm text-muted-foreground">
            Не удалось загрузить сделку. Возможно, её уже удалили.
          </p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Повторить
          </Button>
        </div>
      )}

      {deal !== undefined && (
        <>
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="text-lg font-semibold tracking-tight">{deal.title}</h1>
              <Badge className={DEAL_STAGE_BADGE_CLASS[deal.stage]} variant="secondary">
                {DEAL_STAGE_LABELS[deal.stage]}
              </Badge>
              <span className="tabular font-mono text-lg font-medium">
                {formatMoney(deal.amount)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <Link
                to={`/clients?search=${encodeURIComponent(deal.client.companyName)}`}
                className="flex items-center gap-1.5 rounded-md outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Building2 aria-hidden="true" className="size-4" />
                {deal.client.companyName}
              </Link>
              <span className="flex items-center gap-1.5">
                <UserAvatar
                  name={deal.owner.name}
                  color={deal.owner.avatarColor}
                  className="size-5 text-[9px]"
                />
                {deal.owner.name}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarClock aria-hidden="true" className="size-4" />
                {deal.closedAt !== null ? (
                  <>
                    Закрыта <span className="tabular font-mono">{formatDate(deal.closedAt)}</span>
                  </>
                ) : (
                  <>
                    Закрытие (план){' '}
                    <span className="tabular font-mono">{formatDate(deal.expectedCloseDate)}</span>
                  </>
                )}
              </span>
            </div>
            {deal.stage === DealStage.LOST && deal.lostReason !== null && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Причина проигрыша: {deal.lostReason}
              </p>
            )}
          </header>

          <StageStepper stage={deal.stage} />

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <div className="flex min-w-0 flex-col gap-4">
              <DealTasksCard dealId={deal.id} tasks={deal.tasks} />
              <DealNotesCard dealId={deal.id} notes={deal.notes} />
            </div>

            <section
              aria-label="История сделки"
              className="flex flex-col gap-3 rounded-lg border border-border p-3"
            >
              <h2 className="text-sm font-medium">
                Активность{' '}
                <span className="tabular font-mono text-xs text-muted-foreground">
                  {deal.activities.length}
                </span>
              </h2>
              <DealActivityTimeline activities={deal.activities} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
