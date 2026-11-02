import { z } from 'zod';

const TEXT_MAX_LENGTH = 200;

export const bookFormSchema = z.object({
  name: z.string().trim().min(1, 'Вкажіть назву').max(TEXT_MAX_LENGTH, 'Занадто довга назва'),
  author: z.string().trim().min(1, 'Вкажіть автора').max(TEXT_MAX_LENGTH, 'Занадто довге імʼя'),
  photoUrl: z.union([
    z.literal(''),
    z.url({ protocol: /^https?$/, message: 'Вкажіть коректне посилання (http або https)' }),
  ]),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;
