import { create } from 'zustand';

type ThemeMode = "light" | "dark" | "system";

type ThemeStore = {
  override: ThemeMode;
  setOverride: (theme: ThemeMode) => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  override: "system",
  setOverride: (theme) => set({ override: theme }),
}));
