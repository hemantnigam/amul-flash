import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from './AppText';
import { Sparkles, Gift, Zap, ShieldAlert, ArrowRight } from 'lucide-react-native';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useAppTheme } from '../hooks/useAppTheme';

interface VipBadgeProps {
  showUpgradeBtn?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

export const VipBadge: React.FC<VipBadgeProps> = ({
  showUpgradeBtn = true,
  compact = false,
  onPress,
}) => {
  const {
    isVipActive,
    isTrial,
    daysRemaining,
    isExpiringSoon,
    openPaywall,
    openPaymentDetails,
  } = useSubscriptionStore();
  const { colors, isDark } = useAppTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isVipActive && !isExpiringSoon) {
      openPaymentDetails();
    } else {
      openPaywall();
    }
  };

  // Case 1: Pre-expiry urgent banner (Day 28 / <= 2 days left in trial)
  if (isExpiringSoon) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          styles.expiringContainer,
          {
            backgroundColor: isDark ? '#451A03' : '#FFFBEB',
            borderColor: isDark ? '#92400E' : '#FDE68A',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={styles.contentRow}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? '#78350F' : '#FEF3C7' }]}>
            <ShieldAlert size={compact ? 14 : 16} color="#D97706" />
          </View>
          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <Text style={[styles.expiringTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                ⏳ VIP Trial Ends in {daysRemaining} Day{daysRemaining === 1 ? '' : 's'}
              </Text>
            </View>
            {!compact && (
              <Text style={[styles.subtitle, { color: isDark ? '#FCD34D' : '#B45309' }]}>
                Keep unlimited multi-hub alerts & charts for ₹7/week
              </Text>
            )}
          </View>
        </View>

        {showUpgradeBtn && (
          <View style={[styles.actionPill, { backgroundColor: '#D97706' }]}>
            <Text style={styles.actionPillText}>Extend Pass</Text>
            <ArrowRight size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Case 2: Active 30-Day VIP Trial
  if (isVipActive && isTrial) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
            borderColor: isDark ? '#3730A3' : '#C7D2FE',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={styles.contentRow}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? '#312E81' : '#E0E7FF' }]}>
            <Gift size={compact ? 14 : 16} color="#6366F1" />
          </View>
          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <Text style={[styles.vipTitle, { color: isDark ? '#E0E7FF' : '#3730A3' }]}>
                🎁 30-Day VIP Access Active
              </Text>
              <View style={[styles.dayBadge, { backgroundColor: isDark ? '#4338CA' : '#C7D2FE' }]}>
                <Text style={[styles.dayBadgeText, { color: isDark ? '#EEF2FF' : '#312E81' }]}>
                  {daysRemaining} Days Left
                </Text>
              </View>
            </View>
            {!compact && (
              <Text style={[styles.subtitle, { color: isDark ? '#A5B4FC' : '#4F46E5' }]}>
                Unlimited tracking, multi-pincodes & drop intelligence unlocked
              </Text>
            )}
          </View>
        </View>

        {showUpgradeBtn && (
          <View style={[styles.passActiveTag, { borderColor: isDark ? '#6366F1' : '#818CF8' }]}>
            <Sparkles size={11} color={isDark ? '#A5B4FC' : '#4F46E5'} />
            <Text style={[styles.passActiveText, { color: isDark ? '#A5B4FC' : '#4F46E5' }]}>VIP Active</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Case 3: Active Paid Pass (1-Week or 1-Month)
  if (isVipActive && !isTrial) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
            borderColor: isDark ? '#065F46' : '#A7F3D0',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={styles.contentRow}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? '#047857' : '#D1FAE5' }]}>
            <Zap size={compact ? 14 : 16} color="#10B981" />
          </View>
          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <Text style={[styles.vipTitle, { color: isDark ? '#D1FAE5' : '#065F46', fontWeight: '800' }]}>
                ⚡ VIP Member Active
              </Text>
              <View style={[styles.dayBadge, { backgroundColor: isDark ? '#047857' : '#A7F3D0' }]}>
                <Text style={[styles.dayBadgeText, { color: isDark ? '#ECFDF5' : '#047857' }]}>
                  {daysRemaining} Days Left
                </Text>
              </View>
            </View>
            {!compact && (
              <Text style={[styles.subtitle, { color: isDark ? '#6EE7B7' : '#059669' }]}>
                Full radar access, unlimited tracking & drop intelligence active
              </Text>
            )}
          </View>
        </View>

        {daysRemaining <= 2 ? (
          <View style={[styles.actionPill, { backgroundColor: '#059669' }]}>
            <Text style={styles.actionPillText}>Renew</Text>
            <ArrowRight size={12} color="#FFFFFF" />
          </View>
        ) : (
          <View style={[styles.passActiveTag, { borderColor: isDark ? '#10B981' : '#6EE7B7' }]}>
            <Sparkles size={11} color={isDark ? '#6EE7B7' : '#059669'} />
            <Text style={[styles.passActiveText, { color: isDark ? '#6EE7B7' : '#059669' }]}>Details</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Case 4: Free Tier Member (Subscription Page & Upgrade Prompts Visible Here)
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
          borderColor: isDark ? '#4338CA' : '#C7D2FE',
          paddingVertical: 14,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.contentRow}>
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#312E81' : '#E0E7FF' }]}>
          <Sparkles size={compact ? 14 : 18} color="#6366F1" />
        </View>
        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.vipTitle, { color: isDark ? '#E0E7FF' : '#3730A3', fontWeight: '900' }]}>
              ⭐ Upgrade to VIP Pass
            </Text>
            <View style={[styles.dayBadge, { backgroundColor: '#FF6B00' }]}>
              <Text style={[styles.dayBadgeText, { color: '#FFFFFF', fontWeight: '800' }]}>
                ₹7 / Week
              </Text>
            </View>
          </View>
          {!compact && (
            <Text style={[styles.subtitle, { color: isDark ? '#A5B4FC' : '#4F46E5', marginTop: 2 }]}>
              Unlock unlimited tracked items, multi-pincodes & live drop charts
            </Text>
          )}
        </View>
      </View>

      {showUpgradeBtn && (
        <View style={[styles.actionPill, { backgroundColor: colors.primary }]}>
          <Text style={styles.actionPillText}>Get VIP Pass</Text>
          <ArrowRight size={12} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 6,
  },
  expiringContainer: {
    borderWidth: 1.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  vipTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  expiringTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  dayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  passActiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  passActiveText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
