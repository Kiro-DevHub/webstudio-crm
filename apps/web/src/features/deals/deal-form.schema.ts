import { z } from 'zod';

/** Mirrors CreateDealDto on the API; the amount is entered in rubles and sent in kopecks. */
export const dealFormSchema = z.object({
  title: z.string().trim().min(1, 'Введите название сделки').max(200),
  amountRub: z
    .number({ error: 'Укажите сумму в рублях' })
    .int('Сумма — целое число рублей')
    .min(0, 'Сумма не может быть отрицательной')
    .max(100_000_000, 'Не больше 100 млн ₽'),
  clientId: z.string().min(1, 'Выберите клиента'),
  expectedCloseDate: z.string().min(1, 'Укажите ожидаемую дату закрытия'),
  ownerId: z.string().optional(),
});

export type DealFormValues = z.input<typeof dealFormSchema>;
