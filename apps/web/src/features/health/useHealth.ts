import { useEffect, useState } from 'react';

interface HealthStatus {
  status: 'ok';
  uptime: number;
}

type HealthState =
  | { state: 'loading' }
  | { state: 'success'; data: HealthStatus }
  | { state: 'error'; message: string };

export function useHealth(): HealthState {
  const [health, setHealth] = useState<HealthState>({ state: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/health', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthStatus>;
      })
      .then((data) => setHealth({ state: 'success', data }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setHealth({
          state: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      });

    return () => controller.abort();
  }, []);

  return health;
}
