import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface LoginRecord {
  firstSeenAt: string;
  lastSeenAt: string;
  sessionCount: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  // Local record of when this browser has seen each user id sign in. This is
  // a client-side stand-in for real login analytics (which need to live on
  // the backend to be trustworthy across devices) — see the profile page.
  loginHistory: Record<string, LoginRecord>;
  login: (user: User, token: string) => void;
  logout: () => void;
  // Applied when the server tells us (via socket 'role:changed') that an
  // admin changed this person's role — never settable by the user directly.
  applyServerRoleChange: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loginHistory: {},
      login: (user, token) => {
        const now = new Date().toISOString();
        const existing = get().loginHistory[user.id];
        set({
          user,
          token,
          isAuthenticated: true,
          loginHistory: {
            ...get().loginHistory,
            [user.id]: {
              firstSeenAt: existing?.firstSeenAt ?? now,
              lastSeenAt: now,
              sessionCount: (existing?.sessionCount ?? 0) + 1,
            },
          },
        });
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      applyServerRoleChange: (user) => set({ user }),
    }),
    { name: 'fmc-auth' }
  )
);