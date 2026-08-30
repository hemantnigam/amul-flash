import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { AppText as Text } from './AppText';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  BellRing,
  Zap,
  MapPin,
  Package,
  ShoppingCart,
  VolumeX,
} from 'lucide-react-native';
import { useStockStore } from '../store/useStockStore';
import { NotificationService } from '../services/notificationService';

export const FullScreenAlarmOverlay: React.FC = () => {
  const router = useRouter();
  const { activeAlarmEvent, dismissAlarmEvent, products } = useStockStore();

  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [ringScale1] = useState(() => new Animated.Value(1));
  const [ringOpacity1] = useState(() => new Animated.Value(0.8));
  const [ringScale2] = useState(() => new Animated.Value(1));
  const [ringOpacity2] = useState(() => new Animated.Value(0.6));

  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Find detailed product info if available
  const product = activeAlarmEvent
    ? products.find((p) => p.id === activeAlarmEvent.productId)
    : null;

  // Live Digital Clock
  useEffect(() => {
    if (!activeAlarmEvent) return;

    const updateClock = () => {
      const d = new Date();
      const hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      setCurrentTimeStr(`${formattedHours}:${mins}:${secs} ${ampm}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [activeAlarmEvent]);

  // Looping Pulse Animations (Alarm Radar Waves)
  useEffect(() => {
    if (!activeAlarmEvent) return;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    const waveLoop1 = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale1, {
          toValue: 2.2,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity1, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );

    const waveLoop2 = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale2, {
          toValue: 2.6,
          duration: 1600,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity2, {
          toValue: 0,
          duration: 1600,
          delay: 400,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    waveLoop1.start();
    waveLoop2.start();

    return () => {
      pulseLoop.stop();
      waveLoop1.stop();
      waveLoop2.stop();
      ringScale1.setValue(1);
      ringOpacity1.setValue(0.8);
      ringScale2.setValue(1);
      ringOpacity2.setValue(0.6);
    };
  }, [activeAlarmEvent, pulseAnim, ringScale1, ringOpacity1, ringScale2, ringOpacity2]);

  if (!activeAlarmEvent) return null;

  const handleStopAlarm = () => {
    NotificationService.cancelAllNotifications();
    dismissAlarmEvent();
  };

  const handleViewProduct = () => {
    NotificationService.cancelAllNotifications();
    const targetId = activeAlarmEvent.productId;
    dismissAlarmEvent();
    if (targetId) {
      router.push(`/product/${targetId}`);
    }
  };

  return (
    <Modal
      visible={Boolean(activeAlarmEvent)}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleStopAlarm}
    >
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />
      <View style={styles.container}>
        {/* Top Emergency Status Bar */}
        <View style={styles.topBar}>
          <View style={styles.emergencyTag}>
            <Zap size={14} color="#FF6B00" />
            <Text style={styles.emergencyTagText}>LIVE RESTOCK RADAR DROP</Text>
          </View>
          <Text style={styles.clockText}>{currentTimeStr}</Text>
        </View>

        {/* Central Glowing Pulsing Radar Icon */}
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
          <Text style={styles.mainTitle}>STOCK DROP ALERT</Text>
          <Text style={styles.subTitle}>
            Ringing high-priority restock alarm for tracked product
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
                  +{activeAlarmEvent.unitsAdded} Units Restocked
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
                ₹{product?.defaultPrice || 500}
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

          {/* Stop Alarm Button (Full screen dismiss like Clock Alarm) */}
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
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: Platform.OS === 'android' ? 32 : 44,
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
