import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Bell,
  MapPin,
  CheckCircle2,
  Package,
  ExternalLink,
  Globe,
  Sparkles,
  Leaf,
  Info,
  Scale,
  BookOpen,
} from 'lucide-react-native';
import { useStockStore } from '../../store/useStockStore';
import { StockBadge } from '../../components/StockBadge';
import { analyticsService } from '../../services/analyticsService';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { products, toggleAutoCartForProduct, selectedPincode } = useStockStore();

  const product = products.find((p) => p.id === id) || products[0];
  const primaryVariant = product?.variants?.[0];

  const [imageUri, setImageUri] = useState(product?.imageUrl || '');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (product) {
      analyticsService.logScreenView('ProductDetails', product.title);
      setImageUri(product.imageUrl || '');
      setImageError(false);
    }
  }, [product?.imageUrl, product?.title, product]);

  if (!product) return null;

  const isInStock = primaryVariant?.isInStock;
  const isTracked = product.autoCartEnabled ?? false;

  const handleOpenWebview = async () => {
    let targetUrl = product.webUrl || '';

    if (!targetUrl) {
      if (product.alias) {
        targetUrl = `https://shop.amul.com/en/product/${product.alias}`;
      } else {
        targetUrl = `https://shop.amul.com/en/browse/${product.category || 'protein'}`;
      }
    }

    console.log('--------------------------------------------------');
    console.log('🌐 [View on Amul Website CLICKED]');
    console.log('🌐 Product ID:', product.id);
    console.log('🌐 Product Title:', product.title);
    console.log('🌐 Product Alias:', product.alias);
    console.log('🌐 Opening Target URL:', targetUrl);
    console.log('--------------------------------------------------');

    try {
      await WebBrowser.openBrowserAsync(targetUrl);
    } catch (e) {
      console.log('❌ WebBrowser Error:', e);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <View style={styles.imageCard}>
          {!imageUri || imageError ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 220, backgroundColor: '#F8FAFC', borderRadius: 16, width: '100%' }}>
              <Package size={56} color="#0284C7" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0284C7', marginTop: 8 }}>Amul Packshot</Text>
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
          <View style={styles.stockBadgeFloat}>
            <StockBadge isInStock={isInStock} stockCount={primaryVariant?.stockCount || 0} size="md" />
          </View>
        </View>

        {/* Title & Info */}
        <View style={styles.infoCard}>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.categorySubtext}>
            {product.category?.toUpperCase()} • {product.flavor || 'Amul Official'}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceSymbol}>₹</Text>
            <Text style={styles.priceValue}>{product.defaultPrice}</Text>
            <View style={styles.pincodeBadge}>
              <MapPin size={12} color="#2563EB" />
              <Text style={styles.pincodeText}>{selectedPincode.label || selectedPincode.pincode}</Text>
            </View>
            {Boolean(product.metafields?.weight || product.metafields?.uom) && (
              <View style={styles.metaBadge}>
                <Scale size={12} color="#047857" />
                <Text style={styles.metaBadgeText}>
                  {product.metafields?.weight ? `${product.metafields.weight}` : ''}
                  {product.metafields?.weight && product.metafields?.uom ? ` ${product.metafields.uom}` : product.metafields?.uom || ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Webview Open Button */}
        <TouchableOpacity
          style={styles.webLinkCard}
          onPress={handleOpenWebview}
          activeOpacity={0.8}
        >
          <View style={styles.webLinkLeft}>
            <View style={styles.webLinkIconBox}>
              <Globe size={18} color="#0037B0" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.webLinkTitle}>View on Amul Website</Text>
              <Text style={styles.webLinkSub}>Tap to open product page on shop.amul.com</Text>
            </View>
          </View>
          <ExternalLink size={16} color="#0037B0" />
        </TouchableOpacity>

        {/* Track Switch Card - Restock tracking active for Out of Stock items */}
        {!isInStock ? (
          <View style={styles.trackCard}>
            <View style={styles.trackLeft}>
              <View style={[styles.trackIconBox, isTracked ? styles.trackIconActive : styles.trackIconInactive]}>
                <Bell size={20} color={isTracked ? '#1D4ED8' : '#64748B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trackTitle}>Track Restock Radar</Text>
                <Text style={styles.trackSub}>
                  {isTracked
                    ? 'Active: Real-time notification alerts enabled for stock drops'
                    : 'Toggle on to get notified instantly when this item restocks'}
                </Text>
              </View>
            </View>
            <Switch
              value={isTracked}
              onValueChange={() => {
                const nextState = !isTracked;
                toggleAutoCartForProduct(product.id, product);
                analyticsService.logTrackStock(product.id, product.title, nextState);
              }}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={isTracked ? '#2563EB' : '#94A3B8'}
            />
          </View>
        ) : (
          <View style={[styles.trackCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <View style={styles.trackLeft}>
              <View style={[styles.trackIconBox, { backgroundColor: '#DCFCE7' }]}>
                <CheckCircle2 size={20} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trackTitle, { color: '#15803D' }]}>Item Currently In Stock</Text>
                <Text style={[styles.trackSub, { color: '#166534' }]}>
                  This product is available right now. Restock radar tracking is for out-of-stock items.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Product Description */}
        {product.description ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Info size={15} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>Product Description</Text>
            </View>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        ) : null}

        {/* Key Benefits */}
        {product.metafields?.benefits ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Sparkles size={15} color="#D97706" />
              </View>
              <Text style={styles.cardTitle}>Key Benefits</Text>
            </View>
            <Text style={styles.descriptionText}>{product.metafields.benefits}</Text>
          </View>
        ) : null}

        {/* Ingredients */}
        {product.metafields?.ingredients ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Leaf size={15} color="#16A34A" />
              </View>
              <Text style={styles.cardTitle}>Ingredients</Text>
            </View>
            <Text style={styles.descriptionText}>{product.metafields.ingredients}</Text>
          </View>
        ) : null}

        {/* How to Use */}
        {product.metafields?.how_to_useit ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: '#F3E8FF' }]}>
                <BookOpen size={15} color="#7C3AED" />
              </View>
              <Text style={styles.cardTitle}>How to Use</Text>
            </View>
            <Text style={styles.descriptionText}>{product.metafields.how_to_useit}</Text>
          </View>
        ) : null}
      </ScrollView>
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
  webLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#DBE1FF',
    marginBottom: 12,
  },
  webLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  webLinkIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webLinkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0037B0',
  },
  webLinkSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#0F172A',
    lineHeight: 24,
  },
  categorySubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#0037B0',
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
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
    fontFamily: 'PlusJakartaSans_700Bold',
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
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#0F172A',
  },
  trackSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_500Medium',
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
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginLeft: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#047857',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#0F172A',
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans_500Medium',
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
