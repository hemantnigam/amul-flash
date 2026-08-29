import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from './AppText';
import { Theme } from '../constants/theme';
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
  // Determine effective status
  const effectiveStatus: StockStatus =
    status || (isInStock ? (stockCount < 10 ? 'low_stock' : 'in_stock') : 'out_of_stock');

  let bg = Theme.colors.statusSuccessBg;
  let text = Theme.colors.statusSuccessText;
  let border = Theme.colors.statusSuccessBorder;
  let label = 'In Stock';

  if (effectiveStatus === 'out_of_stock') {
    bg = Theme.colors.statusDangerBg;
    text = Theme.colors.statusDangerText;
    border = Theme.colors.statusDangerBorder;
    label = 'Out of Stock';
  } else if (effectiveStatus === 'low_stock') {
    bg = Theme.colors.statusWarningBg;
    text = Theme.colors.statusWarningText;
    border = Theme.colors.statusWarningBorder;
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
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: Theme.radius.full,
  },
  text: {
    fontWeight: '600',
  },
});
