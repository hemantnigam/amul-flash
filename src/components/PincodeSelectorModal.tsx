import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AppText as Text } from './AppText';
import { AppTextInput as TextInput } from './AppTextInput';
import { Check, Plus, X, Navigation, Trash2, ShieldCheck } from 'lucide-react-native';
import { CommonTheme } from '../constants/theme';
import { useStockStore } from '../store/useStockStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { PincodeLocation } from '../types/amul';

interface PincodeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PincodeSelectorModal: React.FC<PincodeSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { pincodes, selectedPincode, setSelectedPincode, addPincode, removePincode } = useStockStore();
  const { colors, isDark } = useAppTheme();
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
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.titleRow}>
                <Navigation size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Delivery Pincode</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceContainer }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subtext, { color: colors.textSecondary }]}>
              Amul allocates high-protein inventory by regional warehouse clusters.
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* List of Saved Pincodes */}
              {pincodes.map((item) => {
                const isSelected = item.pincode === selectedPincode?.pincode;
                return (
                  <TouchableOpacity
                    key={item.pincode}
                    style={[
                      styles.pincodeItem,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#1E1E1E'
                            : '#EFF6FF'
                          : colors.cardSecondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pincodeInfo}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.itemLabel, { color: isSelected ? colors.primary : colors.text }]}>
                          {item.label.includes(item.pincode) ? item.label : `${item.label} (${item.pincode})`}
                        </Text>
                        {item.isSavedAddress && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#064E3B' : '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 3 }}>
                            <ShieldCheck size={11} color={isDark ? '#34D399' : '#059669'} />
                            <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#34D399' : '#059669' }}>Saved</Text>
                          </View>
                        )}
                        <View style={[styles.pincodeBadge, { backgroundColor: colors.surfaceContainer }]}>
                          <Text style={[styles.pincodeBadgeText, { color: colors.primary }]}>{item.pincode}</Text>
                        </View>
                      </View>
                      <Text style={[styles.addressText, { color: colors.textSecondary }]}>{item.address}</Text>
                    </View>

                    {isSelected && (
                      <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                        <Check size={16} color="#FFFFFF" />
                      </View>
                    )}

                    {!item.isSavedAddress && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          removePincode(item.pincode);
                        }}
                        style={[styles.roundedDeleteBtn, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={13} color={isDark ? '#F87171' : '#DC2626'} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Add Custom Pincode Section */}
              {!showAddForm ? (
                <TouchableOpacity
                  style={[styles.addToggleBtn, { borderColor: colors.primary }]}
                  onPress={() => setShowAddForm(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={colors.primary} />
                  <Text style={[styles.addToggleText, { color: colors.primary }]}>Add Another Pincode</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.addForm, { backgroundColor: colors.surfaceContainer }]}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter 6-digit Pincode (e.g. 110001)"
                    placeholderTextColor={colors.textMuted}
                    value={newPincode}
                    onChangeText={setNewPincode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="Label (e.g. Home, Office)"
                    placeholderTextColor={colors.textMuted}
                    value={newLabel}
                    onChangeText={setNewLabel}
                  />
                  <View style={styles.formActionRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setShowAddForm(false);
                        setNewPincode('');
                        setNewLabel('');
                      }}
                    >
                      <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveBtn,
                        { backgroundColor: colors.primary },
                        newPincode.trim().length !== 6 && styles.saveBtnDisabled,
                      ]}
                      onPress={handleAddLocation}
                      disabled={newPincode.trim().length !== 6}
                    >
                      <Text style={styles.saveBtnText}>Add Pincode</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
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
  },
  closeBtn: {
    padding: 6,
    borderRadius: 999,
  },
  subtext: {
    fontSize: 13,
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
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
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
  },
  pincodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pincodeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 12,
  },
  addressText: {
    fontSize: 13,
  },
  checkIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  roundedDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
    marginTop: 8,
  },
  addToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addForm: {
    marginTop: 12,
    gap: 10,
    padding: 14,
    borderRadius: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
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
