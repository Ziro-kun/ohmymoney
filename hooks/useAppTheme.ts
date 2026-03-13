import { AppColors, AppColorScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '../src/store/useThemeStore';

export function useAppTheme(): {
  colors: AppColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
} {
  const systemScheme = useColorScheme() ?? 'dark';
  const { override, setOverride } = useThemeStore();
  const scheme = override ?? systemScheme;
  const isDark = scheme === 'dark';

  const toggleTheme = () => setOverride(isDark ? 'light' : 'dark');

  return { colors: isDark ? AppColors.dark : AppColors.light, isDark, toggleTheme };
}
