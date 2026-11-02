import type { AuthUser } from '@book-exchange/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearAccessTokenCookie, setAccessTokenCookie } from '@/lib/auth-cookie';

interface Session {
  token: string;
  user: AuthUser;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (session: Session) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => {
        setAccessTokenCookie(token);
        set({ token, user });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        clearAccessTokenCookie();
        set({ token: null, user: null });
      },
    }),
    {
      name: 'book-exchange-auth',
      partialize: ({ token, user }) => ({ token, user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAccessTokenCookie(state.token);
        }
      },
    },
  ),
);
