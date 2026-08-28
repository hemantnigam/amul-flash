import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AmulSession } from '../types/amul';

interface SessionState {
  session: AmulSession;
  heartbeatEnabled: boolean;
  smsRetrieverEnabled: boolean;
  isAuthenticating: boolean;
  isInitialized: boolean;

  // Actions
  loadSavedSession: () => Promise<void>;
  login: (mobile: string, sessionCookie: string, jwtToken?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  setHeartbeatEnabled: (enabled: boolean) => void;
  setSmsRetrieverEnabled: (enabled: boolean) => void;
  updateLastHeartbeat: () => void;
}

const SECURE_STORE_KEY = 'amul_flash_user_session';

const INITIAL_EMPTY_SESSION: AmulSession = {
  mobile: '',
  sessionCookie: '',
  jwtToken: '',
  expiresAt: 0,
  isLoggedIn: false,
  lastHeartbeat: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  session: INITIAL_EMPTY_SESSION,
  heartbeatEnabled: true,
  smsRetrieverEnabled: true,
  isAuthenticating: false,
  isInitialized: false,

  loadSavedSession: async () => {
    try {
      if (Platform.OS !== 'web') {
        const saved = await SecureStore.getItemAsync(SECURE_STORE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.sessionCookie && parsed.isLoggedIn) {
            set({ session: parsed, isInitialized: true });
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load session from Keystore:', e);
    }
    set({ session: INITIAL_EMPTY_SESSION, isInitialized: true });
  },

  login: async (mobile, sessionCookie, jwtToken, name) => {
    const newSession: AmulSession = {
      mobile,
      sessionCookie,
      jwtToken,
      expiresAt: Date.now() + 1000 * 60 * 60 * 48, // 48 hours
      isLoggedIn: true,
      lastHeartbeat: Date.now(),
      defaultAddressId: 'addr_default_primary',
    };

    set({ session: newSession });

    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(newSession));
      }
    } catch (e) {
      console.warn('Could not persist session to Keystore:', e);
    }
  },

  logout: async () => {
    set({ session: INITIAL_EMPTY_SESSION });
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
      }
    } catch (e) {
      console.warn('Could not remove session from Keystore:', e);
    }
  },

  setHeartbeatEnabled: (enabled) => {
    set({ heartbeatEnabled: enabled });
  },

  setSmsRetrieverEnabled: (enabled) => {
    set({ smsRetrieverEnabled: enabled });
  },

  updateLastHeartbeat: () => {
    set((state) => ({
      session: {
        ...state.session,
        lastHeartbeat: Date.now(),
      },
    }));
  },
}));
