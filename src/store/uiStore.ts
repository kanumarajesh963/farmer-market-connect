import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleMode: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'fmc-ui' }
  )
);
