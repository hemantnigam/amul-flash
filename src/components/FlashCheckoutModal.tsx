import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {
  Zap,
  X,
  MapPin,
  Check,
  ShieldCheck,
  Flame,
  ArrowRight,
  Clock,
} from 'lucide-react-native';
import { AmulProduct } from '../types/amul';
import { UpiService, UPI_APPS } from '../services/upiService';
import { useStockStore } from '../store/useStockStore';
import { useSessionStore } from '../store/useSessionStore';

interface FlashCheckoutModalProps {
  visible: boolean;
  product: AmulProduct | null;
  onClose: () => void;
}

export const FlashCheckoutModal: React.FC<FlashCheckoutModalProps> = ({
  visible,
  product,
  onClose,
}) => {
  const { selectedPincode, addActivityLog } = useStockStore();
  const { session } = useSessionStore();

  const [selectedAppId, setSelectedAppId] = useState<string>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(180);

  useEffect(() => {
    let timer: any;
    if (visible) {
      setSecondsRemaining(180);
      timer = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [visible]);

  if (!product) return null;

  const primaryVariant = product.variants[0];
  const price = product.defaultPrice || 750;
  const isFreeDelivery = price >= 1000;
  const deliveryFee = isFreeDelivery ? 0 : 50;
  const totalAmount = price + deliveryFee;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const handlePayNow = async () => {
    setIsProcessing(true);

    try {
      const selectedApp = UPI_APPS.find((a: any) => a.id === selectedAppId);
      const appName = selectedApp?.name || 'UPI App';

      const success = await UpiService.launchUpiPayment({
        appId: selectedAppId as any,
        amount: totalAmount,
        orderId: `AMUL_${Date.now()}`,
        merchantName: 'Amul D2C Cloud',
        note: `Amul Flash: ${product.title}`,
      });

      setIsProcessing(false);

      if (success) {
        addActivityLog({
          type: 'order' as any,
          title: `Flash Order Initiated via ${appName}`,
          description: `${product.title} (₹${totalAmount})`,
          status: 'success',
          pincode: selectedPincode.pincode,
        });
        onClose();
        Alert.alert(
          'UPI App Opened',
          `Complete your payment of ₹${totalAmount} in ${appName} to confirm your Amul delivery!`
        );
      } else {
        Alert.alert('Notice', `Could not open ${appName}. Please ensure the app is installed.`);
      }
    } catch (e: any) {
      setIsProcessing(false);
      Alert.alert('Checkout Error', e.message || 'Could not initiate payment.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Pull Bar */}
          <View style={styles.pullBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWithIcon}>
              <Zap size={20} color="#2563EB" />
              <Text style={styles.sheetTitle}>Flash Checkout</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Urgency Chip */}
          <View style={styles.urgencyChip}>
            <Flame size={14} color="#EA580C" />
            <Text style={styles.urgencyText}>
              Cart reserved for {minutes}:{seconds < 10 ? `0${seconds}` : seconds} mins
            </Text>
          </View>

          {/* Product Summary Box */}
          <View style={styles.productCard}>
            <Image source={{ uri: product.imageUrl }} style={styles.thumbImage} resizeMode="contain" />
            <View style={styles.productInfoCol}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {product.title}
              </Text>
              <Text style={styles.productSubtext}>
                {primaryVariant?.name || '1 Pack'} • {selectedPincode.pincode}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>₹{price}</Text>
                {isFreeDelivery ? (
                  <View style={styles.freeDeliveryBadge}>
                    <Text style={styles.freeDeliveryText}>FREE DELIVERY</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Delivery Address Pill */}
          <View style={styles.addressPill}>
            <MapPin size={16} color="#2563EB" />
            <View style={styles.addressTextCol}>
              <Text style={styles.addressLabel}>Delivery Location</Text>
              <Text style={styles.addressValue} numberOfLines={1}>
                {selectedPincode.label} ({selectedPincode.pincode}) • Hub: {selectedPincode.storeId}
              </Text>
            </View>
          </View>

          {/* Payment Method Selector */}
          <Text style={styles.sectionHeading}>SELECT UPI PAYMENT APP</Text>
          <View style={styles.upiGrid}>
            {UPI_APPS.map((app: any) => {
              const isSelected = selectedAppId === app.id;
              return (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.upiCard, isSelected && styles.upiCardSelected]}
                  onPress={() => setSelectedAppId(app.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.upiCardLeft}>
                    <View style={[styles.appIconCircle, { backgroundColor: app.color }]}>
                      <Text style={styles.appIconLetter}>{app.name[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.appName}>{app.name}</Text>
                      {app.id === 'gpay' ? (
                        <Text style={styles.appSubtext}>⚡ 1-Tap Pay</Text>
                      ) : null}
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownVal}>₹{price}.00</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Delivery Fee</Text>
              <Text style={[styles.breakdownVal, isFreeDelivery && styles.freeText]}>
                {isFreeDelivery ? 'FREE' : `₹${deliveryFee}.00`}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalAmount}>₹{totalAmount}</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.payButton, isProcessing && styles.buttonDisabled]}
            onPress={handlePayNow}
            disabled={isProcessing}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.payButtonText}>SLIDE TO PAY ₹{totalAmount}</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.securityFooter}>
            <ShieldCheck size={13} color="#64748B" />
            <Text style={styles.securityFooterText}>
              Powered by NPCI UPI. 100% Encrypted & Safe.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  pullBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginBottom: 14,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 12,
  },
  thumbImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  productInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  productSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  freeDeliveryBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeDeliveryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  addressTextCol: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  addressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  upiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  upiCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
  },
  upiCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  upiCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconLetter: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  appSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBreakdown: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  freeText: {
    color: '#10B981',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  payButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  securityFooterText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});
