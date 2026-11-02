import { z } from 'zod';
import { MESSAGE_MAX_LENGTH } from './constants';

export const exchangeRequestSchema = z.object({
  message: z.string().trim().max(MESSAGE_MAX_LENGTH, `Не більше ${MESSAGE_MAX_LENGTH} символів`),
});

export type ExchangeRequestFormValues = z.infer<typeof exchangeRequestSchema>;
