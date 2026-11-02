import { z } from 'zod';

const NAME_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Вкажіть ім'я")
    .max(NAME_MAX_LENGTH, `Не більше ${NAME_MAX_LENGTH} символів`),
  email: z.string().trim().min(1, 'Вкажіть email').email('Некоректний email'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Вкажіть поточний пароль'),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Мінімум ${PASSWORD_MIN_LENGTH} символів`)
      .max(PASSWORD_MAX_LENGTH, `Не більше ${PASSWORD_MAX_LENGTH} символів`),
    confirmPassword: z.string(),
  })
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    path: ['confirmPassword'],
    message: 'Паролі не збігаються',
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
