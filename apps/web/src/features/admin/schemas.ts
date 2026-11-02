import { Role } from '@book-exchange/shared';
import { z } from 'zod';

const NAME_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

const userFormFields = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Вкажіть ім'я")
    .max(NAME_MAX_LENGTH, `Не більше ${NAME_MAX_LENGTH} символів`),
  email: z.string().trim().min(1, 'Вкажіть email').email('Некоректний email'),
  role: z.enum([Role.USER, Role.ADMIN]),
  password: z.string(),
});

export type UserFormValues = z.infer<typeof userFormFields>;

/** When editing, an empty password means "keep the current one". */
export function buildUserFormSchema(isEditing: boolean) {
  return userFormFields.superRefine(({ password }, context) => {
    const isPasswordRequired = !isEditing;
    if (password === '' && !isPasswordRequired) {
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: `Мінімум ${PASSWORD_MIN_LENGTH} символів`,
      });
    } else if (password.length > PASSWORD_MAX_LENGTH) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: `Не більше ${PASSWORD_MAX_LENGTH} символів`,
      });
    }
  });
}
