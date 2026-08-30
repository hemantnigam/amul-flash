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

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, isLoadingUserData, loadUserData } = useSessionStore();
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed on Amul
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshHeaderBtn}
          onPress={handleRefresh}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <RefreshCw size={18} color="#2563EB" />
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
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {orders.length > 0 ? (
          orders.map((order) => {
            const isDelivered = order.status === 'delivered';
            const isOutForDelivery = order.status === 'out_for_delivery';
            const statusColor = isDelivered ? '#059669' : isOutForDelivery ? '#2563EB' : '#D97706';
            const statusBg = isDelivered ? '#ECFDF5' : isOutForDelivery ? '#EFF6FF' : '#FFFBEB';
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
              <View key={order.id} style={styles.orderCard}>
                {/* Order Top Bar */}
                <View style={styles.orderTopBar}>
                  <View>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>Placed on {formattedDate}</Text>
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
                <View style={styles.orderItemsBox}>
                  {order.items.map((item, idx) => (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.itemRow,
                        idx < order.items.length - 1 && styles.itemRowBorder,
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
                        <Text style={styles.itemTitle} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                        <View style={styles.itemBottom}>
                          <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                          <Text style={styles.itemPrice}>₹{item.price}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Order Footer & Tracking */}
                <View style={styles.orderFooter}>
                  <View style={styles.footerPriceRow}>
                    <Text style={styles.footerPriceLabel}>Total Order Value</Text>
                    <Text style={styles.footerPriceValue}>₹{order.totalAmount}</Text>
                  </View>

                  {order.shippingAddress && (
                    <View style={styles.addressRow}>
                      <MapPin size={13} color="#64748B" />
                      <Text style={styles.addressText} numberOfLines={1}>
                        {order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.zip}
                      </Text>
                    </View>
                  )}

                  {order.trackingNumber && (
                    <View style={styles.trackingRow}>
                      <View style={styles.trackingLeft}>
                        <Truck size={14} color="#2563EB" />
                        <Text style={styles.trackingAwb}>
                          AWB: {order.trackingNumber}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => handleTrackShipment(order.trackingNumber)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.trackBtnText}>Track Shipment</Text>
                        <ExternalLink size={12} color="#2563EB" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Package size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              Orders placed on Amul with your authenticated account will be tracked here in real-time.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnText}>Explore Products</Text>
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
    backgroundColor: '#FAF8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  refreshHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  orderTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#64748B',
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
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    gap: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 17,
  },
  itemSku: {
    fontSize: 10,
    color: '#64748B',
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
    color: '#475569',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0037B0',
  },
  orderFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    color: '#475569',
  },
  footerPriceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
  },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  trackingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingAwb: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  browseBtn: {
    backgroundColor: '#1D4ED8',
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
