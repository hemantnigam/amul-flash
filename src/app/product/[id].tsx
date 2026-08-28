import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Zap,
  ShieldCheck,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Bell,
  MapPin,
  CheckCircle2,
  ShoppingCart,
  Plus,
  Minus,
} from 'lucide-react-native';
import { useStockStore } from '../../store/useStockStore';
import { useSessionStore } from '../../store/useSessionStore';
import { StockBadge } from '../../components/StockBadge';
import { AmulCheckoutModal } from '../../components/AmulCheckoutModal';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, toggleAutoCartForProduct, selectedPincode } = useStockStore();
  const { cart, addToCart } = useSessionStore();

  const product = products.find((p) => p.id === id) || products[0];
  const primaryVariant = product?.variants?.[0];
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);

  // Cart quantity state (1 to max 5)
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    // Check if this product is already in the active Amul cart
    if (cart && product) {
      const existingItem = cart.items.find(
        (it) => it.productId === product.id || it.sku === (primaryVariant?.sku || product.id)
      );
      if (existingItem && existingItem.quantity > 0) {
        setQuantity(Math.min(existingItem.quantity, 5));
        setAddedSuccess(true);
      }
    }
  }, [cart, product, primaryVariant]);

  if (!product) return null;

  const isInStock = primaryVariant?.isInStock;
  const isTracked = product.autoCartEnabled ?? true;
  const primarySku = primaryVariant?.sku || product.id;

  const handleIncrement = () => {
    if (quantity < 5) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    const success = await addToCart(product.id, primarySku, quantity);
    setIsAddingToCart(false);
    if (success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    }
  };

  const totalPrice = product.defaultPrice * quantity;

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <View style={styles.imageCard}>
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
          <View style={styles.stockBadgeFloat}>
            <StockBadge isInStock={isInStock} stockCount={primaryVariant?.stockCount || 0} size="md" />
          </View>
        </View>

        {/* Title & Info */}
        <View style={styles.infoCard}>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.categorySubtext}>
            {product.category?.toUpperCase()} • {product.flavor || 'D2C Direct'}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceSymbol}>₹</Text>
            <Text style={styles.priceValue}>{product.defaultPrice}</Text>
            <View style={styles.pincodeBadge}>
              <MapPin size={12} color="#2563EB" />
              <Text style={styles.pincodeText}>{selectedPincode.pincode} Hub</Text>
            </View>
          </View>
        </View>

        {/* 1. Track Switch Card (Renamed to Track) */}
        <View style={styles.trackCard}>
          <View style={styles.trackLeft}>
            <View style={[styles.trackIconBox, isTracked ? styles.trackIconActive : styles.trackIconInactive]}>
              <Bell size={20} color={isTracked ? '#1D4ED8' : '#64748B'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trackTitle}>Track</Text>
              <Text style={styles.trackSub}>
                {isTracked
                  ? 'Active: Real-time notification alerts enabled for stock drops'
                  : 'Disabled: Toggle on to get notified on stock drops'}
              </Text>
            </View>
          </View>
          <Switch
            value={isTracked}
            onValueChange={() => toggleAutoCartForProduct(product.id, product)}
            trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
          />
        </View>

        {/* 2. Amul Cart Option Card with Max 5 Stepper */}
        <View style={styles.cartOptionCard}>
          <View style={styles.cartOptionHeader}>
            <View style={styles.cartOptionTitleRow}>
              <ShoppingCart size={18} color="#2563EB" />
              <Text style={styles.cartOptionTitle}>Amul Cloud Cart</Text>
            </View>
            <Text style={styles.cartMaxLabel}>Max 5 units</Text>
          </View>

          <View style={styles.stepperActionRow}>
            {/* Quantity Stepper (1 to 5) */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={[styles.stepBtn, quantity <= 1 && styles.stepBtnDisabled]}
                onPress={handleDecrement}
                disabled={quantity <= 1}
                activeOpacity={0.7}
              >
                <Minus size={16} color={quantity <= 1 ? '#94A3B8' : '#0F172A'} />
              </TouchableOpacity>

              <View style={styles.qtyDisplay}>
                <Text style={styles.qtyText}>{quantity}</Text>
              </View>

              <TouchableOpacity
                style={[styles.stepBtn, quantity >= 5 && styles.stepBtnDisabled]}
                onPress={handleIncrement}
                disabled={quantity >= 5}
                activeOpacity={0.7}
              >
                <Plus size={16} color={quantity >= 5 ? '#94A3B8' : '#0F172A'} />
              </TouchableOpacity>
            </View>

            {/* Add to Cart Button */}
            <TouchableOpacity
              style={[styles.addToCartBtn, isAddingToCart && styles.addToCartBtnDisabled]}
              onPress={handleAddToCart}
              disabled={isAddingToCart}
              activeOpacity={0.85}
            >
              {isAddingToCart ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShoppingCart size={15} color="#FFFFFF" />
                  <Text style={styles.addToCartBtnText}>
                    {addedSuccess ? '✓ In Amul Cart' : `Add ${quantity} to Cart`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {addedSuccess && (
            <View style={styles.cartFeedbackRow}>
              <CheckCircle2 size={13} color="#10B981" />
              <Text style={styles.cartFeedbackText}>
                {quantity} {quantity === 1 ? 'pack' : 'packs'} reserved in your Amul Cloud Cart
              </Text>
            </View>
          )}
        </View>

        {/* Nutrition Macro Facts (if available) */}
        {product.nutrition?.proteinGrams ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nutrition Breakdown per Serving</Text>
            <Text style={styles.servingText}>Serving: {product.nutrition.servingSize}</Text>

            <View style={styles.macroGrid}>
              <View style={styles.macroBox}>
                <View style={[styles.macroIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Dumbbell size={16} color="#D97706" />
                </View>
                <Text style={styles.macroValue}>{product.nutrition.proteinGrams}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>

              <View style={styles.macroBox}>
                <View style={[styles.macroIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Flame size={16} color="#DC2626" />
                </View>
                <Text style={styles.macroValue}>{product.nutrition.calories}</Text>
                <Text style={styles.macroLabel}>Calories</Text>
              </View>

              <View style={styles.macroBox}>
                <View style={[styles.macroIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Wheat size={16} color="#2563EB" />
                </View>
                <Text style={styles.macroValue}>{product.nutrition.carbsGrams}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>

              <View style={styles.macroBox}>
                <View style={[styles.macroIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Droplet size={16} color="#7C3AED" />
                </View>
                <Text style={styles.macroValue}>{product.nutrition.fatGrams}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Product Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Description</Text>
          <Text style={styles.descriptionText}>
            {product.description || 'Authentic fresh Amul D2C product directly from GCMMF manufacturing hubs.'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomTotalLabel}>Total ({quantity} {quantity === 1 ? 'item' : 'items'})</Text>
          <Text style={styles.bottomTotalPrice}>₹{totalPrice}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => setIsCheckoutModalVisible(true)}
          activeOpacity={0.85}
        >
          <ShoppingCart size={18} color="#FFFFFF" />
          <Text style={styles.checkoutBtnText}>Proceed to Amul Checkout</Text>
        </TouchableOpacity>
      </View>

      {/* Official Amul Checkout Modal */}
      <AmulCheckoutModal
        visible={isCheckoutModalVisible}
        product={product}
        onClose={() => setIsCheckoutModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  productImage: {
    width: '100%',
    height: 220,
  },
  stockBadgeFloat: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
  },
  categorySubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    gap: 2,
  },
  priceSymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0037B0',
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0037B0',
    marginRight: 10,
  },
  pincodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pincodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  trackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  trackIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackIconActive: {
    backgroundColor: '#EFF6FF',
  },
  trackIconInactive: {
    backgroundColor: '#F1F5F9',
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  trackSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cartOptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cartOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cartOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cartMaxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepperActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  stepBtnDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.5,
  },
  qtyDisplay: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  addToCartBtnDisabled: {
    opacity: 0.6,
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cartFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  cartFeedbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  servingText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  macroBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  macroIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  bottomPriceCol: {},
  bottomTotalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomTotalPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  checkoutBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
