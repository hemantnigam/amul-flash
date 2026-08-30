import { useColorScheme } from 'react-native';
import { useThemeStore, ThemeMode } from '../store/useThemeStore';
import { LightColors, DarkColors, CommonTheme, getTheme } from '../constants/theme';

export function useAppTheme() {
  const systemColorScheme = useColorScheme();
  const { themeMode, setThemeMode, isThemeLoaded } = useThemeStore();

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? DarkColors : LightColors;
  const theme = getTheme(isDark);

  return {
    isDark,
    themeMode,
    setThemeMode,
    colors,
    theme,
    isThemeLoaded,
    systemColorScheme,
  };
}
