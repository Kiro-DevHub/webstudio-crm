import { Role } from '@crm/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { ClientCombobox } from './ClientCombobox';
import { dealFormSchema, type DealFormValues } from './deal-form.schema';
import type { DealClientLite } from './deals.types';
import { useCreateDeal } from './useDeals';

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Default close expectation: a month from now, in the date input's YYYY-MM-DD format. */
function defaultCloseDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function DealFormDialog({ open, onOpenChange }: DealFormDialogProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === Role.ADMIN;
  const { data: owners } = useUsersLite();
  const [selectedClient, setSelectedClient] = useState<DealClientLite | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      clientId: '',
      expectedCloseDate: defaultCloseDate(),
      ownerId: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: '',
      clientId: '',
      expectedCloseDate: defaultCloseDate(),
      ownerId: undefined,
    });
    setSelectedClient(null);
  }, [open, reset]);

  const createDeal = useCreateDeal();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createDeal.mutateAsync({
        title: values.title,
        amount: Math.round(values.amountRub * 100),
        clientId: values.clientId,
        expectedCloseDate: new Date(`${values.expectedCloseDate}T00:00:00`).toISOString(),
        ownerId: isAdmin ? values.ownerId : undefined,
      });
      toast.success('Сделка создана');
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая сделка</DialogTitle>
          <DialogDescription>
            Сделка создаётся на стадии «Лид» и сразу попадает на доску.
          </DialogDescription>
        </DialogHeader>

        <form
          id="deal-form"
          onSubmit={(event) => {
            void onSubmit(event);
          }}
          noValidate
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deal-title">Название</Label>
            <Input
              id="deal-title"
              autoFocus
              placeholder="Корпоративный сайт для…"
              aria-invalid={errors.title !== undefined}
              aria-describedby={errors.title !== undefined ? 'deal-title-error' : undefined}
              {...register('title')}
            />
            {errors.title && (
              <p id="deal-title-error" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deal-client">Клиент</Label>
            <ClientCombobox
              id="deal-client"
              value={selectedClient}
              onChange={(client) => {
                setSelectedClient(client);
                setValue('clientId', client?.id ?? '', { shouldValidate: client !== null });
              }}
              aria-invalid={errors.clientId !== undefined}
              aria-describedby={errors.clientId !== undefined ? 'deal-client-error' : undefined}
            />
            {errors.clientId && (
              <p id="deal-client-error" className="text-xs text-destructive">
                {errors.clientId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-amount">Сумма, ₽</Label>
              <Input
                id="deal-amount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                placeholder="150 000"
                className="tabular font-mono"
                aria-invalid={errors.amountRub !== undefined}
                aria-describedby={errors.amountRub !== undefined ? 'deal-amount-error' : undefined}
                {...register('amountRub', { valueAsNumber: true })}
              />
              {errors.amountRub && (
                <p id="deal-amount-error" className="text-xs text-destructive">
                  {errors.amountRub.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-close-date">Закрытие (план)</Label>
              <Input
                id="deal-close-date"
                type="date"
                className="tabular font-mono"
                aria-invalid={errors.expectedCloseDate !== undefined}
                aria-describedby={
                  errors.expectedCloseDate !== undefined ? 'deal-close-date-error' : undefined
                }
                {...register('expectedCloseDate')}
              />
              {errors.expectedCloseDate && (
                <p id="deal-close-date-error" className="text-xs text-destructive">
                  {errors.expectedCloseDate.message}
                </p>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-owner">Владелец</Label>
              <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? user?.id} onValueChange={field.onChange}>
                    <SelectTrigger id="deal-owner" className="w-full">
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
          <Button type="submit" form="deal-form" disabled={createDeal.isPending}>
            {createDeal.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
            Создать сделку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
