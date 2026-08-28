import { Linking, Alert, Platform } from 'react-native';

export interface UPITransactionParams {
  payeeVpa?: string;
  payeeName?: string;
  amount: number;
  transactionRef: string;
  transactionNote?: string;
  currency?: string;
}

export type UPIApp = 'any' | 'gpay' | 'phonepe' | 'paytm' | 'cred';

export interface UPIAppItem {
  id: UPIApp;
  name: string;
  color: string;
}

export const UPI_APPS: UPIAppItem[] = [
  { id: 'gpay', name: 'Google Pay', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', color: '#5F259F' },
  { id: 'paytm', name: 'Paytm', color: '#00B9F1' },
  { id: 'cred', name: 'CRED UPI', color: '#1E293B' },
];

export const UPI_CONFIG = {
  DEFAULT_VPA: 'amul@razorpay',
  DEFAULT_NAME: 'Amul D2C Cloud',
  CURRENCY: 'INR',
};

export function buildUPIIntentUrl(params: UPITransactionParams, app: UPIApp = 'any'): string {
  const vpa = params.payeeVpa || UPI_CONFIG.DEFAULT_VPA;
  const name = encodeURIComponent(params.payeeName || UPI_CONFIG.DEFAULT_NAME);
  const amount = params.amount.toFixed(2);
  const ref = params.transactionRef || `ORDER_${Date.now()}`;
  const note = encodeURIComponent(params.transactionNote || 'Amul Flash Checkout');
  const currency = params.currency || UPI_CONFIG.CURRENCY;

  const baseQuery = `pa=${vpa}&pn=${name}&am=${amount}&tr=${ref}&tn=${note}&cu=${currency}`;

  switch (app) {
    case 'gpay':
      return `upi://pay?${baseQuery}&package=com.google.android.apps.nbu.paisa.user`;
    case 'phonepe':
      return `upi://pay?${baseQuery}&package=com.phonepe.app`;
    case 'paytm':
      return `upi://pay?${baseQuery}&package=net.one97.paytm`;
    case 'cred':
      return `upi://pay?${baseQuery}&package=com.dreamplug.androidapp`;
    case 'any':
    default:
      return `upi://pay?${baseQuery}`;
  }
}

export async function launchUPICheckout(
  params: UPITransactionParams,
  app: UPIApp = 'any'
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = buildUPIIntentUrl(params, app);

    if (Platform.OS === 'web') {
      console.log('UPI Intent URL:', url);
      window.open(url, '_blank');
      return { success: true };
    }

    const canOpen = await Linking.canOpenURL(url).catch(() => true);
    if (canOpen) {
      await Linking.openURL(url);
      return { success: true };
    } else {
      const fallbackUrl = buildUPIIntentUrl(params, 'any');
      await Linking.openURL(fallbackUrl);
      return { success: true };
    }
  } catch (error: any) {
    console.warn('UPI Launch Error:', error);
    Alert.alert(
      'Flash Checkout Handover',
      `Payment Intent generated: ₹${params.amount.toFixed(2)} to ${params.payeeVpa || UPI_CONFIG.DEFAULT_VPA}.\n\nOrder Ref: ${params.transactionRef}`,
      [{ text: 'OK' }]
    );
    return { success: false, error: error?.message };
  }
}

export const UpiService = {
  launchUpiPayment: async ({
    appId = 'gpay',
    amount,
    orderId,
    merchantName,
    note,
  }: {
    appId: UPIApp;
    amount: number;
    orderId: string;
    merchantName?: string;
    note?: string;
  }) => {
    const res = await launchUPICheckout(
      {
        amount,
        transactionRef: orderId,
        payeeName: merchantName,
        transactionNote: note,
      },
      appId
    );
    return res.success;
  },
};
