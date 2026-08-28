import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Zap, ShieldCheck, X, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { AmulProduct, ProductVariant } from '../types/amul';
import { launchUPICheckout, UPIApp } from '../services/upiService';
import { useStockStore } from '../store/useStockStore';

interface FlashCheckoutModalProps {
  visible: boolean;
  product: AmulProduct | null;
  variant?: ProductVariant | null;
  onClose: () => void;
}

export const FlashCheckoutModal: React.FC<FlashCheckoutModalProps> = ({
  visible,
  product,
  variant,
  onClose,
}) => {
  const { addActivityLog, selectedPincode } = useStockStore();
  const [selectedApp, setSelectedApp] = useState<UPIApp>('any');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!product) return null;

  const currentVariant = variant || product.variants[0];
  const totalPrice = currentVariant?.price || product.defaultPrice;

  const handlePayNow = async (app: UPIApp = selectedApp) => {
    setIsProcessing(true);
    const orderRef = `AMUL_${Date.now()}`;

    // Log the initiation
    addActivityLog({
      type: 'checkout',
      title: `1-Tap Flash Checkout Initiated (₹${totalPrice})`,
      description: `Handing over payment for 1x ${product.title} (${currentVariant.name}) via UPI.`,
      status: 'info',
    });

    const result = await launchUPICheckout(
      {
        amount: totalPrice,
        transactionRef: orderRef,
        transactionNote: `Amul Flash: ${product.title}`,
      },
      app
    );

    setIsProcessing(false);
    if (result.success) {
      setIsSuccess(true);
      addActivityLog({
        type: 'checkout',
        title: `Order Handover Successful: ₹${totalPrice}`,
        description: `UPI Payment intent broadcasted to ${app.toUpperCase()} app. Delivery Pincode: ${selectedPincode.pincode}.`,
        status: 'success',
      });
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleBadge}>
              <Zap size={16} color="#FFFFFF" />
              <Text style={styles.headerTitle}>1-Tap Flash Checkout</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            <View style={styles.successContainer}>
              <CheckCircle2 size={54} color={Theme.colors.statusSuccessText} />
              <Text style={styles.successTitle}>UPI Intent Launched!</Text>
              <Text style={styles.successSubtitle}>
                Complete payment in your UPI app. Amul order will confirm instantaneously.
              </Text>
            </View>
          ) : (
            <>
              {/* Product Summary Box */}
              <View style={styles.productBox}>
                <View style={styles.productInfo}>
                  <Text style={styles.prodName}>{product.title}</Text>
                  <Text style={styles.variantName}>{currentVariant.name}</Text>
                  <Text style={styles.deliverToText}>
                    Deliver to: {selectedPincode.label} ({selectedPincode.pincode})
                  </Text>
                </View>
                <View style={styles.priceColumn}>
                  <Text style={styles.priceLabel}>Total</Text>
                  <Text style={styles.priceAmount}>₹{totalPrice}</Text>
                </View>
              </View>

              {/* UPI App Selection */}
              <Text style={styles.sectionTitle}>Select 1-Tap UPI Provider</Text>
              <View style={styles.upiGrid}>
                {/* Google Pay */}
                <TouchableOpacity
                  style={[styles.upiAppBtn, selectedApp === 'gpay' && styles.upiAppBtnActive]}
                  onPress={() => setSelectedApp('gpay')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.appIconCircle, { backgroundColor: '#E8F0FE' }]}>
                    <Text style={[styles.appIconText, { color: Theme.colors.gpay }]}>G</Text>
                  </View>
                  <Text style={styles.appName}>Google Pay</Text>
                </TouchableOpacity>

                {/* PhonePe */}
                <TouchableOpacity
                  style={[styles.upiAppBtn, selectedApp === 'phonepe' && styles.upiAppBtnActive]}
                  onPress={() => setSelectedApp('phonepe')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.appIconCircle, { backgroundColor: '#F3E8FF' }]}>
                    <Text style={[styles.appIconText, { color: Theme.colors.phonepe }]}>P</Text>
                  </View>
                  <Text style={styles.appName}>PhonePe</Text>
                </TouchableOpacity>

                {/* Paytm */}
                <TouchableOpacity
                  style={[styles.upiAppBtn, selectedApp === 'paytm' && styles.upiAppBtnActive]}
                  onPress={() => setSelectedApp('paytm')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.appIconCircle, { backgroundColor: '#E0F7FF' }]}>
                    <Text style={[styles.appIconText, { color: Theme.colors.paytm }]}>₹</Text>
                  </View>
                  <Text style={styles.appName}>Paytm</Text>
                </TouchableOpacity>

                {/* CRED / Any UPI */}
                <TouchableOpacity
                  style={[styles.upiAppBtn, selectedApp === 'any' && styles.upiAppBtnActive]}
                  onPress={() => setSelectedApp('any')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.appIconCircle, { backgroundColor: '#F3F4F6' }]}>
                    <Zap size={16} color={Theme.colors.primary} />
                  </View>
                  <Text style={styles.appName}>Any UPI</Text>
                </TouchableOpacity>
              </View>

              {/* Security Guarantee */}
              <View style={styles.securityRow}>
                <ShieldCheck size={16} color={Theme.colors.statusSuccessText} />
                <Text style={styles.securityText}>
                  Direct NPCI deep linking • Zero card credentials stored
                </Text>
              </View>

              {/* Instant Pay Action Button */}
              <TouchableOpacity
                style={[styles.flashPayActionBtn, isProcessing && styles.btnProcessing]}
                onPress={() => handlePayNow(selectedApp)}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Zap size={18} color="#FFFFFF" />
                    <Text style={styles.flashPayActionText}>
                      Pay ₹{totalPrice} with {selectedApp === 'any' ? 'UPI' : selectedApp.toUpperCase()}
                    </Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: Theme.radius.xxl,
    borderTopRightRadius: Theme.radius.xxl,
    padding: Theme.spacing.containerMargin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  productBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  prodName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginBottom: 2,
  },
  variantName: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  deliverToText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  priceColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },
  priceLabel: {
    fontSize: 11,
    color: Theme.colors.secondary,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.onSurface,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginBottom: 10,
  },
  upiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  upiAppBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    gap: 6,
  },
  upiAppBtnActive: {
    borderColor: Theme.colors.primaryContainer,
    backgroundColor: '#EFF6FF',
  },
  appIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 16,
    fontWeight: '800',
  },
  appName: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.onSurface,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 12,
    color: Theme.colors.secondary,
  },
  flashPayActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: Theme.radius.lg,
    gap: 8,
    ...Theme.shadows.active,
  },
  btnProcessing: {
    opacity: 0.7,
  },
  flashPayActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  successSubtitle: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
