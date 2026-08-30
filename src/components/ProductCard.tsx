import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from './AppText';
import { Image } from 'expo-image';
import { Bell, ChevronRight, Package } from 'lucide-react-native';
import { AmulProduct } from '../types/amul';
import { useStockStore } from '../store/useStockStore';

interface ProductCardProps {
  product: AmulProduct;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
}) => {
  const { toggleAutoCartForProduct } = useStockStore();
  const primaryVariant = product.variants[0];
  const isInStock = primaryVariant?.isInStock;
  const stockCount = primaryVariant?.stockCount || 0;
  const isTracked = product.autoCartEnabled ?? true;
  const [imageUri, setImageUri] = React.useState(product.imageUrl || '');
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageUri(product.imageUrl || '');
    setImageError(false);
  }, [product.imageUrl, product.title]);

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
          {!imageUri || imageError ? (
            <View style={styles.imageFallbackContainer}>
              <Package size={28} color="#0284C7" />
              <Text style={styles.imageFallbackText} numberOfLines={1}>Amul</Text>
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
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>

          <Text style={styles.categorySubtext}>
            {product.flavor || 'Amul Official'}
          </Text>

          {/* Price & Quick Buy */}
          <View style={styles.bottomRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceText}>₹{product.defaultPrice}</Text>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>View Details</Text>
              <ChevronRight size={13} color="#FFFFFF" />
            </TouchableOpacity>
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
