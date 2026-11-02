'use client';

import { ExchangeAction, ExchangeStatus } from '@book-exchange/shared';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIsClient } from '@/lib/use-is-client';
import { profileKeys } from '@/features/profile/hooks';
import { useAuthStore } from '@/stores/auth.store';
import {
  createExchangeRequest,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  respondToExchangeRequest,
} from './api';

export const exchangeKeys = {
  all: ['exchange'] as const,
  incoming: () => [...exchangeKeys.all, 'incoming'] as const,
  outgoing: () => [...exchangeKeys.all, 'outgoing'] as const,
};

const RESPONSE_MESSAGES: Record<ExchangeAction, string> = {
  [ExchangeAction.ACCEPT]: 'Запит прийнято',
  [ExchangeAction.DECLINE]: 'Запит відхилено',
  [ExchangeAction.CANCEL]: 'Запит скасовано',
};

function invalidateExchangeData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: exchangeKeys.all }),
    queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  ]);
}

function useIsSignedIn(): boolean {
  const token = useAuthStore((state) => state.token);
  const isClient = useIsClient();
  return isClient && token !== null;
}

export function useIncomingRequests() {
  return useQuery({
    queryKey: exchangeKeys.incoming(),
    queryFn: fetchIncomingRequests,
    enabled: useIsSignedIn(),
  });
}

export function useOutgoingRequests() {
  return useQuery({
    queryKey: exchangeKeys.outgoing(),
    queryFn: fetchOutgoingRequests,
    enabled: useIsSignedIn(),
  });
}

export function useIncomingPendingCount(): number {
  const { data } = useIncomingRequests();
  return data?.filter(({ status }) => status === ExchangeStatus.PENDING).length ?? 0;
}

export function useCreateExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExchangeRequest,
    onSuccess: () => {
      toast.success('Запит надіслано. Власник отримає лист');
      return invalidateExchangeData(queryClient);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: ExchangeAction }) =>
      respondToExchangeRequest(id, action),
    onSuccess: (_request, { action }) => {
      toast.success(RESPONSE_MESSAGES[action]);
      return invalidateExchangeData(queryClient);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
