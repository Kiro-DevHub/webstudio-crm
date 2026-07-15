import { Loader2 } from 'lucide-react';

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background" role="status">
      <Loader2 aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
      <span className="sr-only">Загрузка…</span>
    </div>
  );
}
