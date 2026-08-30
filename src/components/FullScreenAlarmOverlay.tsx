import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppText as Text } from './AppText';
import {
  BellRing,
  ShoppingCart,
  VolumeX,
  Zap,
  MapPin,
  Package,
} from 'lucide-react-native';
import { useStockStore } from '../store/useStockStore';

export const FullScreenAlarmOverlay: React.FC = () => {
  const router = useRouter();
  const { activeAlarmEvent, dismissAlarmEvent, allProductsMap, products } =
    useStockStore();

  const [currentTime, setCurrentTime] = useState('');
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [ringScale1] = useState(() => new Animated.Value(1));
  const [ringOpacity1] = useState(() => new Animated.Value(0.8));
  const [ringScale2] = useState(() => new Animated.Value(1));
  const [ringOpacity2] = useState(() => new Animated.Value(0.6));

  // Live Digital Clock format (e.g. 10:42:15 PM)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Radar Pulse Animation
  useEffect(() => {
    if (!activeAlarmEvent) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    const ring1 = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale1, {
          toValue: 2.2,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity1, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    const ring2 = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(ringScale2, {
            toValue: 2.4,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity2, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();
    ring1.start();
    ring2.start();

    return () => {
      pulse.stop();
      ring1.stop();
      ring2.stop();
      pulseAnim.setValue(1);
      ringScale1.setValue(1);
      ringOpacity1.setValue(0.8);
      ringScale2.setValue(1);
      ringOpacity2.setValue(0.6);
    };
  }, [activeAlarmEvent, pulseAnim, ringScale1, ringOpacity1, ringScale2, ringOpacity2]);

  if (!activeAlarmEvent) return null;

  // Find product image and details
  const product =
    allProductsMap[activeAlarmEvent.productId] ||
    products.find((p) => p.id === activeAlarmEvent.productId);

  const handleStopAlarm = () => {
    dismissAlarmEvent();
  };

  const handleViewProduct = () => {
    const targetId = activeAlarmEvent.productId;
    dismissAlarmEvent();
    if (targetId) {
      router.push(`/product/${targetId}`);
    }
  };

  return (
    <Modal
      visible={Boolean(activeAlarmEvent)}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Top Emergency Tag & Clock */}
        <View style={styles.topBar}>
          <View style={styles.emergencyTag}>
            <Zap size={14} color="#FF8A00" fill="#FF8A00" />
            <Text style={styles.emergencyTagText}>LIVE RESTOCK ALARM</Text>
          </View>
          <Text style={styles.clockText}>{currentTime}</Text>
        </View>

        {/* Pulsing Bell Icon & Expanding Radar Rings */}
        <View style={styles.pulsingCenterContainer}>
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: ringScale2 }],
                opacity: ringOpacity2,
                borderColor: '#FF6B00',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: ringScale1 }],
                opacity: ringOpacity1,
                borderColor: '#EF4444',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bellGlowCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <BellRing size={44} color="#FFFFFF" />
          </Animated.View>
        </View>

        {/* Alarm Title & Description */}
        <View style={styles.headerInfo}>
          <Text style={styles.mainTitle}>STOCK DROP DETECTED!</Text>
          <Text style={styles.subTitle}>
            Ringing instant restock alarm for tracked product
          </Text>
        </View>

        {/* Product Details Hero Card */}
        <View style={styles.productHeroCard}>
          {product?.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              contentFit="contain"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Package size={32} color="#94A3B8" />
            </View>
          )}

          <View style={styles.productInfoCol}>
            <Text style={styles.productName} numberOfLines={2}>
              {activeAlarmEvent.productName}
            </Text>

            <View style={styles.productBadgesRow}>
              <View style={styles.stockBadge}>
                <Zap size={12} color="#16A34A" />
                <Text style={styles.stockBadgeText}>
                  +{activeAlarmEvent.unitsAdded} Units
                </Text>
              </View>

              {activeAlarmEvent.pincode && (
                <View style={styles.pincodeBadge}>
                  <MapPin size={11} color="#3B82F6" />
                  <Text style={styles.pincodeBadgeText}>
                    Hub: {activeAlarmEvent.pincode}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price: </Text>
              <Text style={styles.priceValue}>
                ₹{product?.defaultPrice || product?.variants[0]?.price || 500}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Actions: Stop Alarm & View Product */}
        <View style={styles.bottomActionsContainer}>
          {/* Quick Buy / View Product Button */}
          <TouchableOpacity
            style={styles.viewProductBtn}
            onPress={handleViewProduct}
            activeOpacity={0.85}
          >
            <ShoppingCart size={20} color="#FFFFFF" />
            <Text style={styles.viewProductBtnText}>View Product & Buy Now</Text>
          </TouchableOpacity>

          {/* Stop Alarm Button */}
          <TouchableOpacity
            style={styles.stopAlarmBtn}
            onPress={handleStopAlarm}
            activeOpacity={0.8}
          >
            <VolumeX size={20} color="#EF4444" />
            <Text style={styles.stopAlarmBtnText}>STOP ALARM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: Platform.OS === 'android' ? 36 : 48,
  },
  topBar: {
    alignItems: 'center',
    gap: 8,
  },
  emergencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderColor: 'rgba(255, 107, 0, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  emergencyTagText: {
    color: '#FF8A00',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.8,
  },
  clockText: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#F8FAFC',
    letterSpacing: 1,
    marginTop: 4,
  },
  pulsingCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
  },
  bellGlowCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
  },
  headerInfo: {
    alignItems: 'center',
    marginTop: -10,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  productHeroCard: {
    backgroundColor: '#131B2E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  productImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#1E293B',
  },
  productImagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  productBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    borderColor: 'rgba(22, 163, 74, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
  },
  pincodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  pincodeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bottomActionsContainer: {
    gap: 12,
    width: '100%',
  },
  viewProductBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  viewProductBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.3,
  },
  stopAlarmBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopAlarmBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.8,
  },
});
