import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback; receives a reset callback that clears the caught error and re-renders. */
  fallback?: (reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Stops one component's render error from white-screening the whole app. Route-level usage keys
 * the boundary by pathname (see AppLayout), so navigating away clears the error; the top-level
 * one in main.tsx is the last resort for a crash in the shell itself.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // A production app would forward this to an error tracker; the console keeps it debuggable here.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error === null) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.reset);
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center"
      >
        <AlertTriangle aria-hidden="true" className="size-6 text-destructive" strokeWidth={1.5} />
        <h1 className="text-lg font-semibold tracking-tight">Что-то пошло не так</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          В этом разделе произошла ошибка. Попробуйте открыть его заново или обновить страницу.
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Button type="button" variant="outline" onClick={this.reset}>
            <RotateCcw aria-hidden="true" />
            Повторить
          </Button>
          <Button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
          >
            Обновить страницу
          </Button>
        </div>
      </div>
    );
  }
}
