import { ClientSource, Role } from '@crm/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/features/auth/useAuth';
import { useUsersLite } from '@/features/users/useUsersLite';
import { getApiErrorMessage } from '@/lib/api-error';
import { CLIENT_SOURCE_LABELS } from '@/lib/labels';
import { clientFormSchema, type ClientFormValues } from './client-form.schema';
import type { ClientListItem } from './clients.types';
import { useCreateClient, useUpdateClient } from './useClients';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientListItem | null;
}

const EMPTY_VALUES: ClientFormValues = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  source: ClientSource.WEBSITE,
  ownerId: undefined,
};

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === Role.ADMIN;
  const { data: owners } = useUsersLite();
  const isEdit = client !== null;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    mode: 'onBlur',
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      client === null
        ? EMPTY_VALUES
        : {
            companyName: client.companyName,
            contactName: client.contactName,
            email: client.email,
            phone: client.phone,
            source: client.source,
            ownerId: client.ownerId,
          },
    );
  }, [open, client, reset]);

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isPending = createClient.isPending || updateClient.isPending;

  const onSubmit = handleSubmit(async (values) => {
    const input = { ...values, ownerId: isAdmin ? values.ownerId : undefined };
    try {
      if (isEdit) {
        await updateClient.mutateAsync({ id: client.id, input });
      } else {
        await createClient.mutateAsync(input);
      }
      toast.success(isEdit ? 'Клиент обновлён' : 'Клиент добавлен');
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать клиента' : 'Новый клиент'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Измените данные клиента и сохраните изменения.'
              : 'Заполните данные, чтобы добавить клиента в базу.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="client-form"
          onSubmit={(event) => {
            void onSubmit(event);
          }}
          noValidate
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Компания</Label>
            <Input
              id="companyName"
              autoFocus
              aria-invalid={errors.companyName !== undefined}
              aria-describedby={errors.companyName !== undefined ? 'companyName-error' : undefined}
              {...register('companyName')}
            />
            {errors.companyName && (
              <p id="companyName-error" className="text-xs text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactName">Контактное лицо</Label>
            <Input
              id="contactName"
              aria-invalid={errors.contactName !== undefined}
              aria-describedby={errors.contactName !== undefined ? 'contactName-error' : undefined}
              {...register('contactName')}
            />
            {errors.contactName && (
              <p id="contactName-error" className="text-xs text-destructive">
                {errors.contactName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                aria-invalid={errors.email !== undefined}
                aria-describedby={errors.email !== undefined ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                aria-invalid={errors.phone !== undefined}
                aria-describedby={errors.phone !== undefined ? 'phone-error' : undefined}
                {...register('phone')}
              />
              {errors.phone && (
                <p id="phone-error" className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="source">Источник</Label>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="source" className="w-full">
                    <SelectValue placeholder="Выберите источник">
                      {(value: ClientSource | null) =>
                        value === null ? '' : CLIENT_SOURCE_LABELS[value]
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ClientSource).map((value) => (
                      <SelectItem key={value} value={value}>
                        {CLIENT_SOURCE_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.source && <p className="text-xs text-destructive">{errors.source.message}</p>}
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ownerId">Владелец</Label>
              <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? user?.id} onValueChange={field.onChange}>
                    <SelectTrigger id="ownerId" className="w-full">
                      <SelectValue placeholder="Выберите владельца">
                        {(value: string | null) =>
                          owners?.find((owner) => owner.id === value)?.name ?? ''
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {owners?.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" form="client-form" disabled={isPending}>
            {isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
            {isEdit ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
