import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from './AppText';
import { CommonTheme } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { StockStatus } from '../types/amul';

interface StockBadgeProps {
  status?: StockStatus;
  isInStock?: boolean;
  stockCount?: number;
  size?: 'sm' | 'md';
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  status,
  isInStock,
  stockCount = 0,
  size = 'md',
}) => {
  const { colors, isDark } = useAppTheme();

  // Determine effective status
  const effectiveStatus: StockStatus =
    status || (isInStock ? (stockCount < 10 ? 'low_stock' : 'in_stock') : 'out_of_stock');

  let bg = isDark ? '#064E3B' : '#DCFCE7';
  let text = isDark ? '#34D399' : '#15803D';
  let border = isDark ? '#065F46' : '#BBF7D0';
  let label = 'In Stock';

  if (effectiveStatus === 'out_of_stock') {
    bg = isDark ? '#450A0A' : '#FEF2F2';
    text = isDark ? '#F87171' : '#B91C1C';
    border = isDark ? '#7F1D1D' : '#FECACA';
    label = 'Out of Stock';
  } else if (effectiveStatus === 'low_stock') {
    bg = isDark ? '#451A03' : '#FEF3C7';
    text = isDark ? '#FBBF24' : '#B45309';
    border = isDark ? '#78350F' : '#FDE68A';
    label = stockCount > 0 ? `Only ${stockCount} Left` : 'Low Stock';
  } else if (stockCount > 0) {
    label = `In Stock (${stockCount})`;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingHorizontal: isSmall ? 6 : 8,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: text,
            width: isSmall ? 5 : 6,
            height: isSmall ? 5 : 6,
          },
        ]}
      />
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: isSmall ? 10 : 12,
            lineHeight: isSmall ? 13 : 16,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CommonTheme.radius.full,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: CommonTheme.radius.full,
  },
  text: {
    fontWeight: '600',
  },
});
