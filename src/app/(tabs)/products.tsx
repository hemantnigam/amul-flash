import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Zap } from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { useStockStore } from '../../store/useStockStore';
import { ProductCard } from '../../components/ProductCard';
import { FlashCheckoutModal } from '../../components/FlashCheckoutModal';
import { AmulProduct } from '../../types/amul';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'lassi', label: 'Lassi (15g/25g)' },
  { id: 'buttermilk', label: 'Buttermilk (15g)' },
  { id: 'whey', label: 'Whey Protein' },
  { id: 'paneer', label: 'High Protein Paneer' },
  { id: 'specialty', label: 'Specialty Dairy' },
];

export default function ProductsScreen() {
  const { products, selectedPincode } = useStockStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCheckoutProduct, setSelectedCheckoutProduct] = useState<AmulProduct | null>(null);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleQuickBuy = (product: AmulProduct) => {
    setSelectedCheckoutProduct(product);
    setIsCheckoutModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Product Directory</Text>
        <Text style={styles.headerSub}>
          Live Amul D2C Catalog for {selectedPincode.label} ({selectedPincode.pincode})
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={Theme.colors.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Whey, Lassi, Paneer..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsCountRow}>
          <Text style={styles.resultsCountText}>
            Showing {filteredProducts.length} items
          </Text>
        </View>

        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickBuy={handleQuickBuy}
          />
        ))}
      </ScrollView>

      {/* Flash Checkout Modal */}
      <FlashCheckoutModal
        visible={isCheckoutModalVisible}
        product={selectedCheckoutProduct}
        onClose={() => setIsCheckoutModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  header: {
    paddingHorizontal: Theme.spacing.containerMargin,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  headerSub: {
    fontSize: 13,
    color: Theme.colors.secondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: Theme.spacing.containerMargin,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  categoryWrapper: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
    paddingBottom: 10,
  },
  categoryScroll: {
    paddingHorizontal: Theme.spacing.containerMargin,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  categoryChipActive: {
    backgroundColor: Theme.colors.primaryContainer,
    borderColor: Theme.colors.primaryContainer,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.onSurfaceVariant,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  listContent: {
    padding: Theme.spacing.containerMargin,
    gap: 12,
    paddingBottom: 32,
  },
  resultsCountRow: {
    marginBottom: 4,
  },
  resultsCountText: {
    fontSize: 12,
    color: Theme.colors.secondary,
    fontWeight: '500',
  },
});
