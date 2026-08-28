import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  AmulSession,
  AmulUserProfile,
  AmulUserAddress,
  AmulOrder,
  AmulCart,
} from '../types/amul';
import { AmulApiClient, AUTHENTICATED_DEFAULT_COOKIE } from '../services/amulApi';

interface SessionState {
  session: AmulSession;
  userProfile: AmulUserProfile | null;
  addresses: AmulUserAddress[];
  orders: AmulOrder[];
  cart: AmulCart | null;
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
  addToCart: (productId: string, sku: string, quantity?: number) => Promise<boolean>;
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

const INITIAL_AUTHENTICATED_SESSION: AmulSession = {
  mobile: '+919899940268',
  sessionCookie: AUTHENTICATED_DEFAULT_COOKIE,
  jwtToken: '',
  userId: '696091a6025cd5c65247e101',
  userName: 'Hemant Nigam',
  expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  isLoggedIn: true,
  lastHeartbeat: Date.now(),
  defaultAddressId: '696091f8527891a41e6b5dc7',
};

export const useSessionStore = create<SessionState>((set, get) => ({
  session: INITIAL_AUTHENTICATED_SESSION,
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
      if (Platform.OS !== 'web') {
        const saved = await SecureStore.getItemAsync(SECURE_STORE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.sessionCookie && parsed.isLoggedIn) {
            set({ session: parsed, isInitialized: true });
            get().loadUserData();
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load session from Keystore:', e);
    }
    set({ session: INITIAL_AUTHENTICATED_SESSION, isInitialized: true });
    get().loadUserData();
  },

  login: async (mobile, sessionCookie, jwtToken, name, userId) => {
    const newSession: AmulSession = {
      mobile,
      sessionCookie,
      jwtToken,
      userId: userId || '696091a6025cd5c65247e101',
      userName: name || 'Hemant Nigam',
      expiresAt: Date.now() + 1000 * 60 * 60 * 48, // 48 hours
      isLoggedIn: true,
      lastHeartbeat: Date.now(),
      defaultAddressId: '696091f8527891a41e6b5dc7',
    };

    set({ session: newSession });

    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(newSession));
      }
    } catch (e) {
      console.warn('Could not persist session to Keystore:', e);
    }

    // Automatically load profile, addresses, orders, and cart from Amul Cloud
    get().loadUserData();
  },

  logout: async () => {
    set({
      session: INITIAL_EMPTY_SESSION,
      userProfile: null,
      addresses: [],
      orders: [],
      cart: null,
    });
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
      }
    } catch (e) {
      console.warn('Could not remove session from Keystore:', e);
    }
  },

  loadUserData: async () => {
    const { session } = get();
    if (!session.isLoggedIn) return;

    set({ isLoadingUserData: true });
    try {
      const cookie = session.sessionCookie;
      const uid = session.userId || '696091a6025cd5c65247e101';

      // 1. Fetch Profile
      const profile = await AmulApiClient.getUserInfo(cookie);
      if (profile) {
        set({ userProfile: profile });
      }

      // 2. Fetch Addresses
      const addresses = await AmulApiClient.getUserAddresses(profile?.id || uid, cookie);
      set({ addresses });

      // 3. Fetch Orders
      const orders = await AmulApiClient.getUserOrders(profile?.id || uid, cookie);
      set({ orders });

      // 4. Fetch Cart
      const cart = await AmulApiClient.getUserCart(get().cart?.id || undefined, profile?.id || uid, cookie);
      set({ cart: cart || null });
    } catch (e) {
      console.warn('Error loading user data:', e);
    } finally {
      set({ isLoadingUserData: false });
    }
  },

  updateUserProfile: async (data) => {
    const { session, userProfile } = get();
    const uid = userProfile?.id || session.userId || '696091a6025cd5c65247e101';
    const res = await AmulApiClient.updateUserProfile(uid, data, session.sessionCookie);
    if (res.success) {
      set((state) => ({
        userProfile: state.userProfile
          ? {
              ...state.userProfile,
              firstName: data.first_name,
              lastName: data.last_name,
              email: data.email,
            }
          : null,
        session: {
          ...state.session,
          userName: `${data.first_name} ${data.last_name}`.trim(),
        },
      }));
      return true;
    }
    return false;
  },

  addAddress: async (addressData) => {
    const { session, userProfile } = get();
    const uid = userProfile?.id || session.userId || '696091a6025cd5c65247e101';

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

  addToCart: async (productId: string, sku: string, quantity: number = 1): Promise<boolean> => {
    const { session } = get();
    try {
      const res = await AmulApiClient.instantAddToCart(
        productId,
        sku,
        quantity,
        session.sessionCookie
      );
      if (res.success) {
        // Trigger live user data sync
        await get().loadUserData();
        return true;
      }
    } catch (e) {
      console.warn('addToCart action note:', e);
    }
    return false;
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
