/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// ─── ohmymoney App Color System ─────────────────────────────────────────────

const dark = {
  bg: '#080f1e',
  bgSecondary: '#0d1a30',
  card: 'rgba(255,255,255,0.04)' as string,
  cardBorder: 'rgba(255,255,255,0.08)' as string,
  input: 'rgba(0,0,0,0.35)' as string,
  inputBorder: 'rgba(255,255,255,0.06)' as string,
  text: '#eef4ff',
  textSecondary: '#7a90b0',
  textMuted: '#344860',
  accent: '#5b96f8',
  accentBg: 'rgba(91,150,248,0.15)' as string,
  accentBorder: 'rgba(91,150,248,0.45)' as string,
  danger: '#f0565d',
  dangerBg: 'rgba(240,86,93,0.15)' as string,
  dangerBorder: 'rgba(240,86,93,0.35)' as string,
  purple: '#c084fc',
  purpleBg: 'rgba(192,132,252,0.08)' as string,
  purpleBorder: 'rgba(192,132,252,0.28)' as string,
  purpleText: '#e9d5ff',
  assetBlue: '#60a5fa',
  assetBlueBg: 'rgba(96,165,250,0.12)' as string,
  liabilityRed: '#fb7185',
  liabilityRedBg: 'rgba(251,113,133,0.12)' as string,
  expenseBg: 'rgba(248,113,113,0.1)' as string,
  gradient: ['#080f1e', '#0e1d35', '#030810'] as [string, string, string],
  tabBar: '#060d1c',
  tabBarBorder: 'rgba(255,255,255,0.07)' as string,
  separator: 'rgba(255,255,255,0.05)' as string,
};

const light: typeof dark = {
  bg: '#f4f7ff',
  bgSecondary: '#e8eeff',
  card: 'rgba(255,255,255,0.92)',
  cardBorder: 'rgba(0,0,0,0.07)',
  input: 'rgba(0,0,0,0.04)',
  inputBorder: 'rgba(0,0,0,0.09)',
  text: '#0a1628',
  textSecondary: '#3d5575',
  textMuted: '#8a9ab5',
  accent: '#1d5fd4',
  accentBg: 'rgba(29,95,212,0.1)',
  accentBorder: 'rgba(29,95,212,0.4)',
  danger: '#d42020',
  dangerBg: 'rgba(212,32,32,0.08)',
  dangerBorder: 'rgba(212,32,32,0.3)',
  purple: '#7c2de0',
  purpleBg: 'rgba(124,45,224,0.07)',
  purpleBorder: 'rgba(124,45,224,0.25)',
  purpleText: '#6b21a8',
  assetBlue: '#1d5fd4',
  assetBlueBg: 'rgba(29,95,212,0.1)',
  liabilityRed: '#c81a3a',
  liabilityRedBg: 'rgba(200,26,58,0.09)',
  expenseBg: 'rgba(200,26,58,0.07)',
  gradient: ['#f4f7ff', '#eaefff', '#f0f4fe'] as [string, string, string],
  tabBar: '#ffffff',
  tabBarBorder: 'rgba(0,0,0,0.08)',
  separator: 'rgba(0,0,0,0.06)',
};

export const AppColors = { dark, light };
export type AppColorScheme = typeof dark;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
