import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Bell, Zap } from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { useStockStore } from '../store/useStockStore';
import { PincodeSelectorModal } from './PincodeSelectorModal';

interface HeaderProps {
  onOpenSimulator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSimulator }) => {
  const { selectedPincode, isSimulatingDrop, triggerSimulatedDrop } = useStockStore();
  const [isPincodeModalVisible, setIsPincodeModalVisible] = useState(false);

  return (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={styles.locationChip}
            onPress={() => setIsPincodeModalVisible(true)}
            activeOpacity={0.7}
          >
            <MapPin size={16} color={Theme.colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {selectedPincode.label} ({selectedPincode.pincode})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerSection}>
          <Text style={styles.brandTitle}>Amul Flash</Text>
        </View>

        <View style={styles.rightSection}>
          {/* Quick Drop Simulator Trigger Button */}
          <TouchableOpacity
            style={[styles.simButton, isSimulatingDrop && styles.simButtonActive]}
            onPress={onOpenSimulator || (() => triggerSimulatedDrop())}
            activeOpacity={0.7}
          >
            <Zap size={16} color="#FFFFFF" />
            <Text style={styles.simButtonText}>Sim Drop</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PincodeSelectorModal
        visible={isPincodeModalVisible}
        onClose={() => setIsPincodeModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.containerMargin,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.primary,
    letterSpacing: -0.3,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    gap: 4,
  },
  simButtonActive: {
    backgroundColor: Theme.colors.statusDangerText,
  },
  simButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
