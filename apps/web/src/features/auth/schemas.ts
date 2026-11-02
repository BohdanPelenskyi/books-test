import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const NAME_MAX_LENGTH = 100;

const emailSchema = z.string().trim().min(1, 'Вкажіть email').email('Некоректний email');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Вкажіть пароль'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Вкажіть ім'я")
    .max(NAME_MAX_LENGTH, `Не більше ${NAME_MAX_LENGTH} символів`),
  email: emailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Мінімум ${PASSWORD_MIN_LENGTH} символів`)
    .max(PASSWORD_MAX_LENGTH, `Не більше ${PASSWORD_MAX_LENGTH} символів`),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Мінімум ${PASSWORD_MIN_LENGTH} символів`)
      .max(PASSWORD_MAX_LENGTH, `Не більше ${PASSWORD_MAX_LENGTH} символів`),
    confirmPassword: z.string(),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ['confirmPassword'],
    message: 'Паролі не збігаються',
  });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
