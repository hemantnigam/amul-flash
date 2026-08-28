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

export const UPI_CONFIG = {
  DEFAULT_VPA: 'amul@razorpay',
  DEFAULT_NAME: 'Amul D2C Cloud',
  CURRENCY: 'INR',
};

/**
 * Builds standard UPI Deep Link URL compliant with NPCI specs
 * Example: upi://pay?pa=amul@razorpay&pn=AmulD2C&am=750.00&tr=order_1234&cu=INR&tn=Amul+Protein+Lassi
 */
export function buildUPIIntentUrl(params: UPITransactionParams, app: UPIApp = 'any'): string {
  const vpa = params.payeeVpa || UPI_CONFIG.DEFAULT_VPA;
  const name = encodeURIComponent(params.payeeName || UPI_CONFIG.DEFAULT_NAME);
  const amount = params.amount.toFixed(2);
  const ref = params.transactionRef || `ORDER_${Date.now()}`;
  const note = encodeURIComponent(params.transactionNote || 'Amul High Protein Flash Checkout');
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

/**
 * Triggers 1-Tap UPI Flash Checkout handover to installed apps (Google Pay, PhonePe, Paytm, CRED)
 */
export async function launchUPICheckout(
  params: UPITransactionParams,
  app: UPIApp = 'any'
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = buildUPIIntentUrl(params, app);

    if (Platform.OS === 'web') {
      // In web demo mode, show the generated UPI link
      console.log('UPI Intent URL:', url);
      window.open(url, '_blank');
      return { success: true };
    }

    const canOpen = await Linking.canOpenURL(url).catch(() => true);
    if (canOpen) {
      await Linking.openURL(url);
      return { success: true };
    } else {
      // Fallback to generic upi://pay if specific package fails
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
