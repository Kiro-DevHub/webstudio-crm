import type { LucideIcon } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  /** What this section will do once its stage lands. */
  description: string;
  icon: LucideIcon;
}

/** Stage 5 ships the shell only: every section is reachable, none of them load data yet. */
export function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

      <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <Icon aria-hidden="true" className="size-6 text-muted-foreground" strokeWidth={1.5} />
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
