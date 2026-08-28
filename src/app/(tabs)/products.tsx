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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Filter, Sparkles, Check } from 'lucide-react-native';
import { useStockStore } from '../../store/useStockStore';
import { ProductCard } from '../../components/ProductCard';
import { FlashCheckoutModal } from '../../components/FlashCheckoutModal';
import { AmulProduct } from '../../types/amul';

export default function ProductsScreen() {
  const router = useRouter();
  const {
    products,
    categories,
    selectedCategory,
    isLoadingProducts,
    setSelectedCategory,
    refreshStock,
  } = useStockStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<AmulProduct | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshStock();
    setIsRefreshing(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = !onlyInStock || p.variants.some((v) => v.isInStock);
    return matchesSearch && matchesStock;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Products</Text>
        <Text style={styles.headerSubtitle}>
          Real-time catalog directly from shop.amul.com
        </Text>

        {/* Search & Stock Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search all Amul products..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={[styles.stockFilterButton, onlyInStock && styles.stockFilterButtonActive]}
            onPress={() => setOnlyInStock(!onlyInStock)}
            activeOpacity={0.8}
          >
            {onlyInStock ? <Check size={14} color="#FFFFFF" /> : null}
            <Text style={[styles.stockFilterText, onlyInStock && styles.stockFilterTextActive]}>
              In Stock
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills Slider */}
      <View style={styles.categoryContainer}>
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

      {/* Product List */}
      <ScrollView
        contentContainerStyle={styles.productsScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {isLoadingProducts ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading {selectedCategory} products...</Text>
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
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No items in this category</Text>
            <Text style={styles.emptySubtitle}>
              Try unchecking the "In Stock" filter or selecting another category.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Flash Checkout Modal */}
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
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
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
  stockFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 4,
  },
  stockFilterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stockFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  stockFilterTextActive: {
    color: '#FFFFFF',
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  categoryChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
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
  productsScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  productsGrid: {
    gap: 12,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyBox: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
