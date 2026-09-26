import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from './AppText';
import { ShieldAlert, Info } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';

interface LegalDisclaimerProps {
  compact?: boolean;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ compact = false }) => {
  const { colors, isDark } = useAppTheme();

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: isDark ? '#18181B' : '#F1F5F9' }]}>
        <Info size={12} color={colors.textSecondary} />
        <Text style={[styles.compactText, { color: colors.textSecondary }]}>
          Independent inventory tracking tool. Not affiliated with or endorsed by official brand manufacturers.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#18181B' : '#F8FAFC',
          borderColor: isDark ? '#27272A' : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.headerRow}>
        <ShieldAlert size={15} color={isDark ? '#94A3B8' : '#64748B'} />
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          INDEPENDENT TRACKER & DISCLAIMER
        </Text>
      </View>

      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        <Text style={{ fontWeight: '700', color: colors.text }}>ProteinRadar</Text> is an independent third-party inventory monitoring and alert utility. It is not affiliated, associated, authorized, endorsed by, or in any way officially connected with any dairy brands, official manufacturers, or any of their subsidiaries or affiliates.
      </Text>

      <Text style={[styles.subText, { color: colors.textMuted }]}>
        All product names, trademarks, logos, and brands are property of their respective owners. Product data and inventory availability are publicly accessible information aggregated solely for user notification convenience.
      </Text>

      <View style={[styles.divider, { borderTopColor: isDark ? '#27272A' : '#E2E8F0' }]} />

      <Text style={[styles.versionText, { color: colors.textMuted }]}>
        ProteinRadar • Version 1.0.0
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bodyText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  subText: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  divider: {
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 8,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  compactText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 13,
  },
});
