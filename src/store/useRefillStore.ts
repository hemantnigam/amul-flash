import { create } from 'zustand';
import { RefillItem } from '../types/amul';

interface RefillState {
  items: RefillItem[];

  // Actions
  updateDailyIntake: (id: string, dailyIntake: number) => void;
  decrementStock: (id: string, amount?: number) => void;
  restockItem: (id: string, unitsAdded: number, newExpiryDate?: string) => void;
  addItem: (item: Omit<RefillItem, 'id'>) => void;
}

const DEFAULT_REFILL_ITEMS: RefillItem[] = [
  {
    id: 'refill-lassi-rose',
    productId: 'amul-protein-lassi-rose',
    productName: 'Amul High Protein Lassi (Rose)',
    currentUnits: 18,
    dailyIntake: 2, // 2 packs per day -> 9 days supply remaining
    warningDaysThreshold: 5,
    batchNumber: 'AMUL_BLR_2026_B89',
    expiryDate: '2026-11-15',
    lastRestockedDate: '2026-08-20',
  },
  {
    id: 'refill-whey-choco',
    productId: 'amul-protein-whey-sachets',
    productName: 'Amul High Protein Whey Sachets',
    currentUnits: 8,
    dailyIntake: 1, // 1 sachet per day -> 8 days supply remaining
    warningDaysThreshold: 7,
    batchNumber: 'AMUL_ANAND_2026_W12',
    expiryDate: '2027-02-28',
    lastRestockedDate: '2026-08-15',
  },
];

export const useRefillStore = create<RefillState>((set) => ({
  items: DEFAULT_REFILL_ITEMS,

  updateDailyIntake: (id, dailyIntake) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, dailyIntake: Math.max(1, dailyIntake) } : item
      ),
    }));
  },

  decrementStock: (id, amount = 1) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, currentUnits: Math.max(0, item.currentUnits - amount) }
          : item
      ),
    }));
  },

  restockItem: (id, unitsAdded, newExpiryDate) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              currentUnits: item.currentUnits + unitsAdded,
              expiryDate: newExpiryDate || item.expiryDate,
              lastRestockedDate: new Date().toISOString().split('T')[0],
            }
          : item
      ),
    }));
  },

  addItem: (item) => {
    const newItem: RefillItem = {
      ...item,
      id: `refill-${Date.now()}`,
    };
    set((state) => ({
      items: [...state.items, newItem],
    }));
  },
}));
