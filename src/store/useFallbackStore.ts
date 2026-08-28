import { create } from 'zustand';
import { FallbackRule, BasketBundlerSettings } from '../types/amul';

interface FallbackState {
  rules: FallbackRule[];
  bundlerSettings: BasketBundlerSettings;

  // Actions
  updateRuleHierarchy: (primaryProductId: string, fallbackIds: string[]) => void;
  toggleRule: (primaryProductId: string) => void;
  toggleBundler: (enabled: boolean) => void;
  setMinimumOrderValue: (mov: number) => void;
  toggleAddonProduct: (productId: string) => void;
}

const DEFAULT_RULES: FallbackRule[] = [
  {
    primaryProductId: 'amul-protein-lassi-rose',
    fallbackProductIds: [
      'amul-protein-lassi-plain',
      'amul-protein-buttermilk',
      'amul-protein-whey-sachets',
    ],
    enabled: true,
    autoSwitchOnDepletion: true,
  },
  {
    primaryProductId: 'amul-protein-whey-sachets',
    fallbackProductIds: [
      'amul-protein-lassi-rose',
      'amul-protein-paneer',
    ],
    enabled: true,
    autoSwitchOnDepletion: true,
  },
];

const DEFAULT_BUNDLER: BasketBundlerSettings = {
  autoBundleForFreeShipping: true,
  minimumOrderValue: 1000,
  selectedAddonProductIds: ['amul-protein-paneer'],
};

export const useFallbackStore = create<FallbackState>((set) => ({
  rules: DEFAULT_RULES,
  bundlerSettings: DEFAULT_BUNDLER,

  updateRuleHierarchy: (primaryProductId, fallbackIds) => {
    set((state) => ({
      rules: state.rules.map((r) =>
        r.primaryProductId === primaryProductId
          ? { ...r, fallbackProductIds: fallbackIds }
          : r
      ),
    }));
  },

  toggleRule: (primaryProductId) => {
    set((state) => ({
      rules: state.rules.map((r) =>
        r.primaryProductId === primaryProductId ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  },

  toggleBundler: (enabled) => {
    set((state) => ({
      bundlerSettings: { ...state.bundlerSettings, autoBundleForFreeShipping: enabled },
    }));
  },

  setMinimumOrderValue: (mov) => {
    set((state) => ({
      bundlerSettings: { ...state.bundlerSettings, minimumOrderValue: mov },
    }));
  },

  toggleAddonProduct: (productId) => {
    set((state) => {
      const exists = state.bundlerSettings.selectedAddonProductIds.includes(productId);
      const updated = exists
        ? state.bundlerSettings.selectedAddonProductIds.filter((id) => id !== productId)
        : [...state.bundlerSettings.selectedAddonProductIds, productId];
      return {
        bundlerSettings: {
          ...state.bundlerSettings,
          selectedAddonProductIds: updated,
        },
      };
    });
  },
}));
