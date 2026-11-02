import { ExchangeStatus } from '@book-exchange/shared';
import type { BadgeVariant } from '@/components/ui/Badge';

export const STATUS_DISPLAY: Readonly<
  Record<ExchangeStatus, { label: string; tone: BadgeVariant }>
> = {
  [ExchangeStatus.PENDING]: { label: 'Очікує відповіді', tone: 'warning' },
  [ExchangeStatus.ACCEPTED]: { label: 'Прийнято', tone: 'success' },
  [ExchangeStatus.DECLINED]: { label: 'Відхилено', tone: 'danger' },
  [ExchangeStatus.CANCELLED]: { label: 'Скасовано', tone: 'neutral' },
};

export const MESSAGE_MAX_LENGTH = 1000;
export const MY_BOOKS_PREVIEW_LIMIT = 50;
