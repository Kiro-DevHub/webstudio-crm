import { Role } from '@crm/shared';
import { AlertCircle, Briefcase, Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { useAuth } from '@/features/auth/useAuth';
import {
  CLIENT_SOURCE_LABELS,
  DEAL_STAGE_BADGE_CLASS,
  DEAL_STAGE_LABELS,
  formatDateTime,
  formatMoney,
} from '@/lib/labels';
import { describeActivity } from '@/lib/activity';
import type { ClientListItem } from './clients.types';
import { useClient } from './useClients';

interface ClientDetailsDrawerProps {
  clientId: string | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (client: ClientListItem) => void;
  onDelete: (client: ClientListItem) => void;
}

export function ClientDetailsDrawer({
  clientId,
  onOpenChange,
  onEdit,
  onDelete,
}: ClientDetailsDrawerProps) {
  const { user } = useAuth();
  const { data: client, isLoading, isError, refetch } = useClient(clientId);
  const canMutate =
    client !== undefined && (user?.role === Role.ADMIN || client.ownerId === user?.id);

  return (
    <Sheet open={clientId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {isLoading && (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertCircle aria-hidden="true" className="size-6 text-destructive" />
            <p className="text-sm text-muted-foreground">Не удалось загрузить данные клиента.</p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Повторить
            </Button>
          </div>
        )}

        {client !== undefined && (
          <>
            <SheetHeader>
              <SheetTitle>{client.companyName}</SheetTitle>
              <SheetDescription>{client.contactName}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4 pb-4">
              {canMutate && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onEdit(client);
                    }}
                  >
                    <Pencil aria-hidden="true" />
                    Редактировать
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onDelete(client);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                    Удалить
                  </Button>
                </div>
              )}

              <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="font-mono">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="tabular font-mono">{client.phone}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Badge variant="outline">{CLIENT_SOURCE_LABELS[client.source]}</Badge>
                  <div className="flex items-center gap-2">
                    <UserAvatar name={client.owner.name} color={client.owner.avatarColor} />
                    <span className="text-xs text-muted-foreground">{client.owner.name}</span>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="flex items-center gap-1.5 text-sm font-medium">
                  <Briefcase aria-hidden="true" className="size-4 text-muted-foreground" />
                  Сделки ({client.deals.length})
                </h2>
                {client.deals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">У клиента пока нет сделок.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {client.deals.map((deal) => (
                      <li key={deal.id} className="flex items-center justify-between gap-2 p-2.5">
                        <div className="flex flex-col">
                          <span className="text-sm">{deal.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(deal.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="tabular font-mono text-sm">
                            {formatMoney(deal.amount)}
                          </span>
                          <Badge className={DEAL_STAGE_BADGE_CLASS[deal.stage]} variant="secondary">
                            {DEAL_STAGE_LABELS[deal.stage]}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <Separator />

              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-medium">Последние действия</h2>
                {client.activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Активности пока нет.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {client.activities.map((activity) => (
                      <li key={activity.id} className="flex items-start gap-2">
                        <UserAvatar
                          name={activity.user.name}
                          color={activity.user.avatarColor}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">{describeActivity(activity)}</span>
                          <span className="text-xs text-muted-foreground">
                            {activity.user.name} · {formatDateTime(activity.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
