import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DealBoardItem } from './deals.types';

interface LostReasonDialogProps {
  deal: DealBoardItem | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * The API refuses LOST without a reason, so the board asks for one before it even tries.
 * Cancelling leaves the deal exactly where it was — no request, nothing to roll back.
 */
export function LostReasonDialog({ deal, onCancel, onConfirm }: LostReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const open = deal !== null;

  useEffect(() => {
    if (open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  const trimmed = reason.trim();
  const showError = touched && trimmed === '';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Закрыть сделку как проигранную</DialogTitle>
          <DialogDescription>
            {deal !== null && (
              <>
                «{deal.title}» — {deal.client.companyName}. Укажите причину: без неё сделка
                останется на текущей стадии.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          id="lost-reason-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed === '') {
              setTouched(true);
              return;
            }
            onConfirm(trimmed);
          }}
          className="flex flex-col gap-1.5"
        >
          <Label htmlFor="lostReason">Причина проигрыша</Label>
          <Textarea
            id="lostReason"
            autoFocus
            required
            maxLength={500}
            placeholder="Например: выбрали другого подрядчика"
            value={reason}
            aria-invalid={showError}
            aria-describedby={showError ? 'lostReason-error' : undefined}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            onBlur={() => {
              setTouched(true);
            }}
          />
          {showError && (
            <p id="lostReason-error" className="text-xs text-destructive">
              Укажите причину, чтобы закрыть сделку.
            </p>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            type="submit"
            form="lost-reason-form"
            variant="destructive"
            disabled={trimmed === ''}
          >
            Закрыть сделку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
