import { AmulProduct, PincodeLocation } from '../types/amul';
import { INITIAL_PRODUCTS, INITIAL_PINCODES } from '../constants/products';

export interface SendOTPResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  sessionCookie?: string;
  jwtToken?: string;
  user?: {
    mobile: string;
    name?: string;
    defaultAddressId?: string;
  };
}

export interface PincodeCheckResponse {
  store_id: string;
  serviceable: boolean;
  city?: string;
  state?: string;
}

export interface AddToCartResponse {
  success: boolean;
  cartId?: string;
  itemCount?: number;
  totalPrice?: number;
  message?: string;
  latencyMs?: number;
}

export interface CheckoutInitResponse {
  razorpay_order_id: string;
  upi_intent_url: string;
  amount: number;
  currency: string;
}

const AMUL_BASE_URL = 'https://shop.amul.com/api/v1';

export const AmulApiClient = {
  /**
   * 1. Send OTP to mobile number
   */
  async sendOTP(mobile: string): Promise<SendOTPResponse> {
    try {
      // In production, calls POST https://shop.amul.com/api/v1/auth/otp/send
      await new Promise((r) => setTimeout(r, 450));
      return {
        success: true,
        message: `OTP sent successfully to +91 ${mobile}`,
        requestId: `req_${Date.now()}`,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Failed to send OTP',
      };
    }
  },

  /**
   * 2. Verify OTP & Obtain Session Cookie
   */
  async verifyOTP(mobile: string, otp: string): Promise<VerifyOTPResponse> {
    try {
      // In production, calls POST https://shop.amul.com/api/v1/auth/otp/verify
      await new Promise((r) => setTimeout(r, 380));
      if (otp.length === 6) {
        return {
          success: true,
          sessionCookie: `_amul_session=sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          jwtToken: `jwt_header.${btoa(JSON.stringify({ mobile, exp: Date.now() + 86400000 }))}.signature`,
          user: {
            mobile,
            name: 'Amul Pro User',
            defaultAddressId: 'addr_koramangala_01',
          },
        };
      } else {
        return {
          success: false,
        };
      }
    } catch (e) {
      return { success: false };
    }
  },

  /**
   * 3. Check Pincode Serviceability & Store ID
   */
  async checkPincode(pincode: string): Promise<PincodeCheckResponse> {
    const known = INITIAL_PINCODES.find((p) => p.pincode === pincode);
    if (known) {
      return {
        store_id: known.storeId,
        serviceable: known.serviceable,
        city: known.label,
      };
    }
    return {
      store_id: `STORE_${pincode}`,
      serviceable: true,
      city: 'Custom Location',
    };
  },

  /**
   * 4. Fetch Store Products
   */
  async fetchStoreProducts(storeId: string): Promise<AmulProduct[]> {
    await new Promise((r) => setTimeout(r, 200));
    return INITIAL_PRODUCTS;
  },

  /**
   * 5. Instant Headless Add-to-Cart (< 300ms execution)
   */
  async instantAddToCart(
    productId: string,
    variantId: string,
    quantity: number = 1,
    sessionCookie?: string
  ): Promise<AddToCartResponse> {
    const startTime = Date.now();
    // Simulate high-speed network request
    await new Promise((r) => setTimeout(r, 180));
    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      cartId: `cart_${Date.now()}`,
      itemCount: quantity,
      totalPrice: 750 * quantity,
      message: 'Item reserved in cart for 10 minutes',
      latencyMs,
    };
  },

  /**
   * 6. Initialize Checkout & Generate UPI Deep Link
   */
  async initializeCheckout(
    addressId: string,
    amount: number = 750,
    sessionCookie?: string
  ): Promise<CheckoutInitResponse> {
    const orderId = `order_${Math.random().toString(36).substring(2, 10)}`;
    const upiUrl = `upi://pay?pa=amul@razorpay&pn=AmulD2C&am=${amount.toFixed(2)}&tr=${orderId}&cu=INR&tn=Amul+Protein+Drop+Checkout`;

    return {
      razorpay_order_id: orderId,
      upi_intent_url: upiUrl,
      amount,
      currency: 'INR',
    };
  },
};
