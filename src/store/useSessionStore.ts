import { create } from 'zustand';
import { AmulSession } from '../types/amul';

interface SessionState {
  session: AmulSession;
  heartbeatEnabled: boolean;
  smsRetrieverEnabled: boolean;
  isAuthenticating: boolean;

  // Actions
  login: (mobile: string, sessionCookie: string, jwt?: string) => void;
  logout: () => void;
  setHeartbeatEnabled: (enabled: boolean) => void;
  setSmsRetrieverEnabled: (enabled: boolean) => void;
  updateLastHeartbeat: () => void;
}

const DEFAULT_SESSION: AmulSession = {
  mobile: '9876543210',
  sessionCookie: '_amul_session=sess_demo_987234_active',
  jwtToken: 'jwt_demo_token_authenticated',
  expiresAt: Date.now() + 1000 * 60 * 60 * 48, // 48 hours
  isLoggedIn: true,
  lastHeartbeat: Date.now() - 1000 * 60 * 45,
  defaultAddressId: 'addr_koramangala_01',
};

export const useSessionStore = create<SessionState>((set) => ({
  session: DEFAULT_SESSION,
  heartbeatEnabled: true,
  smsRetrieverEnabled: true,
  isAuthenticating: false,

  login: (mobile, sessionCookie, jwtToken) => {
    set({
      session: {
        mobile,
        sessionCookie,
        jwtToken,
        expiresAt: Date.now() + 1000 * 60 * 60 * 48,
        isLoggedIn: true,
        lastHeartbeat: Date.now(),
        defaultAddressId: 'addr_default_01',
      },
    });
  },

  logout: () => {
    set({
      session: {
        mobile: '',
        sessionCookie: '',
        expiresAt: 0,
        isLoggedIn: false,
        lastHeartbeat: 0,
      },
    });
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
