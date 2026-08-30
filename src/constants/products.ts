import { PincodeLocation, ActivityLog, RestockEvent } from '../types/amul';

export const INITIAL_PINCODES: PincodeLocation[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    type: 'restock',
    title: 'Drop Detected: Amul Protein Lassi (Rose)',
    description: '307 units detected in South Delhi Hub (110044)',
    timestamp: Date.now() - 1000 * 60 * 12,
    status: 'success',
    pincode: '110044',
  },
  {
    id: 'log-2',
    type: 'info',
    title: 'Radar Ping: Bengaluru Central (560001)',
    description: 'Checked 12 items. Whey Protein currently Out of Stock.',
    timestamp: Date.now() - 1000 * 60 * 25,
    status: 'info',
    pincode: '560001',
  },
];

export const MOCK_RESTOCK_EVENT: RestockEvent = {
  id: 'drop_evt_1',
  productId: 'amul-protein-lassi-plain',
  productName: 'Amul High Protein Plain Lassi (200 mL | Pack of 30)',
  variantName: '200ml x 30',
  unitsAdded: 307,
  timestamp: Date.now(),
  pincode: '110044',
  survivalDurationSecs: 180,
};

export function getFallbackProductsForCategory(_categorySlug: string = 'protein') {
  return [];
}
