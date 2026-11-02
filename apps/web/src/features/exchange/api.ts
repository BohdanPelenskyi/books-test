import type { ExchangeAction, ExchangeRequest } from '@book-exchange/shared';
import { apiClient } from '@/lib/api-client';

interface CreateExchangeRequestInput {
  bookId: string;
  message?: string;
}

export async function createExchangeRequest(
  input: CreateExchangeRequestInput,
): Promise<ExchangeRequest> {
  const { data } = await apiClient.post<ExchangeRequest>('/exchange-requests', input);
  return data;
}

export async function fetchIncomingRequests(): Promise<ExchangeRequest[]> {
  const { data } = await apiClient.get<ExchangeRequest[]>('/exchange-requests/incoming');
  return data;
}

export async function fetchOutgoingRequests(): Promise<ExchangeRequest[]> {
  const { data } = await apiClient.get<ExchangeRequest[]>('/exchange-requests/outgoing');
  return data;
}

export async function respondToExchangeRequest(
  id: string,
  action: ExchangeAction,
): Promise<ExchangeRequest> {
  const { data } = await apiClient.patch<ExchangeRequest>(`/exchange-requests/${id}`, { action });
  return data;
}
