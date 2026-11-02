import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const AUTH_PATHS = ['/auth/login', '/auth/register'];
const LOGIN_PATH = '/login';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const isUnauthorized = axios.isAxiosError(error) && error.response?.status === 401;
    const isAuthRequest = axios.isAxiosError(error) && AUTH_PATHS.includes(error.config?.url ?? '');

    if (isUnauthorized && !isAuthRequest) {
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);

function redirectToLogin(): void {
  useAuthStore.getState().logout();

  const { pathname, search } = window.location;
  if (pathname !== LOGIN_PATH) {
    const redirect = encodeURIComponent(`${pathname}${search}`);
    // A full navigation also drops any in-memory state tied to the dead session.
    window.location.assign(new URL(`${LOGIN_PATH}?redirect=${redirect}`, window.location.origin));
  }
}
