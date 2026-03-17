import { AppColors, AppColorScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '../src/store/useThemeStore';
import { useFinanceStore } from '../src/store/useFinanceStore';

export function useAppTheme() {
  const systemScheme = useColorScheme() ?? "dark";
  const { override, setOverride } = useThemeStore();
  const isColorBlindMode = useFinanceStore((s) => s.isColorBlindMode);

  const themeMode = override;
  const isDark = (override === "system" ? systemScheme : override) === "dark";

  const toggleTheme = () => setOverride(isDark ? "light" : "dark");
  const setTheme = (mode: "light" | "dark" | "system") => setOverride(mode);

  let colors: AppColorScheme;
  if (isColorBlindMode) {
    colors = isDark ? AppColors.colorBlindDark : AppColors.colorBlindLight;
  } else {
    colors = isDark ? AppColors.dark : AppColors.light;
  }

  return { colors, isDark, themeMode, toggleTheme, setTheme };
}
