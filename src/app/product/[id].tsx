import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Info,
} from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { useStockStore } from '../../store/useStockStore';
import { StockBadge } from '../../components/StockBadge';
import { FlashCheckoutModal } from '../../components/FlashCheckoutModal';
import { ProductVariant } from '../../types/amul';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, toggleAutoCartForProduct, selectedPincode } = useStockStore();

  const product = products.find((p) => p.id === id) || products[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0]
  );
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);

  const isInStock = selectedVariant?.isInStock;

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title & Stock Badge */}
        <View style={styles.headerSection}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>
              {product.category.toUpperCase()} • {product.flavor || 'NATURAL'}
            </Text>
          </View>
          <Text style={styles.productTitle}>{product.title}</Text>
          <View style={styles.statusRow}>
            <StockBadge
              isInStock={isInStock}
              stockCount={selectedVariant.stockCount}
            />
            <Text style={styles.pincodeNotice}>
              Live in {selectedPincode.label} ({selectedPincode.pincode})
            </Text>
          </View>
        </View>

        {/* Nutrition Macro Facts Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nutrition Breakdown per Serving</Text>
          <Text style={styles.servingText}>
            Serving Size: {product.nutrition.servingSize}
          </Text>

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
                <Droplet size={16} color="#7E22CE" />
              </View>
              <Text style={styles.macroValue}>{product.nutrition.fatGrams}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Pack Size Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Pack Size</Text>
          <View style={styles.variantList}>
            {product.variants.map((v) => {
              const isSelected = v.id === selectedVariant.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.variantItem, isSelected && styles.variantItemSelected]}
                  onPress={() => setSelectedVariant(v)}
                  activeOpacity={0.7}
                >
                  <View style={styles.variantInfo}>
                    <Text style={styles.variantName}>{v.name}</Text>
                    <Text style={styles.variantStockSub}>
                      {v.isInStock
                        ? `${v.stockCount} units in stock`
                        : 'Out of stock at this hub'}
                    </Text>
                  </View>

                  <View style={styles.variantPriceColumn}>
                    <Text style={styles.variantPrice}>₹{v.price}</Text>
                    {v.originalPrice && v.originalPrice > v.price && (
                      <Text style={styles.variantOriginalPrice}>
                        ₹{v.originalPrice}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Headless Auto-Cart Switch */}
        <View style={styles.card}>
          <View style={styles.autoCartRow}>
            <View style={styles.autoCartTextCol}>
              <View style={styles.autoCartTitleRow}>
                <Zap size={16} color={Theme.colors.primary} />
                <Text style={styles.autoCartTitle}>Pre-emptive Headless Auto-Cart</Text>
              </View>
              <Text style={styles.autoCartDesc}>
                Lock this SKU in your cart within &lt;300ms of FCM restock drop signal before opening app.
              </Text>
            </View>
            <Switch
              value={product.autoCartEnabled}
              onValueChange={() => toggleAutoCartForProduct(product.id)}
              trackColor={{ true: Theme.colors.primaryContainer, false: '#D1D5DB' }}
            />
          </View>
        </View>

        {/* Product Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About Product</Text>
          <Text style={styles.descText}>{product.description}</Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Total Price</Text>
          <Text style={styles.bottomPriceVal}>₹{selectedVariant.price}</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutActionBtn, !isInStock && styles.checkoutBtnDisabled]}
          onPress={() => setIsCheckoutModalVisible(true)}
          disabled={!isInStock}
          activeOpacity={0.8}
        >
          <Zap size={18} color="#FFFFFF" />
          <Text style={styles.checkoutActionText}>
            {isInStock ? '⚡ 1-Tap Flash Pay' : 'Auto-Reserve when Live'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1-Tap Flash Checkout Modal */}
      <FlashCheckoutModal
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
    backgroundColor: Theme.colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Theme.spacing.containerMargin,
    gap: 14,
    paddingBottom: 100,
  },
  headerSection: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.sm,
    marginBottom: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.onSurface,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pincodeNotice: {
    fontSize: 12,
    color: Theme.colors.secondary,
  },
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginBottom: 6,
  },
  servingText: {
    fontSize: 12,
    color: Theme.colors.secondary,
    marginBottom: 14,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: Theme.radius.lg,
  },
  macroIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.onSurface,
  },
  macroLabel: {
    fontSize: 11,
    color: Theme.colors.secondary,
    marginTop: 2,
  },
  variantList: {
    gap: 8,
  },
  variantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  variantItemSelected: {
    borderColor: Theme.colors.primaryContainer,
    backgroundColor: '#EFF6FF',
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  variantStockSub: {
    fontSize: 12,
    color: Theme.colors.secondary,
    marginTop: 2,
  },
  variantPriceColumn: {
    alignItems: 'flex-end',
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.onSurface,
  },
  variantOriginalPrice: {
    fontSize: 12,
    color: Theme.colors.secondary,
    textDecorationLine: 'line-through',
  },
  autoCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoCartTextCol: {
    flex: 1,
    marginRight: 12,
  },
  autoCartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  autoCartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  autoCartDesc: {
    fontSize: 12,
    color: Theme.colors.secondary,
    lineHeight: 16,
  },
  descText: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.containerMargin,
    paddingBottom: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: Theme.colors.secondary,
  },
  bottomPriceVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.onSurface,
  },
  checkoutActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primaryContainer,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Theme.radius.lg,
    gap: 6,
  },
  checkoutBtnDisabled: {
    backgroundColor: Theme.colors.secondary,
    opacity: 0.7,
  },
  checkoutActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
