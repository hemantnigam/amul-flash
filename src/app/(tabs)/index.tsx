import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { AppTextInput as TextInput } from '../../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  Bell,
  Package,
} from 'lucide-react-native';
import { useStockStore } from '../../store/useStockStore';
import { useSessionStore } from '../../store/useSessionStore';
import { ProductCard } from '../../components/ProductCard';
import { DropAlertBanner } from '../../components/DropAlertBanner';
import { PincodeSelectorModal } from '../../components/PincodeSelectorModal';
import { AmulProduct } from '../../types/amul';
import { analyticsService } from '../../services/analyticsService';

export default function HomeScreen() {
  const router = useRouter();
  const { session, isInitialized, addresses } = useSessionStore();
  const {
    products,
    allProductsMap,
    categories,
    selectedCategory,
    selectedPincode,
    activeDropAlert,
    isLoadingProducts,
    setSelectedCategory,
    triggerSimulatedDrop,
    dismissDropAlert,
    refreshStock,
    loadInitialData,
    syncPincodesFromAddresses,
  } = useStockStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isPincodeModalVisible, setIsPincodeModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    analyticsService.logScreenView('HomeScreen');
    if (session.isLoggedIn) {
      loadInitialData(session.sessionCookie);
    }
  }, [session.isLoggedIn, session.sessionCookie, loadInitialData]);

  React.useEffect(() => {
    if (addresses && addresses.length > 0) {
      syncPincodesFromAddresses(addresses);
    }
  }, [addresses, syncPincodesFromAddresses]);

  // Ultra-fast in-memory memoized search (0ms latency, zero network calls on typing)
  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;

    const allProductsList = Object.values(allProductsMap || {});
    const source = allProductsList.length > 0 ? allProductsList : products;

    const matches: AmulProduct[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < source.length; i++) {
      const p = source[i];
      if (seen.has(p.id)) continue;

      if (
        p.title.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
      ) {
        seen.add(p.id);
        matches.push(p);
      }
    }
    return matches;
  }, [searchQuery, products, allProductsMap]);

  // Synchronously compute visual active category pill without network delay
  const activeHighlightCategory = React.useMemo(() => {
    if (searchQuery.trim().length > 0 && filteredProducts.length > 0) {
      return filteredProducts[0].category || selectedCategory;
    }
    return selectedCategory;
  }, [searchQuery, filteredProducts, selectedCategory]);

  if (!isInitialized || !session.isLoggedIn) {
    return null;
  }

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshStock(session.sessionCookie);
    setIsRefreshing(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim() && selectedCategory !== 'protein') {
      setSelectedCategory('protein', session.sessionCookie);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (selectedCategory !== 'protein') {
      setSelectedCategory('protein', session.sessionCookie);
    }
  };

  const handleTestNotification = async () => {
    await triggerSimulatedDrop();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.brandTitleCol}>
            <Text style={styles.brandTitle}>Amul Flash</Text>
            <Text style={styles.brandSubtitle}>Stock Tracker</Text>
          </View>

          {/* Location Pill */}
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => setIsPincodeModalVisible(true)}
            activeOpacity={0.8}
          >
            <MapPin size={13} color="#2563EB" />
            <Text style={styles.locationText}>
              {selectedPincode?.pincode || 'Select Delivery Hub'}
            </Text>
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
            onChangeText={handleSearchChange}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Temporary Notification Test Button */}
        <TouchableOpacity
          style={styles.testNotificationBtn}
          onPress={handleTestNotification}
          activeOpacity={0.8}
        >
          <Bell size={14} color="#FFFFFF" />
          <Text style={styles.testNotificationText}>⚡ Tap to Test Live Restock Notification</Text>
        </TouchableOpacity>
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
              if (target) router.push(`/product/${target.id}`);
            }}
            onDismiss={dismissDropAlert}
          />
        )}

        {/* Horizontal Category Pill Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = activeHighlightCategory === cat.slug;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory(cat.slug, session.sessionCookie);
                }}
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>
                {searchQuery ? `SEARCH RESULTS ("${searchQuery}")` : `${selectedCategory.toUpperCase()} PRODUCTS`}
              </Text>
              <Text style={styles.sectionCountText}>{filteredProducts.length} items</Text>
            </View>

            {/* Products List with Track Toggles */}
            <View style={styles.productsList}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => router.push(`/product/${product.id}`)}
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
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    color: '#0037B0',
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
    fontFamily: 'PlusJakartaSans_700Bold',
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
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  clearText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#475569',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
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
  heroActionButton: {
    backgroundColor: '#0037B0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
  },
  heroActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  heroAutoTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  heroAutoTrackText: {
    color: '#B45309',
    fontSize: 11,
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
  testNotificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  testNotificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
