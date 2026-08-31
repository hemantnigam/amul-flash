import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AppTextInput as TextInput } from '../components/AppTextInput';
import {
  MapPin,
  Plus,
  Trash2,
  Check,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useStockStore } from '../store/useStockStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { PincodeLocation } from '../types/amul';
import { analyticsService } from '../services/analyticsService';

export default function LocationsScreen() {
  const {
    pincodes,
    selectedPincode,
    setSelectedPincode,
    addPincode,
    removePincode,
    syncPincodesFromAddresses,
  } = useStockStore();
  const { addresses } = useSessionStore();
  const { colors, isDark } = useAppTheme();

  const [newPincode, setNewPincode] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    analyticsService.logScreenView('LocationsScreen');
    if (addresses && addresses.length > 0) {
      syncPincodesFromAddresses(addresses);
    }
  }, [addresses, syncPincodesFromAddresses]);

  const handleAdd = () => {
    if (newPincode.trim().length === 6) {
      const added: PincodeLocation = {
        pincode: newPincode.trim(),
        label: newLabel.trim() || `Location ${newPincode}`,
        address: `Amul Cluster for Pincode ${newPincode}`,
        storeId: `STORE_${newPincode}`,
        serviceable: true,
        distanceKm: Math.floor(Math.random() * 8) + 2,
      };
      addPincode(added);
      setNewPincode('');
      setNewLabel('');
      Alert.alert('Pincode Added to Radar', `Now tracking ${added.label} (${added.pincode}) in real-time.`);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Radar Overview Hero */}
        <View style={[styles.radarHero, { backgroundColor: isDark ? '#141414' : '#1E293B', borderColor: isDark ? '#262626' : '#334155' }]}>
          <View style={[styles.radarIconBadge, { backgroundColor: colors.primary }]}>
            <Compass size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.radarTitle}>Cross-Zone Radius Radar</Text>
          <Text style={[styles.radarDesc, { color: isDark ? '#A1A1AA' : '#C7D2FE' }]}>
            Simultaneously monitor multiple metro zones. If an item sells out at Home, the Radar alerts you if it's available at your Office or Gym!
          </Text>
        </View>

        {/* Dynamic Cross-Zone Suggestion Card */}
        {(() => {
          const alternateHub = pincodes.find((p) => p.pincode !== selectedPincode?.pincode);
          if (!alternateHub) return null;
          return (
            <View style={[styles.suggestionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.suggHeader}>
                <MapPin size={16} color={colors.primary} />
                <Text style={[styles.suggTitle, { color: colors.primary }]}>Cross-Zone Routing Alert</Text>
              </View>
              <Text style={[styles.suggBody, { color: colors.text }]}>
                Switch active hub to <Text style={{ color: colors.primary, fontWeight: '700' }}>{alternateHub.label} ({alternateHub.pincode})</Text> to check regional stock availability.
              </Text>
              <TouchableOpacity
                style={[styles.suggActionBtn, { backgroundColor: colors.primary }]}
                onPress={() => setSelectedPincode(alternateHub)}
              >
                <Text style={styles.suggActionText}>Switch to {alternateHub.label}</Text>
                <ArrowRight size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Active Pincodes List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Monitored Locations</Text>
        <View style={styles.list}>
          {pincodes.map((item) => {
            const isSelected = item.pincode === selectedPincode?.pincode;
            return (
              <View
                key={item.pincode}
                style={[
                  styles.pincodeCard,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? '#1E1E1E'
                        : '#EFF6FF'
                      : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => {
                    setSelectedPincode(item);
                    analyticsService.logPincodeChange(item.pincode, item.label);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.titleRow}>
                    <Text style={[styles.itemLabel, { color: isSelected ? colors.primary : colors.text }]}>
                      {item.label.includes(item.pincode) ? item.label : `${item.label} (${item.pincode})`}
                    </Text>
                    {item.distanceKm !== undefined && item.distanceKm > 0 && (
                      <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                        {item.distanceKm} km
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>{item.address}</Text>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  {isSelected && (
                    <View style={[styles.activeCheck, { backgroundColor: colors.primary }]}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                  {!item.isSavedAddress ? (
                    <TouchableOpacity
                      style={[styles.deleteBtn, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}
                      onPress={() => {
                        Alert.alert(
                          'Remove Delivery Hub',
                          `Remove ${item.pincode} (${item.label}) from monitored hubs?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: () => removePincode(item.pincode),
                            },
                          ]
                        );
                      }}
                    >
                      <Trash2 size={16} color={isDark ? '#F87171' : '#EF4444'} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6 }}>
                      <ShieldCheck size={14} color={isDark ? '#34D399' : '#059669'} />
                      <Text style={{ fontSize: 11, color: isDark ? '#34D399' : '#059669', fontWeight: '600' }}>Saved</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Add Location Form */}
        <View style={[styles.addCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.addCardTitle, { color: colors.text }]}>Add Location to Radar</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.border, color: colors.text }]}
            placeholder="6-Digit Pincode (e.g. 560001)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            maxLength={6}
            value={newPincode}
            onChangeText={setNewPincode}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.border, color: colors.text }]}
            placeholder="Label (e.g. Gym, Office, Coworking)"
            placeholderTextColor={colors.textMuted}
            value={newLabel}
            onChangeText={setNewLabel}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }, newPincode.length !== 6 && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={newPincode.length !== 6}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add to Radar Monitor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 36,
  },
  radarHero: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  radarIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  radarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  radarDesc: {
    fontSize: 13,
    color: '#C7D2FE',
    lineHeight: 18,
  },
  suggestionCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  suggHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  suggTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  suggBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  suggActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  suggActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  pincodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  cardMain: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  distanceText: {
    fontSize: 12,
  },
  addressText: {
    fontSize: 12,
  },
  cardActions: {
    marginLeft: 10,
  },
  activeCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 10,
  },
  addCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
