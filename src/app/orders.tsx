import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Package,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ArrowRight,
} from 'lucide-react-native';
import { useSessionStore } from '../store/useSessionStore';
import { useAppTheme } from '../hooks/useAppTheme';

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, isLoadingUserData, loadUserData } = useSessionStore();
  const { colors, isDark } = useAppTheme();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsSyncing(true);
    await loadUserData();
    setIsSyncing(false);
  };

  const handleTrackShipment = (trackingNumber?: string) => {
    if (!trackingNumber) {
      Alert.alert('Tracking Info', 'Order is processed at central GCMMF hub. AWB generation in progress.');
      return;
    }
    // Track via Bluedart / Delhivery / SpeedPost
    Linking.openURL(`https://www.delhivery.com/track/package/${trackingNumber}`).catch(() => {
      Alert.alert('Tracking Number', `AWB: ${trackingNumber}\nCourier: Amul Express Logistics`);
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Order History</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed on Amul
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshHeaderBtn, { backgroundColor: colors.surfaceContainer }]}
          onPress={handleRefresh}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <RefreshCw size={18} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingUserData || isSyncing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {orders.length > 0 ? (
          orders.map((order) => {
            const isDelivered = order.status === 'delivered';
            const isOutForDelivery = order.status === 'out_for_delivery';
            const statusColor = isDelivered ? (isDark ? '#34D399' : '#059669') : isOutForDelivery ? colors.primary : (isDark ? '#FBBF24' : '#D97706');
            const statusBg = isDelivered ? (isDark ? '#064E3B' : '#ECFDF5') : isOutForDelivery ? (isDark ? '#1E3A8A' : '#EFF6FF') : (isDark ? '#451A03' : '#FFFBEB');
            const statusLabel = isDelivered
              ? 'DELIVERED'
              : isOutForDelivery
              ? 'OUT FOR DELIVERY'
              : 'CONFIRMED';

            const formattedDate =
              typeof order.createdAt === 'string'
                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

            return (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Order Top Bar */}
                <View style={[styles.orderTopBar, { borderBottomColor: colors.border }]}>
                  <View>
                    <Text style={[styles.orderNumber, { color: colors.text }]}>{order.orderNumber}</Text>
                    <Text style={[styles.orderDate, { color: colors.textSecondary }]}>Placed on {formattedDate}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                    {isDelivered ? (
                      <CheckCircle2 size={12} color={statusColor} />
                    ) : isOutForDelivery ? (
                      <Truck size={12} color={statusColor} />
                    ) : (
                      <Clock size={12} color={statusColor} />
                    )}
                    <Text style={[styles.statusPillText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Items in Order */}
                <View style={[styles.orderItemsBox, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
                  {order.items.map((item, idx) => (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.itemRow,
                        idx < order.items.length - 1 && [styles.itemRowBorder, { borderBottomColor: colors.border }],
                      ]}
                    >
                      <Image
                        source={{
                          uri:
                            item.image ||
                            'https://shop.amul.com/s/62fa94df8c13af2e242eba16/66d15f3206e72f00e5bcef29/01-hero-image_multipack-30.png',
                        }}
                        style={styles.itemThumb}
                        contentFit="contain"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={[styles.itemSku, { color: colors.textSecondary }]}>SKU: {item.sku}</Text>
                        <View style={styles.itemBottom}>
                          <Text style={[styles.itemQty, { color: colors.textSecondary }]}>Qty: {item.quantity}</Text>
                          <Text style={[styles.itemPrice, { color: colors.text }]}>₹{item.price * item.quantity}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Total & Delivery Address */}
                <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
                  {order.shippingAddress && (
                    <View style={styles.addressRow}>
                      <MapPin size={13} color={colors.textSecondary} />
                      <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {order.shippingAddress.address || `${order.shippingAddress.city} - ${order.shippingAddress.zip}`}
                      </Text>
                    </View>
                  )}
                  <View style={styles.footerPriceRow}>
                    <Text style={[styles.footerPriceLabel, { color: colors.textSecondary }]}>Total Paid:</Text>
                    <Text style={[styles.footerPriceValue, { color: colors.primary }]}>₹{order.totalAmount}</Text>
                  </View>

                  {order.trackingNumber && (
                    <TouchableOpacity
                      style={[styles.trackBtn, { backgroundColor: isDark ? '#1E1E1E' : '#EFF6FF' }]}
                      onPress={() => handleTrackShipment(order.trackingNumber)}
                      activeOpacity={0.7}
                    >
                      <Truck size={14} color={colors.primary} />
                      <Text style={[styles.trackBtnText, { color: colors.primary }]}>
                        AWB: {order.trackingNumber}
                      </Text>
                      <ExternalLink size={13} color={colors.primary} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1E1E1E' : '#EFF6FF' }]}>
              <Package size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Your orders placed via Amul Flash or online will automatically appear here.
            </Text>
            <TouchableOpacity
              style={[styles.browseBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Text style={styles.browseBtnText}>Browse Amul Store</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  refreshHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  orderTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '900',
  },
  orderDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  orderItemsBox: {
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    gap: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  itemSku: {
    fontSize: 10,
    marginTop: 2,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '900',
  },
  orderFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  footerPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerPriceLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerPriceValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 11,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
