import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Zap, ShoppingBag, Check, Plus } from 'lucide-react-native';
import { AmulProduct } from '../types/amul';
import { StockBadge } from './StockBadge';

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
  const primaryVariant = product.variants[0];
  const isInStock = primaryVariant?.isInStock;
  const stockCount = primaryVariant?.stockCount || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.contentRow}>
        {/* Product Image Container */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            resizeMode="contain"
          />
          {product.nutrition?.proteinGrams ? (
            <View style={styles.macroBadge}>
              <Text style={styles.macroText}>
                {product.nutrition.proteinGrams}g Protein
              </Text>
            </View>
          ) : null}
        </View>

        {/* Product Info */}
        <View style={styles.infoCol}>
          {/* Top Status Pill */}
          <View style={styles.statusRow}>
            <StockBadge
              isInStock={isInStock}
              stockCount={stockCount}
              size="sm"
            />
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>

          {/* SKU / Flavor */}
          <Text style={styles.flavorText} numberOfLines={1}>
            {product.flavor && product.flavor !== 'Natural' ? product.flavor : 'Amul Official D2C'}
          </Text>

          {/* Price & Quick Buy Row */}
          <View style={styles.bottomRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceSymbol}>₹</Text>
              <Text style={styles.priceAmount}>{product.defaultPrice}</Text>
            </View>

            {isInStock ? (
              <TouchableOpacity
                style={styles.quickBuyButton}
                onPress={onQuickBuy || onPress}
                activeOpacity={0.8}
              >
                <Zap size={13} color="#FFFFFF" />
                <Text style={styles.quickBuyText}>Quick Buy</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.outOfStockButton}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.outOfStockText}>Auto-Cart</Text>
              </TouchableOpacity>
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
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 14,
  },
  imageWrapper: {
    width: 105,
    height: 115,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: 90,
    height: 90,
  },
  macroBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.92)',
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
  },
  macroText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  flavorText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  quickBuyButton: {
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
    shadowRadius: 6,
    elevation: 2,
  },
  quickBuyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  outOfStockButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  outOfStockText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
});
