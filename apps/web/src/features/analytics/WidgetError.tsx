import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WidgetErrorProps {
  /** What failed to load, in the accusative — "выручку", "воронку". */
  subject: string;
  onRetry: () => void;
}

/** One widget's failure never takes down its neighbours: it collapses to this and offers a retry. */
export function WidgetError({ subject, onRetry }: WidgetErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <AlertTriangle
        aria-hidden="true"
        className="size-5 text-muted-foreground"
        strokeWidth={1.5}
      />
      <p className="text-sm text-muted-foreground">Не удалось загрузить {subject}.</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw aria-hidden="true" />
        Повторить
      </Button>
    </div>
  );
}
