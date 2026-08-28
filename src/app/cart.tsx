import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ShoppingCart,
  RefreshCw,
  Truck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react-native';
import { useSessionStore } from '../store/useSessionStore';
import { AmulCheckoutModal } from '../components/AmulCheckoutModal';
import { INITIAL_PRODUCTS } from '../constants/products';

export default function CartScreen() {
  const router = useRouter();
  const { cart, isLoadingUserData, loadUserData, addToCart } = useSessionStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const handleRefresh = async () => {
    setIsSyncing(true);
    await loadUserData();
    setIsSyncing(false);
  };

  const items = cart?.items || [];
  const itemCount = cart?.itemsCount || items.reduce((acc, it) => acc + it.quantity, 0);
  const total = cart?.total || items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const subtotal = cart?.subtotal || total;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Amul Cloud Cart</Text>
          <Text style={styles.headerSubtitle}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in session
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
        {/* Delivery Guarantee Banner */}
        <View style={styles.deliveryBanner}>
          <View style={styles.deliveryBannerIconBox}>
            <Truck size={18} color="#1D4ED8" />
          </View>
          <View style={styles.deliveryBannerTextCol}>
            <Text style={styles.deliveryBannerTitle}>Amul D2C Express Delivery</Text>
            <Text style={styles.deliveryBannerSub}>
              Shipped fresh directly from GCMMF temperature-controlled hubs
            </Text>
          </View>
        </View>

        {items.length > 0 ? (
          <>
            {/* Cart Items Card */}
            <View style={styles.cartCard}>
              <Text style={styles.cartCardHeading}>RESERVED CART ITEMS</Text>
              {items.map((item, index) => (
                <View
                  key={item.id || index}
                  style={[
                    styles.itemRow,
                    index < items.length - 1 && styles.itemRowBorder,
                  ]}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                    <View style={styles.itemPricingRow}>
                      <View style={styles.qtyPill}>
                        <Text style={styles.qtyPillText}>Qty: {item.quantity}</Text>
                      </View>
                      <View style={styles.priceCol}>
                        <Text style={styles.unitPriceText}>
                          ₹{item.price} each
                        </Text>
                        <Text style={styles.itemTotalPrice}>
                          ₹{item.price * item.quantity}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Bill Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryHeading}>BILL DETAILS</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Item Total ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </Text>
                <Text style={styles.summaryValue}>₹{subtotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee (Amul D2C)</Text>
                <Text style={[styles.summaryValue, { color: '#059669', fontWeight: '800' }]}>
                  FREE
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Packaging & Cold Chain</Text>
                <Text style={[styles.summaryValue, { color: '#059669', fontWeight: '800' }]}>
                  FREE
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>To Pay</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </View>

            {/* Session Reservation Notice */}
            <View style={styles.securityNote}>
              <ShieldCheck size={16} color="#059669" />
              <Text style={styles.securityText}>
                Items are reserved in your authenticated Amul Cloud session.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <ShoppingCart size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Explore high-protein and dairy essentials from the catalog to add items.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnText}>Browse Products</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Checkout Bar */}
      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceCol}>
            <Text style={styles.bottomTotalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.bottomTotalPrice}>₹{total}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => setIsCheckoutModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <ExternalLink size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Official Amul Checkout Modal */}
      <AmulCheckoutModal
        visible={isCheckoutModalVisible}
        product={INITIAL_PRODUCTS[0]}
        onClose={() => setIsCheckoutModalVisible(false)}
      />
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
    paddingBottom: 110,
  },
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  deliveryBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryBannerTextCol: {
    flex: 1,
  },
  deliveryBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  deliveryBannerSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  cartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cartCardHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  itemSku: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemPricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qtyPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qtyPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  unitPriceText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0037B0',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  summaryHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0037B0',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  securityText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  bottomTotalPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0037B0',
  },
  checkoutBtn: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
