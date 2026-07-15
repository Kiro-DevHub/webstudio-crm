import { Role } from '@crm/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHealth } from '@/features/health/useHealth';

export function HomePage() {
  const health = useHealth();

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>WebStudio CRM</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">API status:</span>
            {health.state === 'loading' && <Badge variant="secondary">checking…</Badge>}
            {health.state === 'success' && (
              <Badge variant="default">
                {health.data.status} · uptime {Math.round(health.data.uptime)}s
              </Badge>
            )}
            {health.state === 'error' && (
              <Badge variant="destructive">error: {health.message}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Roles resolved from @crm/shared: {Object.values(Role).join(', ')}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
