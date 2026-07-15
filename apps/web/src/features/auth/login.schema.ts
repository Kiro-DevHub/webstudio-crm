import { z } from 'zod';

/** Mirrors LoginDto on the API: a valid email and a non-empty password, nothing more. */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Введите email').pipe(z.email('Введите корректный email')),
  password: z.string().min(1, 'Введите пароль'),
});

export type LoginFormValues = z.input<typeof loginSchema>;
