import { PincodeLocation, ActivityLog, RestockEvent } from '../types/amul';

export const INITIAL_PINCODES: PincodeLocation[] = [
  {
    pincode: '110044',
    label: 'Primary Delivery Hub',
    address: 'Amul Serviceable Zone (110044)',
    storeId: '66505ff5145c16635e6cc74d',
    isDefault: true,
    serviceable: true,
  },
];

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

export function getFallbackProductsForCategory(categorySlug: string = 'protein') {
  return [
    {
      id: 'amul-protein-lassi-rose',
      title: 'Amul High Protein Rose Lassi (200 mL | Pack of 30)',
      category: 'protein',
      flavor: 'Rose',
      imageUrl: 'https://img.shop.amul.com/catalog/product/p/r/protein_lassi_rose_1.jpg',
      description: 'Authentic Amul High Protein Rose Lassi. 15g Protein per pack.',
      nutrition: {
        proteinGrams: 15,
        calories: 120,
        carbsGrams: 8,
        fatGrams: 1.5,
        servingSize: '200 mL',
      },
      defaultPrice: 750,
      isPopular: true,
      autoCartEnabled: false,
      variants: [
        {
          id: 'v_lassi_rose_30',
          name: '200 mL x 30 Pack',
          packSize: '200 mL',
          packCount: 30,
          price: 750,
          isInStock: true,
          stockCount: 142,
          sku: 'AMUL_PROT_LASSI_ROSE',
        },
      ],
    },
    {
      id: 'amul-whey-protein-choco',
      title: 'Amul High Protein Whey Isolate (Chocolate | 1 kg)',
      category: 'protein',
      flavor: 'Chocolate',
      imageUrl: 'https://img.shop.amul.com/catalog/product/w/h/whey_chocolate.jpg',
      description: '32g Pure Whey Protein Isolate with digestive enzymes.',
      nutrition: {
        proteinGrams: 32,
        calories: 135,
        carbsGrams: 3,
        fatGrams: 1.0,
        servingSize: '34g Scoop',
      },
      defaultPrice: 1999,
      isPopular: true,
      autoCartEnabled: false,
      variants: [
        {
          id: 'v_whey_choco_1kg',
          name: '1 kg Tub',
          packSize: '1 kg',
          packCount: 1,
          price: 1999,
          isInStock: true,
          stockCount: 88,
          sku: 'AMUL_WHEY_CHOCO_1KG',
        },
      ],
    },
    {
      id: 'amul-protein-paneer',
      title: 'Amul High Protein Fresh Paneer (200 g)',
      category: 'protein',
      flavor: 'Natural',
      imageUrl: 'https://img.shop.amul.com/catalog/product/p/r/protein_paneer.jpg',
      description: '50g Protein per 200g pack. Ultra-low fat fresh paneer.',
      nutrition: {
        proteinGrams: 50,
        calories: 210,
        carbsGrams: 2,
        fatGrams: 3.0,
        servingSize: '200 g',
      },
      defaultPrice: 110,
      isPopular: true,
      autoCartEnabled: false,
      variants: [
        {
          id: 'v_paneer_200g',
          name: '200 g Pack',
          packSize: '200 g',
          packCount: 1,
          price: 110,
          isInStock: true,
          stockCount: 200,
          sku: 'AMUL_PROT_PANEER_200G',
        },
      ],
    },
    {
      id: 'amul-protein-buttermilk',
      title: 'Amul High Protein Buttermilk (200 mL | Pack of 30)',
      category: 'protein',
      flavor: 'Spiced Chass',
      imageUrl: 'https://img.shop.amul.com/catalog/product/p/r/protein_buttermilk.jpg',
      description: 'Refreshing spiced chass enriched with 15g milk protein.',
      nutrition: {
        proteinGrams: 15,
        calories: 90,
        carbsGrams: 4,
        fatGrams: 1.0,
        servingSize: '200 mL',
      },
      defaultPrice: 675,
      isPopular: false,
      autoCartEnabled: false,
      variants: [
        {
          id: 'v_buttermilk_30',
          name: '200 mL x 30 Pack',
          packSize: '200 mL',
          packCount: 30,
          price: 675,
          isInStock: true,
          stockCount: 65,
          sku: 'AMUL_PROT_BUTTERMILK_30',
        },
      ],
    },
  ];
}
