export const ExchangeStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED',
} as const;

export type ExchangeStatus = (typeof ExchangeStatus)[keyof typeof ExchangeStatus];
