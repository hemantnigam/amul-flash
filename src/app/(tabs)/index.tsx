import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  Flame,
  Sparkles,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  Package,
} from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { useStockStore } from '../../store/useStockStore';
import { useSessionStore } from '../../store/useSessionStore';
import { ProductCard } from '../../components/ProductCard';
import { DropAlertBanner } from '../../components/DropAlertBanner';
import { PincodeSelectorModal } from '../../components/PincodeSelectorModal';
import { FlashCheckoutModal } from '../../components/FlashCheckoutModal';
import { DropSimulatorModal } from '../../components/DropSimulatorModal';
import { AmulProduct } from '../../types/amul';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useSessionStore();
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
    refreshStock,
  } = useStockStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isPincodeModalVisible, setIsPincodeModalVisible] = useState(false);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<AmulProduct | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const inStockCount = products.filter((p) => p.variants.some((v) => v.isInStock)).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.brandTitleAmul}>Amul</Text>
            <View style={styles.flashBadge}>
              <Zap size={12} color="#FFFFFF" />
              <Text style={styles.flashText}>FLASH</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.simDropButton}
              onPress={() => setIsSimulatorVisible(true)}
              activeOpacity={0.8}
            >
              <Flame size={14} color="#EA580C" />
              <Text style={styles.simDropText}>Sim Drop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationPill}
              onPress={() => setIsPincodeModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.radarLiveDot} />
              <MapPin size={13} color="#2563EB" />
              <Text style={styles.locationText}>{selectedPincode.pincode}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search protein, lassi, whey, organic..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Active Emergency Flash Drop Banner */}
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

        {/* Live All-Categories Horizontal Chips */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Browse Amul D2C Catalog</Text>
            <Text style={styles.categoryCountBadge}>{categories.length} Categories</Text>
          </View>

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
        </View>

        {/* Live Status Bar */}
        <View style={styles.inventoryStatusCard}>
          <View style={styles.statusLeft}>
            <View style={styles.pulseGreenCircle} />
            <Text style={styles.statusSummaryText}>
              <Text style={styles.statusBold}>{inStockCount} of {products.length} items</Text> available in {selectedPincode.label} ({selectedPincode.pincode})
            </Text>
          </View>
          <TouchableOpacity
            style={styles.radiusLink}
            onPress={() => router.push('/locations')}
            activeOpacity={0.7}
          >
            <Text style={styles.radiusLinkText}>Radius Radar</Text>
            <ChevronRight size={14} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Products Stream */}
        {isLoadingProducts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Fetching live inventory from Amul...</Text>
          </View>
        ) : filteredProducts.length > 0 ? (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
                onQuickBuy={() => setSelectedProductForCheckout(product)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Package size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Try selecting another category or switching your delivery pincode.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Refresh Stock</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <PincodeSelectorModal
        visible={isPincodeModalVisible}
        onClose={() => setIsPincodeModalVisible(false)}
      />

      <DropSimulatorModal
        visible={isSimulatorVisible}
        onClose={() => setIsSimulatorVisible(false)}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitleAmul: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1D4ED8',
    letterSpacing: -0.5,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  flashText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simDropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  simDropText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  radarLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  clearSearchText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  categorySection: {
    marginTop: 14,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  categoryCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inventoryStatusCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pulseGreenCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusSummaryText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  radiusLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  radiusLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  productsGrid: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 6,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
