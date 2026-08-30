import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Radio,
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react-native';
import { useStockStore } from '../../store/useStockStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ProductCard } from '../../components/ProductCard';

export default function TrackedScreen() {
  const router = useRouter();
  const { session, isInitialized } = useSessionStore();
  const { colors, isDark } = useAppTheme();
  const {
    trackedProductsMap,
    refreshStock,
    isLoadingProducts,
  } = useStockStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isInitialized || !session.isLoggedIn) {
    return null;
  }

  // Read all products that the user has tracked across all categories
  const trackedProducts = Object.values(trackedProductsMap);
  const inStockTracked = trackedProducts.filter((p) => p.variants.some((v) => v.isInStock));

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshStock();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.topRow}>
          <View>
            <View style={styles.titleRow}>
              <Radio size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Tracked Items</Text>
            </View>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Active Radar monitoring Amul stock drops
            </Text>
          </View>
        </View>

        {/* Live Radar Summary Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tracked:</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{trackedProducts.length}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <Zap size={13} color="#10B981" />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Stock:</Text>
            <Text style={[styles.statValue, { color: inStockTracked.length > 0 ? '#10B981' : colors.textSecondary }]}>
              {inStockTracked.length}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <ShieldCheck size={13} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Radar:</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>LIVE</Text>
          </View>
        </View>
      </View>

      {/* Main Tracked List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isLoadingProducts}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {trackedProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Radio size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Tracked Items Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Turn on the "Track" switch on any Amul protein or grocery product to receive instant &lt;500ms drop alerts and 1-tap checkout.
            </Text>

            <TouchableOpacity
              style={[styles.browseButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.browseButtonText}>Browse Products to Track</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsList}>
            {trackedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  productsList: {
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
