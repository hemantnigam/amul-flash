import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from './AppText';
import { Image } from 'expo-image';
import { Bell, ChevronRight, Package } from 'lucide-react-native';
import { AmulProduct } from '../types/amul';
import { useStockStore } from '../store/useStockStore';
import { useAppTheme } from '../hooks/useAppTheme';

interface ProductCardProps {
  product: AmulProduct;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
}) => {
  const { toggleAutoCartForProduct } = useStockStore();
  const { colors, isDark } = useAppTheme();
  const primaryVariant = product.variants[0];
  const isInStock = primaryVariant?.isInStock;
  const stockCount = primaryVariant?.stockCount || 0;
  const isTracked = product.autoCartEnabled ?? false;
  const [imageUri, setImageUri] = React.useState(product.imageUrl || '');
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageUri(product.imageUrl || '');
    setImageError(false);
  }, [product.imageUrl, product.title]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Top Bar: Stock Status & Track Toggle */}
      <View style={styles.topHeader}>
        <View
          style={[
            styles.stockPill,
            {
              backgroundColor: isInStock
                ? isDark
                  ? '#052E16'
                  : '#ECFDF5'
                : isDark
                ? '#450A0A'
                : '#FEF2F2',
              borderColor: isInStock
                ? isDark
                  ? '#166534'
                  : '#A7F3D0'
                : isDark
                ? '#991B1B'
                : '#FECACA',
            },
          ]}
        >
          <View
            style={[
              styles.pulseDot,
              { backgroundColor: isInStock ? '#22C55E' : '#EF4444' },
            ]}
          />
          <Text
            style={[
              styles.stockPillText,
              {
                color: isInStock
                  ? isDark
                    ? '#4ADE80'
                    : '#047857'
                  : isDark
                  ? '#F87171'
                  : '#B91C1C',
              },
            ]}
          >
            {isInStock ? `IN STOCK (${stockCount})` : 'OUT OF STOCK'}
          </Text>
        </View>

        {/* Minimal Track Switch - ONLY FOR OUT OF STOCK ITEMS */}
        {!isInStock && (
          <TouchableOpacity
            style={[
              styles.trackButton,
              {
                backgroundColor: isTracked
                  ? isDark
                    ? '#1E1E1E'
                    : '#EFF6FF'
                  : isDark
                  ? '#171717'
                  : '#F8FAFC',
                borderColor: isTracked ? colors.primary : colors.border,
              },
            ]}
            onPress={() => toggleAutoCartForProduct(product.id)}
            activeOpacity={0.7}
          >
            <Bell size={12} color={isTracked ? colors.primary : colors.textMuted} />
            <Text
              style={[
                styles.trackButtonText,
                { color: isTracked ? colors.primary : colors.textMuted },
              ]}
            >
              {isTracked ? 'Tracking' : 'Track'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentRow}>
        {/* Product Image */}
        <View style={[styles.imageWrapper, { backgroundColor: isDark ? '#171717' : '#FFFFFF' }]}>
          {!imageUri || imageError ? (
            <View style={styles.imageFallbackContainer}>
              <Package size={28} color={colors.primary} />
              <Text style={[styles.imageFallbackText, { color: colors.textSecondary }]} numberOfLines={1}>
                Amul
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.productImage}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => {
                setImageError(true);
              }}
            />
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoCol}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {product.title}
          </Text>

          <Text style={[styles.categorySubtext, { color: colors.textSecondary }]}>
            {product.flavor || 'Amul Official'}
          </Text>

          {/* Price & Quick Buy */}
          <View style={styles.bottomRow}>
            <View style={styles.priceCol}>
              <Text style={[styles.priceText, { color: colors.primary }]}>₹{product.defaultPrice}</Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>View Details</Text>
              <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
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
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
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
  imageFallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  imageFallbackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#0F172A',
    lineHeight: 18,
  },

  categorySubtext: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_500Medium',
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
    gap: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#0F172A',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#004AC6',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
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
