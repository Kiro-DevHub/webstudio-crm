import { ClientSource } from '@crm/shared';
import { z } from 'zod';

/** Mirrors CreateClientDto on the API. */
export const clientFormSchema = z.object({
  companyName: z.string().trim().min(1, 'Введите название компании').max(200),
  contactName: z.string().trim().min(1, 'Введите имя контакта').max(100),
  email: z.string().trim().min(1, 'Введите email').pipe(z.email('Введите корректный email')),
  phone: z.string().trim().min(1, 'Введите телефон').max(30),
  source: z.enum(ClientSource, { error: 'Выберите источник' }),
  ownerId: z.string().optional(),
});

export type ClientFormValues = z.input<typeof clientFormSchema>;
