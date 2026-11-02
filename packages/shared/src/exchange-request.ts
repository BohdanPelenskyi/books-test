import type { ExchangeStatus } from './exchange-status';

export const ExchangeAction = {
  ACCEPT: 'accept',
  DECLINE: 'decline',
  CANCEL: 'cancel',
} as const;

export type ExchangeAction = (typeof ExchangeAction)[keyof typeof ExchangeAction];

export interface ExchangeParty {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface ExchangeRequestBook {
  id: string;
  name: string;
  author: string;
  photoUrl: string | null;
}

export interface ExchangeRequest {
  id: string;
  status: ExchangeStatus;
  message: string | null;
  createdAt: string;
  book: ExchangeRequestBook;
  requester: ExchangeParty;
  owner: ExchangeParty;
}
