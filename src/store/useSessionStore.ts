import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';
import {
  AmulSession,
  AmulUserProfile,
  AmulUserAddress,
  AmulOrder,
} from '../types/amul';
import {
  AmulApiClient,
} from '../services/amulApi';

interface SessionState {
  session: AmulSession;
  userProfile: AmulUserProfile | null;
  addresses: AmulUserAddress[];
  orders: AmulOrder[];
  isLoadingUserData: boolean;
  heartbeatEnabled: boolean;
  smsRetrieverEnabled: boolean;
  isAuthenticating: boolean;
  isInitialized: boolean;

  // Actions
  loadSavedSession: () => Promise<void>;
  login: (mobile: string, sessionCookie: string, jwtToken?: string, name?: string, userId?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUserData: () => Promise<void>;
  updateUserProfile: (data: { first_name: string; last_name: string; email: string }) => Promise<boolean>;
  addAddress: (addressData: Omit<AmulUserAddress, 'id'>) => Promise<boolean>;
  updateAddress: (addressId: string, addressData: Partial<AmulUserAddress>) => Promise<boolean>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  setHeartbeatEnabled: (enabled: boolean) => void;
  setSmsRetrieverEnabled: (enabled: boolean) => void;
  updateLastHeartbeat: () => void;
}

const SECURE_STORE_KEY = 'amul_flash_user_session';

const storageHelper = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      } catch (e) {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
      } catch (e) {}
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      } catch (e) {}
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

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
  userProfile: null,
  addresses: [],
  orders: [],
  cart: null,
  isLoadingUserData: false,
  heartbeatEnabled: true,
  smsRetrieverEnabled: true,
  isAuthenticating: false,
  isInitialized: false,

  loadSavedSession: async () => {
    try {
      const saved = await storageHelper.getItem(SECURE_STORE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn && parsed.sessionCookie) {
          AmulApiClient.activeSessionCookie = parsed.sessionCookie;
          set({
            session: parsed,
            isInitialized: true,
          });
          get().loadUserData();
          return;
        }
      }
    } catch (e) {}

    set({
      session: INITIAL_EMPTY_SESSION,
      isInitialized: true,
    });
  },

  login: async (mobile, sessionCookie, jwtToken, name, userId) => {
    const newSession: AmulSession = {
      mobile,
      sessionCookie,
      jwtToken,
      userId: userId || '',
      userName: name || '',
      expiresAt: Date.now() + 1000 * 60 * 60 * 48, // 48 hours
      isLoggedIn: true,
      lastHeartbeat: Date.now(),
      defaultAddressId: undefined,
    };

    AmulApiClient.activeSessionCookie = sessionCookie;
    set({ session: newSession });

    try {
      await storageHelper.setItem(SECURE_STORE_KEY, JSON.stringify(newSession));
    } catch (e) {}

    // Automatically load profile, addresses, orders, and cart from Amul Cloud
    get().loadUserData();
  },

  logout: async () => {
    AmulApiClient.activeSessionCookie = '';
    set({
      session: INITIAL_EMPTY_SESSION,
      userProfile: null,
      addresses: [],
      orders: [],
    });
    try {
      await storageHelper.removeItem(SECURE_STORE_KEY);
    } catch (e) {}
  },

  loadUserData: async () => {
    const cookie = get().session.sessionCookie || AmulApiClient.activeSessionCookie || '';
    set({ isLoadingUserData: true });
    try {
      const uid = get().session.userId || undefined;

      // 1. Fetch Profile
      let profile = get().userProfile;
      const fetchedProfile = await AmulApiClient.getUserInfo(cookie);
      if (fetchedProfile) {
        profile = fetchedProfile;
        const fullName = `${fetchedProfile.firstName} ${fetchedProfile.lastName}`.trim();
        const updatedSession: AmulSession = {
          ...get().session,
          isLoggedIn: true,
          userId: fetchedProfile.id || get().session.userId,
          userName: fullName || get().session.userName,
          sessionCookie: cookie || get().session.sessionCookie,
        };
        set({
          userProfile: fetchedProfile,
          session: updatedSession,
        });
        try {
          await storageHelper.setItem(SECURE_STORE_KEY, JSON.stringify(updatedSession));
        } catch (e) {}
      }

      const activeUserId = profile?.id || uid;

      // 2. Fetch Addresses
      if (activeUserId) {
        const addresses = await AmulApiClient.getUserAddresses(activeUserId, cookie);
        set({ addresses });
      }

      // 3. Fetch Orders
      if (activeUserId) {
        const orders = await AmulApiClient.getUserOrders(activeUserId, cookie);
        set({ orders });
      }

    } catch (e) {
    } finally {
      set({ isLoadingUserData: false });
    }
  },

  updateUserProfile: async (data) => {
    const { session, userProfile } = get();
    const uid = userProfile?.id || session.userId;
    if (!uid) return false;

    const res = await AmulApiClient.updateUserProfile(uid, data, session.sessionCookie);
    if (res.success) {
      const updatedName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      const updatedSession = {
        ...get().session,
        userName: updatedName || get().session.userName,
      };
      set((state) => ({
        userProfile: state.userProfile
          ? {
              ...state.userProfile,
              firstName: data.first_name ?? state.userProfile.firstName,
              lastName: data.last_name ?? state.userProfile.lastName,
              email: data.email ?? state.userProfile.email,
            }
          : null,
        session: updatedSession,
      }));
      try {
        await storageHelper.setItem(SECURE_STORE_KEY, JSON.stringify(updatedSession));
      } catch (e) {}
      return true;
    }
    return false;
  },

  addAddress: async (addressData) => {
    const { session, userProfile } = get();
    const uid = userProfile?.id || session.userId || undefined;

    const res = await AmulApiClient.addUserAddress(
      {
        zip: addressData.zip,
        country: addressData.country || 'IN',
        state: addressData.state,
        city: addressData.city,
        full_name: addressData.fullName,
        address: addressData.address,
        phone: addressData.phone,
        address_type: addressData.addressType,
        user_id: uid,
        make_default: addressData.isDefault ? '1' : '0',
      },
      session.sessionCookie
    );

    if (res.success && res.address) {
      set((state) => ({
        addresses: [res.address!, ...state.addresses],
      }));
      return true;
    }
    return false;
  },

  updateAddress: async (addressId, addressData) => {
    const { session } = get();
    const res = await AmulApiClient.updateUserAddress(addressId, addressData, session.sessionCookie);
    if (res.success) {
      set((state) => ({
        addresses: state.addresses.map((a) => (a.id === addressId ? { ...a, ...addressData } : a)),
      }));
      return true;
    }
    return false;
  },

  deleteAddress: async (addressId) => {
    const { session } = get();
    const res = await AmulApiClient.deleteUserAddress(addressId, session.sessionCookie);
    if (res.success) {
      set((state) => ({
        addresses: state.addresses.filter((a) => a.id !== addressId),
      }));
      return true;
    }
    return false;
  },

  setDefaultAddress: async (addressId) => {
    set((state) => ({
      addresses: state.addresses.map((a) => ({
        ...a,
        isDefault: a.id === addressId,
      })),
      session: {
        ...state.session,
        defaultAddressId: addressId,
      },
    }));
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
