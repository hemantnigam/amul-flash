import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AppTextInput as TextInput } from '../components/AppTextInput';
import {
  MapPin,
  Plus,
  Trash2,
  Check,
  Navigation,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { useStockStore } from '../store/useStockStore';
import { PincodeLocation } from '../types/amul';
import { analyticsService } from '../services/analyticsService';

export default function LocationsScreen() {
  const {
    pincodes,
    selectedPincode,
    setSelectedPincode,
    addPincode,
    removePincode,
    products,
  } = useStockStore();

  const [newPincode, setNewPincode] = useState('');
  const [newLabel, setNewLabel] = useState('');

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Radar Overview Hero */}
      <View style={styles.radarHero}>
        <View style={styles.radarIconBadge}>
          <Compass size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.radarTitle}>Cross-Zone Radius Radar</Text>
        <Text style={styles.radarDesc}>
          Simultaneously monitor multiple metro zones. If an item sells out at Home, the Radar alerts you if it's available at your Office or Gym!
        </Text>
      </View>

      {/* Cross-Zone Suggestion Card */}
      <View style={styles.suggestionCard}>
        <View style={styles.suggHeader}>
          <MapPin size={16} color={Theme.colors.primary} />
          <Text style={styles.suggTitle}>Cross-Zone Routing Alert</Text>
        </View>
        <Text style={styles.suggBody}>
          Amul Protein Lassi (Rose) is <Text style={{ color: Theme.colors.statusSuccessText, fontWeight: '700' }}>IN STOCK</Text> at your Office pincode (560066, 4.8 km away).
        </Text>
        <TouchableOpacity
          style={styles.suggActionBtn}
          onPress={() => {
            const office = pincodes.find((p) => p.label === 'Office') || pincodes[1];
            if (office) setSelectedPincode(office);
          }}
        >
          <Text style={styles.suggActionText}>Switch to Office for Instant Checkout</Text>
          <ArrowRight size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Active Pincodes List */}
      <Text style={styles.sectionTitle}>Active Monitored Locations</Text>
      <View style={styles.list}>
        {pincodes.map((item) => {
          const isSelected = item.pincode === selectedPincode.pincode;
          return (
            <View
              key={item.pincode}
              style={[styles.pincodeCard, isSelected && styles.pincodeCardActive]}
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
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{item.pincode}</Text>
                  </View>
                  {item.distanceKm !== undefined && (
                    <Text style={styles.distanceText}>
                      {item.distanceKm === 0 ? 'Primary' : `${item.distanceKm} km`}
                    </Text>
                  )}
                </View>
                <Text style={styles.addressText}>{item.address}</Text>
              </TouchableOpacity>

              <View style={styles.cardActions}>
                {isSelected ? (
                  <View style={styles.activeCheck}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removePincode(item.pincode)}
                  >
                    <Trash2 size={16} color={Theme.colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Add Location Form */}
      <View style={styles.addCard}>
        <Text style={styles.addCardTitle}>Add Location to Radar</Text>
        <TextInput
          style={styles.input}
          placeholder="6-Digit Pincode (e.g. 560001)"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={6}
          value={newPincode}
          onChangeText={setNewPincode}
        />
        <TextInput
          style={styles.input}
          placeholder="Label (e.g. Gym, Parents' Home, Coworking)"
          placeholderTextColor="#9CA3AF"
          value={newLabel}
          onChangeText={setNewLabel}
        />
        <TouchableOpacity
          style={[styles.addBtn, newPincode.length !== 6 && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={newPincode.length !== 6}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add to Radar Monitor</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.containerMargin,
    gap: 16,
    paddingBottom: 36,
  },
  radarHero: {
    backgroundColor: '#1E1B4B',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#4338CA',
    ...Theme.shadows.card,
  },
  radarIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryContainer,
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
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.primaryFixed,
    ...Theme.shadows.card,
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
    color: Theme.colors.primary,
  },
  suggBody: {
    fontSize: 13,
    color: Theme.colors.onSurface,
    lineHeight: 18,
    marginBottom: 12,
  },
  suggActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primaryContainer,
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
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
    color: Theme.colors.onSurface,
  },
  list: {
    gap: 10,
  },
  pincodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  pincodeCardActive: {
    borderColor: Theme.colors.primaryContainer,
    backgroundColor: '#EFF6FF',
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
    color: Theme.colors.onSurface,
  },
  pill: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  distanceText: {
    fontSize: 12,
    color: Theme.colors.secondary,
  },
  addressText: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  cardActions: {
    marginLeft: 10,
  },
  activeCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: 6,
  },
  addCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    gap: 10,
    ...Theme.shadows.card,
  },
  addCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  input: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primaryContainer,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
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
