import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  Clock,
  Zap,
  Calendar,
  ShieldAlert,
  BarChart2,
  Hourglass,
} from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { MOCK_RESTOCK_ANALYTICS } from '../../constants/products';
import { useStockStore } from '../../store/useStockStore';

export default function InsightsScreen() {
  const { selectedPincode } = useStockStore();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restock Insights</Text>
        <Text style={styles.headerSub}>
          AI Telemetry & Drop Predictor for {selectedPincode.label} ({selectedPincode.pincode})
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Drop Predictor Clock Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBadge}>
              <Clock size={20} color="#FFFFFF" />
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {MOCK_RESTOCK_ANALYTICS.confidencePercent}% Confidence
              </Text>
            </View>
          </View>

          <Text style={styles.heroLabel}>Most Probable Drop Window</Text>
          <Text style={styles.heroTime}>{MOCK_RESTOCK_ANALYTICS.mostLikelyWindow}</Text>

          <View style={styles.heroDaysRow}>
            <Calendar size={14} color="#C7D2FE" />
            <Text style={styles.heroDaysText}>
              Peak Days: {MOCK_RESTOCK_ANALYTICS.daysPattern.join(', ')}
            </Text>
          </View>

          <View style={styles.warehouseRow}>
            <Text style={styles.warehouseText}>
              Cluster: {MOCK_RESTOCK_ANALYTICS.warehouseCluster}
            </Text>
          </View>
        </View>

        {/* Stock Survival Velocity Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconBadge}>
              <Hourglass size={16} color={Theme.colors.statusWarningText} />
            </View>
            <Text style={styles.statValue}>2m 45s</Text>
            <Text style={styles.statLabel}>Avg Stock Survival</Text>
            <Text style={styles.statSub}>Batch of 500 units</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEE2E2' }]}>
              <Zap size={16} color={Theme.colors.statusDangerText} />
            </View>
            <Text style={styles.statValue}>94s</Text>
            <Text style={styles.statLabel}>Fastest Sell-Out</Text>
            <Text style={styles.statSub}>Rose Lassi Pack of 30</Text>
          </View>
        </View>

        {/* Weekly Restock Distribution Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <BarChart2 size={18} color={Theme.colors.primary} />
            <Text style={styles.chartTitle}>Historical Drop Frequency by Day</Text>
          </View>

          <View style={styles.barChartContainer}>
            {[
              { day: 'Mon', count: 12, heightPct: 40 },
              { day: 'Tue', count: 28, heightPct: 90, isPeak: true },
              { day: 'Wed', count: 15, heightPct: 50 },
              { day: 'Thu', count: 32, heightPct: 100, isPeak: true },
              { day: 'Fri', count: 18, heightPct: 60 },
              { day: 'Sat', count: 24, heightPct: 80 },
              { day: 'Sun', count: 8, heightPct: 25 },
            ].map((item) => (
              <View key={item.day} style={styles.barColumn}>
                <Text style={styles.barCount}>{item.count}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${item.heightPct}%` },
                      item.isPeak && styles.barFillPeak,
                    ]}
                  />
                </View>
                <Text style={[styles.barDayLabel, item.isPeak && styles.barDayLabelPeak]}>
                  {item.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pro Tip Recommendation */}
        <View style={styles.tipCard}>
          <ShieldAlert size={20} color={Theme.colors.primary} />
          <View style={styles.tipTextContent}>
            <Text style={styles.tipTitle}>Beat the Rush Strategy</Text>
            <Text style={styles.tipDesc}>
              Ensure Headless Auto-Cart is enabled for your favorite SKUs. Keep your UPI app unlocked during the 11:15 AM – 12:30 PM drop window.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
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
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.containerMargin,
    gap: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#4338CA',
    ...Theme.shadows.card,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#86EFAC',
  },
  heroLabel: {
    fontSize: 13,
    color: '#C7D2FE',
    marginBottom: 4,
  },
  heroTime: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  heroDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroDaysText: {
    fontSize: 13,
    color: '#C7D2FE',
    fontWeight: '600',
  },
  warehouseRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
    marginTop: 4,
  },
  warehouseText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  statIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Theme.colors.statusWarningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.onSurface,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.onSurface,
  },
  statSub: {
    fontSize: 11,
    color: Theme.colors.secondary,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barCount: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.secondary,
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.radius.full,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: Theme.colors.primaryFixedDim,
    borderRadius: Theme.radius.full,
  },
  barFillPeak: {
    backgroundColor: Theme.colors.primaryContainer,
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.secondary,
  },
  barDayLabelPeak: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.primaryFixed,
    gap: 12,
  },
  tipTextContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  tipDesc: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
});
