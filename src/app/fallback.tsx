import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  GitFork,
  ShoppingBag,
  ShieldCheck,
  Zap,
  CheckCircle2,
  PackageCheck,
  Truck,
} from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { useFallbackStore } from '../store/useFallbackStore';
import { useStockStore } from '../store/useStockStore';

export default function FallbackScreen() {
  const { rules, bundlerSettings, toggleRule, toggleBundler, toggleAddonProduct } =
    useFallbackStore();
  const { products } = useStockStore();

  const addonProducts = products.filter(
    (p) => p.category === 'paneer' || p.category === 'specialty'
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconBadge}>
          <GitFork size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Smart Substitution & Basket Bundler</Text>
        <Text style={styles.heroDesc}>
          If your primary high-demand SKU goes out of stock mid-drop, the auto-cart engine instantaneously switches to your configured fallback choices.
        </Text>
      </View>

      {/* Free Delivery MOV Optimizer */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconTitle}>
            <Truck size={20} color={Theme.colors.primary} />
            <Text style={styles.cardTitle}>Free Delivery MOV Bundler</Text>
          </View>
          <Switch
            value={bundlerSettings.autoBundleForFreeShipping}
            onValueChange={toggleBundler}
            trackColor={{ true: Theme.colors.primaryContainer, false: '#D1D5DB' }}
          />
        </View>

        <Text style={styles.cardDesc}>
          Amul requires ₹{bundlerSettings.minimumOrderValue} for free shipping. If a single product is ₹750, auto-include your pre-selected companion items to eliminate shipping charges.
        </Text>

        <Text style={styles.addonSubheader}>Auto-Bundle Companion Items:</Text>
        <View style={styles.addonList}>
          {addonProducts.map((addon) => {
            const isSelected =
              bundlerSettings.selectedAddonProductIds.includes(addon.id);
            return (
              <TouchableOpacity
                key={addon.id}
                style={[styles.addonItem, isSelected && styles.addonItemSelected]}
                onPress={() => toggleAddonProduct(addon.id)}
                activeOpacity={0.7}
              >
                <View style={styles.addonInfo}>
                  <Text style={styles.addonName}>{addon.title}</Text>
                  <Text style={styles.addonPrice}>+₹{addon.defaultPrice}</Text>
                </View>
                {isSelected && (
                  <View style={styles.addonCheck}>
                    <CheckCircle2 size={18} color={Theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Substitution Hierarchy Rules */}
      <Text style={styles.sectionTitle}>Product Substitution Chains</Text>

      {rules.map((rule) => {
        const primary = products.find((p) => p.id === rule.primaryProductId);
        return (
          <View key={rule.primaryProductId} style={styles.card}>
            <View style={styles.ruleHeader}>
              <View style={styles.ruleHeaderInfo}>
                <Text style={styles.rulePrimaryLabel}>PRIMARY TARGET</Text>
                <Text style={styles.rulePrimaryTitle}>
                  {primary?.title || rule.primaryProductId}
                </Text>
              </View>
              <Switch
                value={rule.enabled}
                onValueChange={() => toggleRule(rule.primaryProductId)}
                trackColor={{ true: Theme.colors.primaryContainer, false: '#D1D5DB' }}
              />
            </View>

            <View style={styles.fallbackChain}>
              <Text style={styles.fallbackChainTitle}>Substitution Priority Order:</Text>
              {rule.fallbackProductIds.map((fallbackId, idx) => {
                const fbProduct = products.find((p) => p.id === fallbackId);
                return (
                  <View key={fallbackId} style={styles.fallbackStep}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepName}>
                        {fbProduct?.title || fallbackId}
                      </Text>
                      <Text style={styles.stepPrice}>
                        ₹{fbProduct?.defaultPrice || 750} • {fbProduct?.nutrition.proteinGrams}g Protein
                      </Text>
                    </View>
                  </View>
                );
              })}
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
    backgroundColor: Theme.colors.statusWarningText,
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
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  cardDesc: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 14,
  },
  addonSubheader: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginBottom: 8,
  },
  addonList: {
    gap: 8,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 12,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  addonItemSelected: {
    borderColor: Theme.colors.primaryContainer,
    backgroundColor: '#EFF6FF',
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  addonPrice: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  addonCheck: {
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginTop: 8,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
    marginBottom: 12,
  },
  ruleHeaderInfo: {
    flex: 1,
    marginRight: 10,
  },
  rulePrimaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 0.5,
  },
  rulePrimaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginTop: 2,
  },
  fallbackChain: {
    gap: 8,
  },
  fallbackChainTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.secondary,
    marginBottom: 4,
  },
  fallbackStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: Theme.radius.md,
    gap: 10,
  },
  stepNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.onSurface,
  },
  stepPrice: {
    fontSize: 11,
    color: Theme.colors.secondary,
  },
});
