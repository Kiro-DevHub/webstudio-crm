import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import type { ClientListItem } from './clients.types';
import { useDeleteClient } from './useClients';

interface DeleteClientDialogProps {
  client: ClientListItem | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteClientDialog({ client, onOpenChange }: DeleteClientDialogProps) {
  const deleteClient = useDeleteClient();

  return (
    <AlertDialog open={client !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
          <AlertDialogDescription>
            {client !== null && (
              <>
                Клиент «{client.companyName}» и все его сделки будут удалены без возможности
                восстановления.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteClient.isPending}
            onClick={() => {
              if (client === null) return;
              deleteClient.mutate(client.id, {
                onSuccess: () => {
                  toast.success('Клиент удалён');
                  onOpenChange(false);
                },
                onError: (error: unknown) => {
                  toast.error(getApiErrorMessage(error));
                  onOpenChange(false);
                },
              });
            }}
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
