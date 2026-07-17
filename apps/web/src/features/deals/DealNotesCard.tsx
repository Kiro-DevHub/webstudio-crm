import { Role } from '@crm/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { useAuth } from '@/features/auth/useAuth';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatRelativeTime } from '@/lib/labels';
import type { DealNote } from './deals.types';
import { useCreateNote, useDeleteNote } from './useDeals';

const noteFormSchema = z.object({
  body: z.string().trim().min(1, 'Напишите текст заметки').max(5000),
});
type NoteFormValues = z.input<typeof noteFormSchema>;

interface DealNotesCardProps {
  dealId: string;
  notes: DealNote[];
}

export function DealNotesCard({ dealId, notes }: DealNotesCardProps) {
  const { user } = useAuth();
  const createNote = useCreateNote(dealId);
  const deleteNote = useDeleteNote(dealId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { body: '' },
  });

  const canDelete = (note: DealNote) => user?.role === Role.ADMIN || note.authorId === user?.id;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createNote.mutateAsync(values.body.trim());
      reset({ body: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <h2 className="text-sm font-medium">
        Заметки{' '}
        <span className="tabular font-mono text-xs text-muted-foreground">{notes.length}</span>
      </h2>

      <form
        noValidate
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        className="flex flex-col gap-2"
      >
        <Label htmlFor="note-body" className="sr-only">
          Текст заметки
        </Label>
        <Textarea
          id="note-body"
          rows={2}
          placeholder="Что обсудили с клиентом…"
          aria-invalid={errors.body !== undefined}
          aria-describedby={errors.body !== undefined ? 'note-body-error' : undefined}
          {...register('body')}
        />
        {errors.body && (
          <p id="note-body-error" className="text-xs text-destructive">
            {errors.body.message}
          </p>
        )}
        <Button
          type="submit"
          variant="outline"
          className="self-end"
          disabled={createNote.isPending}
        >
          {createNote.isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Send aria-hidden="true" />
          )}
          Добавить заметку
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Заметок пока нет.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id} className="group/note flex items-start gap-2.5 py-2.5 last:pb-0">
              <UserAvatar
                name={note.author.name}
                color={note.author.avatarColor}
                className="mt-0.5"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  {note.author.name} ·{' '}
                  <time dateTime={note.createdAt}>{formatRelativeTime(note.createdAt)}</time>
                </span>
                <p className="text-sm/snug whitespace-pre-wrap">{note.body}</p>
              </div>
              {canDelete(note) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Удалить заметку"
                  className="text-muted-foreground opacity-0 transition-opacity group-hover/note:opacity-100 focus-visible:opacity-100 hover:text-destructive"
                  disabled={deleteNote.isPending}
                  onClick={() => {
                    deleteNote.mutate(note.id, {
                      onError: (error) => {
                        toast.error(getApiErrorMessage(error));
                      },
                    });
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
