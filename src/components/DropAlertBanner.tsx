import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from './AppText';
import { Zap, Clock, X } from 'lucide-react-native';
import { CommonTheme } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { RestockEvent } from '../types/amul';

interface DropAlertBannerProps {
  alert: RestockEvent;
  onPayNow: (alert: RestockEvent) => void;
  onDismiss: () => void;
}

export const DropAlertBanner: React.FC<DropAlertBannerProps> = ({
  alert,
  onPayNow,
  onDismiss,
}) => {
  const { colors, isDark } = useAppTheme();
  const [secondsRemaining, setSecondsRemaining] = useState(alert.survivalDurationSecs || 165);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View
      style={[
        styles.bannerContainer,
        {
          backgroundColor: isDark ? '#1E1B4B' : '#1E1B4B',
          borderColor: isDark ? '#4338CA' : '#3730A3',
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.flashBadge}>
            <Zap size={14} color="#FFFFFF" />
            <Text style={styles.flashText}>LIVE RESTOCK DROP</Text>
          </View>
          <View style={styles.timerChip}>
            <Clock size={12} color="#EF4444" />
            <Text style={styles.timerText}>{formatTime(secondsRemaining)} left</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <X size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.productTitle}>{alert.productName}</Text>
      <Text style={styles.detailText}>
        {alert.unitsAdded} units dropped for Pincode {alert.pincode} • Live Stock Restocked
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.payNowBtn, { backgroundColor: colors.primary }]}
          onPress={() => onPayNow(alert)}
          activeOpacity={0.8}
        >
          <Zap size={16} color="#FFFFFF" />
          <Text style={styles.payNowText}>View Restocked Item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    borderRadius: CommonTheme.radius.xl,
    padding: CommonTheme.spacing.lg,
    marginHorizontal: CommonTheme.spacing.containerMargin,
    marginTop: CommonTheme.spacing.md,
    borderWidth: 1,
    ...CommonTheme.shadows.active,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: CommonTheme.radius.full,
    gap: 4,
  },
  flashText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#450A0A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: CommonTheme.radius.full,
    gap: 4,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F87171',
  },
  closeBtn: {
    padding: 4,
    borderRadius: CommonTheme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    color: '#C7D2FE',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  payNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: CommonTheme.radius.lg,
    gap: 6,
  },
  payNowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
