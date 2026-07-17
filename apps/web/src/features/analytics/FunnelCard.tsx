import { DealStage } from '@crm/shared';
import { DEAL_STAGE_LABELS, formatMoneyCompact, formatNumber } from '@/lib/labels';
import type { FunnelStage } from './analytics.types';

/**
 * Open stages walk the ordinal cobalt ramp (light -> dark down the pipeline, so the order
 * reads in the colour); the two terminal outcomes wear their reserved domain hues — WON green,
 * LOST red — never a ramp step, so the semantics stay intact.
 */
const STAGE_FILL: Record<DealStage, string> = {
  [DealStage.LEAD]: 'var(--chart-funnel-1)',
  [DealStage.BRIEF]: 'var(--chart-funnel-2)',
  [DealStage.PROPOSAL]: 'var(--chart-funnel-3)',
  [DealStage.CONTRACT]: 'var(--chart-funnel-4)',
  [DealStage.IN_PROGRESS]: 'var(--chart-funnel-5)',
  [DealStage.DELIVERY]: 'var(--chart-funnel-6)',
  [DealStage.WON]: 'var(--success)',
  [DealStage.LOST]: 'var(--destructive)',
};

interface FunnelCardProps {
  data: FunnelStage[];
}

/** Where the period's deals sit now, in pipeline order. Bars scale to the busiest stage. */
export function FunnelCard({ data }: FunnelCardProps) {
  const max = Math.max(1, ...data.map((stage) => stage.count));

  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((stage) => (
        <li key={stage.stage} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate">{DEAL_STAGE_LABELS[stage.stage]}</span>
            <span className="tabular shrink-0 font-mono text-muted-foreground">
              <span className="text-foreground">{formatNumber(stage.count)}</span>
              {stage.amount > 0 && <> · {formatMoneyCompact(stage.amount)}</>}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(stage.count / max) * 100}%`,
                minWidth: stage.count > 0 ? '0.5rem' : 0,
                backgroundColor: STAGE_FILL[stage.stage],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
