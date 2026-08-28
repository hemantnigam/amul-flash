import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, Clock, X, ShoppingBag } from 'lucide-react-native';
import { Theme } from '../constants/theme';
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
    <View style={styles.bannerContainer}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.flashBadge}>
            <Zap size={14} color="#FFFFFF" />
            <Text style={styles.flashText}>LIVE RESTOCK DROP</Text>
          </View>
          <View style={styles.timerChip}>
            <Clock size={12} color={Theme.colors.statusDangerText} />
            <Text style={styles.timerText}>{formatTime(secondsRemaining)} left</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <X size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.productTitle}>{alert.productName}</Text>
      <Text style={styles.detailText}>
        {alert.unitsAdded} units dropped for Pincode {alert.pincode} • Auto-cart pre-reserved
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.payNowBtn}
          onPress={() => onPayNow(alert)}
          activeOpacity={0.8}
        >
          <Zap size={16} color="#FFFFFF" />
          <Text style={styles.payNowText}>⚡ 1-Tap UPI Flash Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#1E1B4B',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.containerMargin,
    marginTop: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#4338CA',
    ...Theme.shadows.active,
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
    backgroundColor: Theme.colors.statusDangerText,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
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
    backgroundColor: Theme.colors.statusDangerBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    gap: 4,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.statusDangerText,
  },
  closeBtn: {
    padding: 4,
    borderRadius: Theme.radius.full,
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
    backgroundColor: Theme.colors.primaryContainer,
    paddingVertical: 12,
    borderRadius: Theme.radius.lg,
    gap: 6,
  },
  payNowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
