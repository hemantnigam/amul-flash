import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { AppText as Text } from './AppText';
import { AppTextInput as TextInput } from './AppTextInput';
import { MapPin, Check, Plus, X, Navigation } from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { useStockStore } from '../store/useStockStore';
import { PincodeLocation } from '../types/amul';

interface PincodeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PincodeSelectorModal: React.FC<PincodeSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { pincodes, selectedPincode, setSelectedPincode, addPincode } = useStockStore();
  const [newPincode, setNewPincode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSelect = (item: PincodeLocation) => {
    setSelectedPincode(item);
    onClose();
  };

  const handleAddLocation = () => {
    if (newPincode.trim().length === 6) {
      const added: PincodeLocation = {
        pincode: newPincode.trim(),
        label: newLabel.trim() || `Location ${newPincode}`,
        address: `Amul Cluster Hub for ${newPincode}`,
        storeId: `STORE_${newPincode}`,
        serviceable: true,
        distanceKm: Math.floor(Math.random() * 8) + 1,
      };
      addPincode(added);
      setSelectedPincode(added);
      setNewPincode('');
      setNewLabel('');
      setShowAddForm(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Navigation size={20} color={Theme.colors.primary} />
              <Text style={styles.modalTitle}>Select Delivery Pincode</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtext}>
            Amul allocates high-protein inventory by regional warehouse clusters.
          </Text>

          {/* List of Saved Pincodes */}
          <FlatList
            data={pincodes}
            keyExtractor={(item) => item.pincode}
            renderItem={({ item }) => {
              const isSelected = item.pincode === selectedPincode.pincode;
              return (
                <TouchableOpacity
                  style={[styles.pincodeItem, isSelected && styles.pincodeItemSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pincodeInfo}>
                    <View style={styles.labelRow}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      <View style={styles.pincodeBadge}>
                        <Text style={styles.pincodeBadgeText}>{item.pincode}</Text>
                      </View>
                      {item.distanceKm !== undefined && item.distanceKm > 0 && (
                        <Text style={styles.distanceText}>({item.distanceKm} km away)</Text>
                      )}
                    </View>
                    <Text style={styles.addressText} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Check size={18} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.listContainer}
          />

          {/* Add Pincode Toggle */}
          {!showAddForm ? (
            <TouchableOpacity
              style={styles.addToggleBtn}
              onPress={() => setShowAddForm(true)}
            >
              <Plus size={18} color={Theme.colors.primary} />
              <Text style={styles.addToggleText}>Add Another Pincode to Radar</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="6-Digit Pincode (e.g. 560034)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={6}
                value={newPincode}
                onChangeText={setNewPincode}
              />
              <TextInput
                style={styles.input}
                placeholder="Label (e.g. Home, Office, Gym)"
                placeholderTextColor="#9CA3AF"
                value={newLabel}
                onChangeText={setNewLabel}
              />
              <View style={styles.formActionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    newPincode.length !== 6 && styles.saveBtnDisabled,
                  ]}
                  onPress={handleAddLocation}
                  disabled={newPincode.length !== 6}
                >
                  <Text style={styles.saveBtnText}>Track Pincode</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: Theme.radius.xxl,
    borderTopRightRadius: Theme.radius.xxl,
    padding: Theme.spacing.containerMargin,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  subtext: {
    fontSize: 13,
    color: Theme.colors.secondary,
    marginBottom: 16,
  },
  listContainer: {
    gap: 10,
    paddingBottom: 16,
  },
  pincodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  pincodeItemSelected: {
    borderColor: Theme.colors.primaryContainer,
    backgroundColor: '#EFF6FF',
  },
  pincodeInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  pincodeBadge: {
    backgroundColor: Theme.colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pincodeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  distanceText: {
    fontSize: 12,
    color: Theme.colors.secondary,
  },
  addressText: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
  },
  checkIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderStyle: 'dashed',
    gap: 6,
    marginTop: 8,
  },
  addToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  addForm: {
    marginTop: 12,
    gap: 10,
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 14,
    borderRadius: Theme.radius.lg,
  },
  input: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  formActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontSize: 14,
    color: Theme.colors.secondary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: Theme.colors.primaryContainer,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.md,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
