import { DealStage } from '@crm/shared';
import { Check, Trophy, XCircle } from 'lucide-react';
import { DEAL_STAGE_LABELS, OPEN_DEAL_STAGES } from '@/lib/labels';
import { cn } from '@/lib/utils';

interface StageStepperProps {
  stage: DealStage;
}

/**
 * The pipeline as a read-only progress strip. Open deals show how far they have come;
 * a closed deal shows the whole track plus its terminal outcome chip.
 */
export function StageStepper({ stage }: StageStepperProps) {
  const isWon = stage === DealStage.WON;
  const isLost = stage === DealStage.LOST;
  const currentIndex = isWon ? OPEN_DEAL_STAGES.length : OPEN_DEAL_STAGES.indexOf(stage);

  return (
    <ol
      aria-label="Стадии сделки"
      className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border px-3 py-2"
    >
      {OPEN_DEAL_STAGES.map((step, index) => {
        const done = !isLost && index < currentIndex;
        const current = !isLost && !isWon && index === currentIndex;
        return (
          <li key={step} className="flex shrink-0 items-center gap-1">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn('h-px w-4 sm:w-6', done || current ? 'bg-primary/50' : 'bg-border')}
              />
            )}
            <span
              aria-current={current ? 'step' : undefined}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs whitespace-nowrap',
                current && 'bg-primary/10 font-medium text-primary',
                done && 'text-foreground',
                !done && !current && 'text-muted-foreground',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-4 shrink-0 place-items-center rounded-full border text-[9px]',
                  done && 'border-primary/50 bg-primary/10 text-primary',
                  current && 'border-primary bg-primary text-primary-foreground',
                  !done && !current && 'border-border',
                )}
              >
                {done ? <Check className="size-2.5" /> : index + 1}
              </span>
              {DEAL_STAGE_LABELS[step]}
            </span>
          </li>
        );
      })}

      {(isWon || isLost) && (
        <li className="flex shrink-0 items-center gap-1">
          <span
            aria-hidden="true"
            className={cn('h-px w-4 sm:w-6', isWon ? 'bg-success/50' : 'bg-destructive/50')}
          />
          <span
            aria-current="step"
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
              isWon ? 'bg-success/12 text-success' : 'bg-destructive/10 text-destructive',
            )}
          >
            {isWon ? (
              <Trophy aria-hidden="true" className="size-3.5" />
            ) : (
              <XCircle aria-hidden="true" className="size-3.5" />
            )}
            {DEAL_STAGE_LABELS[stage]}
          </span>
        </li>
      )}
    </ol>
  );
}
