import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch } from 'react-native';
import { Zap, Bell, Check, ShoppingCart } from 'lucide-react-native';
import { AmulProduct } from '../types/amul';
import { useStockStore } from '../store/useStockStore';

interface ProductCardProps {
  product: AmulProduct;
  onPress: () => void;
  onQuickBuy?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onQuickBuy,
}) => {
  const { toggleAutoCartForProduct } = useStockStore();
  const primaryVariant = product.variants[0];
  const isInStock = primaryVariant?.isInStock;
  const stockCount = primaryVariant?.stockCount || 0;
  const isTracked = product.autoCartEnabled ?? true;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Top Bar: Stock Status & Track Toggle */}
      <View style={styles.topHeader}>
        <View style={[styles.stockPill, isInStock ? styles.stockPillIn : styles.stockPillOut]}>
          <View style={[styles.pulseDot, { backgroundColor: isInStock ? '#10B981' : '#EF4444' }]} />
          <Text style={[styles.stockPillText, { color: isInStock ? '#047857' : '#B91C1C' }]}>
            {isInStock ? `IN STOCK (${stockCount})` : 'OUT OF STOCK'}
          </Text>
        </View>

        {/* Minimal Track Switch */}
        <TouchableOpacity
          style={[styles.trackButton, isTracked ? styles.trackButtonActive : styles.trackButtonInactive]}
          onPress={() => toggleAutoCartForProduct(product.id)}
          activeOpacity={0.7}
        >
          <Bell size={12} color={isTracked ? '#1D4ED8' : '#94A3B8'} />
          <Text style={[styles.trackButtonText, isTracked ? styles.trackTextActive : styles.trackTextInactive]}>
            {isTracked ? 'Tracking' : 'Track'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentRow}>
        {/* Product Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* Product Info */}
        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>

          {/* Protein & Nutrition Macro Tag */}
          {product.nutrition?.proteinGrams ? (
            <View style={styles.macroTag}>
              <Text style={styles.macroTagText}>
                ⚡ {product.nutrition.proteinGrams}g Protein • {product.nutrition.calories} kcal
              </Text>
            </View>
          ) : (
            <Text style={styles.categorySubtext}>
              {product.flavor || 'Amul Official'}
            </Text>
          )}

          {/* Price & Quick Buy */}
          <View style={styles.bottomRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceText}>₹{product.defaultPrice}</Text>
            </View>

            {isInStock ? (
              <TouchableOpacity
                style={styles.buyButton}
                onPress={onQuickBuy || onPress}
                activeOpacity={0.8}
              >
                <ShoppingCart size={13} color="#FFFFFF" />
                <Text style={styles.buyButtonText}>Buy on Amul</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.autoTrackBadge}>
                <Text style={styles.autoTrackText}>Auto-Notifies</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 5,
  },
  stockPillIn: {
    backgroundColor: '#ECFDF5',
  },
  stockPillOut: {
    backgroundColor: '#FEF2F2',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
    borderWidth: 1,
  },
  trackButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  trackButtonInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  trackButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trackTextActive: {
    color: '#1D4ED8',
  },
  trackTextInactive: {
    color: '#94A3B8',
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    width: 95,
    height: 95,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  macroTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  macroTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  categorySubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  autoTrackBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  autoTrackText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
