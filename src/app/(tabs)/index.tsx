import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Zap,
  RotateCw,
  History,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { useStockStore } from '../../store/useStockStore';
import { Header } from '../../components/Header';
import { ProductCard } from '../../components/ProductCard';
import { DropAlertBanner } from '../../components/DropAlertBanner';
import { FlashCheckoutModal } from '../../components/FlashCheckoutModal';
import { DropSimulatorModal } from '../../components/DropSimulatorModal';
import { AmulProduct } from '../../types/amul';

export default function HomeDashboard() {
  const router = useRouter();
  const {
    products,
    selectedPincode,
    activeDropAlert,
    dismissDropAlert,
    activityLogs,
    refreshStock,
    lastUpdated,
  } = useStockStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCheckoutProduct, setSelectedCheckoutProduct] = useState<AmulProduct | null>(null);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshStock();
    setRefreshing(false);
  };

  const handleQuickBuy = (product: AmulProduct) => {
    setSelectedCheckoutProduct(product);
    setIsCheckoutModalVisible(true);
  };

  const handleAlertPay = (alert: any) => {
    const prod = products.find((p) => p.id === alert.productId) || products[0];
    setSelectedCheckoutProduct(prod);
    setIsCheckoutModalVisible(true);
  };

  const inStockCount = products.filter((p) => p.variants.some((v) => v.isInStock)).length;
  const minutesAgo = Math.max(0, Math.floor((Date.now() - lastUpdated) / 60000));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header onOpenSimulator={() => setIsSimulatorVisible(true)} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Theme.colors.primary} />
        }
      >
        {/* Emergency Restock Banner if Active Drop */}
        {activeDropAlert && (
          <DropAlertBanner
            alert={activeDropAlert}
            onPayNow={handleAlertPay}
            onDismiss={dismissDropAlert}
          />
        )}

        {/* Live Monitoring Summary Card */}
        <View style={styles.monitoringCard}>
          <View style={styles.monitoringHeader}>
            <Text style={styles.monitoringTitle}>Live Monitoring</Text>
            <View style={styles.liveBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>

          <Text style={styles.monitoringSubtitle}>
            {inStockCount} of {products.length} tracked products available in {selectedPincode.label} ({selectedPincode.pincode})
          </Text>

          <View style={styles.monitoringFooter}>
            <View style={styles.updateTimeRow}>
              <RotateCw size={12} color={Theme.colors.secondary} />
              <Text style={styles.updateTimeText}>
                {minutesAgo === 0 ? 'Updated just now' : `Updated ${minutesAgo}m ago`}
              </Text>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
              <Text style={styles.refreshBtnText}>Check Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cross-Zone Radar Suggestion (if applicable) */}
        <TouchableOpacity
          style={styles.radarCard}
          onPress={() => router.push('/locations')}
          activeOpacity={0.7}
        >
          <View style={styles.radarIconContainer}>
            <MapPin size={20} color={Theme.colors.primary} />
          </View>
          <View style={styles.radarTextContainer}>
            <Text style={styles.radarTitle}>Radius Radar Active (4.8 km range)</Text>
            <Text style={styles.radarSubtitle}>
              Office & Gym pincodes also monitored for cross-zone stock
            </Text>
          </View>
          <ArrowRight size={18} color={Theme.colors.secondary} />
        </TouchableOpacity>

        {/* Tracked Products Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Tracked Products</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/products' as any)}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productList}>
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickBuy={handleQuickBuy}
            />
          ))}
        </View>

        {/* Recent Activity Snippet */}
        <View style={styles.activityCard}>
          <View style={styles.activityCardHeader}>
            <View style={styles.activityTitleRow}>
              <History size={18} color={Theme.colors.primary} />
              <Text style={styles.activityCardTitle}>Recent Activity & Auto-Cart Logs</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/activity' as any)}>
              <Text style={styles.seeAllText}>Timeline</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityLogsList}>
            {activityLogs.slice(0, 3).map((log) => (
              <View key={log.id} style={styles.activityItem}>
                {log.status === 'success' ? (
                  <CheckCircle2 size={16} color={Theme.colors.statusSuccessText} style={styles.logIcon} />
                ) : (
                  <AlertTriangle size={16} color={Theme.colors.statusWarningText} style={styles.logIcon} />
                )}
                <View style={styles.logContent}>
                  <Text style={styles.logTitle}>{log.title}</Text>
                  <Text style={styles.logDesc} numberOfLines={2}>
                    {log.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 1-Tap Flash Checkout Modal */}
      <FlashCheckoutModal
        visible={isCheckoutModalVisible}
        product={selectedCheckoutProduct}
        onClose={() => setIsCheckoutModalVisible(false)}
      />

      {/* Drop Simulator Modal */}
      <DropSimulatorModal
        visible={isSimulatorVisible}
        onClose={() => setIsSimulatorVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  monitoringCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    marginHorizontal: Theme.spacing.containerMargin,
    marginTop: Theme.spacing.lg,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  monitoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  monitoringTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusSuccessBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    gap: 5,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.statusSuccessText,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.statusSuccessText,
  },
  monitoringSubtitle: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  monitoringFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outlineVariant,
  },
  updateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updateTimeText: {
    fontSize: 12,
    color: Theme.colors.secondary,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  radarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    marginHorizontal: Theme.spacing.containerMargin,
    marginTop: Theme.spacing.md,
    borderRadius: Theme.radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.primaryFixed,
  },
  radarIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radarTextContainer: {
    flex: 1,
  },
  radarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  radarSubtitle: {
    fontSize: 11,
    color: Theme.colors.secondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Theme.spacing.containerMargin,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  productList: {
    paddingHorizontal: Theme.spacing.containerMargin,
    gap: 12,
  },
  activityCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    marginHorizontal: Theme.spacing.containerMargin,
    marginTop: Theme.spacing.xl,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  activityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  activityLogsList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
  },
  logIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.onSurface,
  },
  logDesc: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
});
