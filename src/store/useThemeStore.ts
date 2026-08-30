import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = '@amul_theme_mode';

interface ThemeStoreState {
  themeMode: ThemeMode;
  isThemeLoaded: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  themeMode: 'system',
  isThemeLoaded: false,

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.log('⚠️ [useThemeStore] Failed to save theme preference:', e);
    }
  },

  loadSavedTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        set({ themeMode: saved, isThemeLoaded: true });
        return;
      }
    } catch (e) {
      console.log('⚠️ [useThemeStore] Failed to load saved theme:', e);
    }
    set({ isThemeLoaded: true });
  },
}));
