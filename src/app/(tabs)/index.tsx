import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  Flame,
  Zap,
  Bell,
  Check,
  ChevronRight,
  Package,
} from 'lucide-react-native';
import { useStockStore } from '../../store/useStockStore';
import { ProductCard } from '../../components/ProductCard';
import { DropAlertBanner } from '../../components/DropAlertBanner';
import { PincodeSelectorModal } from '../../components/PincodeSelectorModal';
import { FlashCheckoutModal } from '../../components/FlashCheckoutModal';
import { AmulProduct } from '../../types/amul';

export default function HomeScreen() {
  const router = useRouter();
  const {
    products,
    categories,
    selectedCategory,
    selectedPincode,
    activeDropAlert,
    isLoadingProducts,
    setSelectedCategory,
    triggerSimulatedDrop,
    dismissDropAlert,
    toggleAutoCartForProduct,
    refreshStock,
    loadInitialData,
  } = useStockStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isPincodeModalVisible, setIsPincodeModalVisible] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<AmulProduct | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    loadInitialData();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshStock();
    setIsRefreshing(false);
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const heroProduct = filteredProducts[0] || products[0];
  const gridProducts = filteredProducts.slice(1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.brandTitleCol}>
            <Text style={styles.brandTitle}>Amul Flash</Text>
            <Text style={styles.brandSubtitle}>Protein & D2C Tracker</Text>
          </View>

          {/* Location Pill */}
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => setIsPincodeModalVisible(true)}
            activeOpacity={0.8}
          >
            <MapPin size={13} color="#2563EB" />
            <Text style={styles.locationText}>{selectedPincode.pincode} • {selectedPincode.label}</Text>
            <View style={styles.greenLiveDot} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search protein, lassi, whey, organic..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Emergency Drop Alert Banner */}
        {activeDropAlert && (
          <DropAlertBanner
            alert={activeDropAlert}
            onPayNow={(alertEvent) => {
              const target = products.find((p) => p.id === alertEvent.productId) || products[0];
              if (target) setSelectedProductForCheckout(target);
            }}
            onDismiss={dismissDropAlert}
          />
        )}

        {/* Horizontal Category Pill Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat.slug)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoadingProducts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Fetching live catalog from Amul...</Text>
          </View>
        ) : filteredProducts.length > 0 ? (
          <View style={styles.mainContent}>
            {/* Hero Featured Product Card */}
            {heroProduct && (
              <TouchableOpacity
                style={styles.heroCard}
                onPress={() => router.push(`/product/${heroProduct.id}`)}
                activeOpacity={0.9}
              >
                <View style={styles.heroImageWrapper}>
                  <Image source={{ uri: heroProduct.imageUrl }} style={styles.heroImage} resizeMode="contain" />
                  <View style={styles.heroStockBadge}>
                    <View
                      style={[
                        styles.heroPulseDot,
                        { backgroundColor: heroProduct.variants[0]?.isInStock ? '#10B981' : '#EF4444' },
                      ]}
                    />
                    <Text style={styles.heroStockText}>
                      {heroProduct.variants[0]?.isInStock
                        ? `LIVE IN STOCK (${heroProduct.variants[0]?.stockCount || 50} units)`
                        : 'OUT OF STOCK'}
                    </Text>
                  </View>
                </View>

                <View style={styles.heroInfo}>
                  <View style={styles.heroTitleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroTitle} numberOfLines={1}>
                        {heroProduct.title}
                      </Text>
                      {heroProduct.nutrition?.proteinGrams ? (
                        <View style={styles.macroRow}>
                          <View style={styles.heroMacroBadge}>
                            <Text style={styles.heroMacroText}>
                              ⚡ {heroProduct.nutrition.proteinGrams}g Protein
                            </Text>
                          </View>
                          <Text style={styles.heroCalText}>• {heroProduct.nutrition.calories} kcal</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Track Toggle */}
                    <TouchableOpacity
                      style={[
                        styles.heroTrackBtn,
                        heroProduct.autoCartEnabled && styles.heroTrackBtnActive,
                      ]}
                      onPress={() => toggleAutoCartForProduct(heroProduct.id)}
                    >
                      <Bell size={13} color={heroProduct.autoCartEnabled ? '#1D4ED8' : '#64748B'} />
                      <Text
                        style={[
                          styles.heroTrackBtnText,
                          heroProduct.autoCartEnabled && styles.heroTrackBtnTextActive,
                        ]}
                      >
                        {heroProduct.autoCartEnabled ? 'Tracking' : 'Track'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.heroBottomRow}>
                    <View style={styles.heroPriceCol}>
                      <Text style={styles.heroPrice}>₹{heroProduct.defaultPrice}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.heroBuyButton}
                      onPress={() => setSelectedProductForCheckout(heroProduct)}
                      activeOpacity={0.8}
                    >
                      <Zap size={14} color="#FFFFFF" />
                      <Text style={styles.heroBuyText}>+ BUY NOW</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Section Heading */}
            {gridProducts.length > 0 && (
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>More in {selectedCategory.toUpperCase()}</Text>
                <Text style={styles.sectionCountText}>{gridProducts.length} items</Text>
              </View>
            )}

            {/* Products List with Track Toggles */}
            <View style={styles.productsList}>
              {gridProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => router.push(`/product/${product.id}`)}
                  onQuickBuy={() => setSelectedProductForCheckout(product)}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Package size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Try another category or switch your delivery pincode.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <PincodeSelectorModal
        visible={isPincodeModalVisible}
        onClose={() => setIsPincodeModalVisible(false)}
      />

      <FlashCheckoutModal
        visible={!!selectedProductForCheckout}
        product={selectedProductForCheckout}
        onClose={() => setSelectedProductForCheckout(null)}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandTitleCol: {},
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0037B0',
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: -2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F2FE',
    borderWidth: 1,
    borderColor: '#E2E1ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1B23',
  },
  greenLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  clearText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  categoryChipSelected: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mainContent: {
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  heroImageWrapper: {
    height: 180,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroStockBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  heroPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroStockText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroInfo: {
    padding: 16,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  heroMacroBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  heroMacroText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  heroCalText: {
    fontSize: 11,
    color: '#64748B',
  },
  heroTrackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  heroTrackBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  heroTrackBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  heroTrackBtnTextActive: {
    color: '#1D4ED8',
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  heroPriceCol: {},
  heroPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  heroBuyButton: {
    backgroundColor: '#0037B0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
  },
  heroBuyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  sectionCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  productsList: {
    gap: 2,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
});
