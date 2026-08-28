import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, ChevronRight, Zap } from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { AmulProduct } from '../types/amul';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: AmulProduct;
  onQuickBuy?: (product: AmulProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickBuy }) => {
  const router = useRouter();
  const primaryVariant = product.variants[0];
  const isInStock = product.variants.some((v) => v.isInStock);
  const totalStock = product.variants.reduce((acc, v) => acc + (v.stockCount || 0), 0);

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        {/* Left Info Section */}
        <View style={styles.infoSection}>
          {/* Header Row with Stock Badge */}
          <View style={styles.titleRow}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {product.title}
            </Text>
            <StockBadge
              isInStock={isInStock}
              stockCount={totalStock}
              size="sm"
            />
          </View>

          {/* Subtext & Protein Tag */}
          <View style={styles.metaRow}>
            <Text style={styles.variantSubtext}>
              {primaryVariant?.name || product.flavor || 'High Protein Dairy'}
            </Text>
            <View style={styles.proteinTag}>
              <Text style={styles.proteinTagText}>
                {product.nutrition.proteinGrams}g Protein
              </Text>
            </View>
          </View>

          {/* Price & Auto-Cart Indicator */}
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{primaryVariant?.price || product.defaultPrice}</Text>
            {product.autoCartEnabled && (
              <View style={styles.autoCartChip}>
                <Zap size={10} color={Theme.colors.primary} />
                <Text style={styles.autoCartChipText}>Auto-Cart Active</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Card Actions Footer */}
      <View style={styles.actionFooter}>
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => router.push(`/product/${product.id}` as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsBtnText}>View Details</Text>
          <ChevronRight size={16} color={Theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buyBtn, !isInStock && styles.buyBtnDisabled]}
          onPress={() => onQuickBuy && onQuickBuy(product)}
          disabled={!isInStock}
          activeOpacity={0.8}
        >
          <Text style={styles.buyBtnText}>{isInStock ? '⚡ 1-Tap Pay' : 'Auto-Reserve'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    padding: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  cardBody: {
    flexDirection: 'row',
  },
  infoSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  productTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  variantSubtext: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
  },
  proteinTag: {
    backgroundColor: Theme.colors.proteinGoldBg,
    borderColor: Theme.colors.proteinGoldBorder,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
  },
  proteinTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.proteinGoldText,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  autoCartChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
    gap: 3,
    borderWidth: 1,
    borderColor: Theme.colors.primaryFixed,
  },
  autoCartChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outlineVariant,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    backgroundColor: Theme.colors.surfaceContainerLow,
    gap: 4,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  buyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.primaryContainer,
  },
  buyBtnDisabled: {
    backgroundColor: Theme.colors.secondary,
    opacity: 0.7,
  },
  buyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
