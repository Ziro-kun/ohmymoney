import { create } from 'zustand';

type ThemeStore = {
  override: 'light' | 'dark' | null; // null = 시스템 설정 따름
  setOverride: (theme: 'light' | 'dark') => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  override: null,
  setOverride: (theme) => set({ override: theme }),
}));
