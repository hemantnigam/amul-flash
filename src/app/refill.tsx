import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Boxes,
  Minus,
  Plus,
  AlertCircle,
  Calendar,
  Sparkles,
  Zap,
  ShoppingBag,
} from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { useRefillStore } from '../store/useRefillStore';
import { useStockStore } from '../store/useStockStore';

export default function RefillScreen() {
  const { items, updateDailyIntake, decrementStock, restockItem } = useRefillStore();
  const { triggerSimulatedDrop } = useStockStore();

  const handleDrinkOne = (id: string, name: string) => {
    decrementStock(id, 1);
    Alert.alert('Intake Logged', `Enjoyed 1 pack of ${name}! Supply count updated.`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconBadge}>
          <Boxes size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Protein Refill & Expiry Tracker</Text>
        <Text style={styles.heroDesc}>
          Track your home inventory consumption pace. The app escalates drop alert priority 7 days before you run out of stock.
        </Text>
      </View>

      {/* Refill Cards List */}
      <Text style={styles.sectionTitle}>Home Inventory & Daily Pace</Text>

      {items.map((item) => {
        const daysRemaining = Math.floor(item.currentUnits / item.dailyIntake);
        const isLow = daysRemaining <= item.warningDaysThreshold;

        return (
          <View key={item.id} style={styles.card}>
            {/* Card Top */}
            <View style={styles.cardHeader}>
              <View style={styles.headerInfo}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.batchSub}>
                  Batch: {item.batchNumber} • Expiry: {item.expiryDate}
                </Text>
              </View>

              <View
                style={[
                  styles.daysBadge,
                  isLow ? styles.daysBadgeLow : styles.daysBadgeNormal,
                ]}
              >
                <Text
                  style={[
                    styles.daysBadgeText,
                    isLow ? styles.daysBadgeTextLow : styles.daysBadgeTextNormal,
                  ]}
                >
                  {daysRemaining} Days Left
                </Text>
              </View>
            </View>

            {/* Inventory Status Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(100, (item.currentUnits / 30) * 100)}%`,
                      backgroundColor: isLow
                        ? Theme.colors.statusDangerText
                        : Theme.colors.statusSuccessText,
                    },
                  ]}
                />
              </View>
              <Text style={styles.unitsText}>{item.currentUnits} packs in pantry</Text>
            </View>

            {/* Daily Pace Stepper */}
            <View style={styles.paceRow}>
              <Text style={styles.paceLabel}>Daily Intake Pace:</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => updateDailyIntake(item.id, item.dailyIntake - 1)}
                >
                  <Minus size={14} color={Theme.colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.paceValue}>{item.dailyIntake} / day</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => updateDailyIntake(item.id, item.dailyIntake + 1)}
                >
                  <Plus size={14} color={Theme.colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions Row */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.drinkBtn}
                onPress={() => handleDrinkOne(item.id, item.productName)}
                activeOpacity={0.7}
              >
                <Minus size={14} color={Theme.colors.primary} />
                <Text style={styles.drinkBtnText}>Log 1 Pack Consumed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.restockQuickBtn}
                onPress={() => triggerSimulatedDrop(item.productId)}
                activeOpacity={0.8}
              >
                <Zap size={14} color="#FFFFFF" />
                <Text style={styles.restockQuickText}>Order Refill</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.containerMargin,
    gap: 16,
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#4338CA',
    ...Theme.shadows.card,
  },
  heroIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.statusSuccessText,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 13,
    color: '#C7D2FE',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  batchSub: {
    fontSize: 11,
    color: Theme.colors.secondary,
    marginTop: 2,
  },
  daysBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  daysBadgeNormal: {
    backgroundColor: Theme.colors.statusSuccessBg,
  },
  daysBadgeLow: {
    backgroundColor: Theme.colors.statusDangerBg,
  },
  daysBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  daysBadgeTextNormal: {
    color: Theme.colors.statusSuccessText,
  },
  daysBadgeTextLow: {
    color: Theme.colors.statusDangerText,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  unitsText: {
    fontSize: 12,
    color: Theme.colors.secondary,
    fontWeight: '600',
  },
  paceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    marginBottom: 12,
  },
  paceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.onSurface,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  drinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    backgroundColor: Theme.colors.surfaceContainerLow,
    gap: 6,
  },
  drinkBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  restockQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.primaryContainer,
    gap: 6,
  },
  restockQuickText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
