import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Building,
  Home,
  Check,
  RefreshCw,
} from 'lucide-react-native';
import { useSessionStore } from '../store/useSessionStore';
import { AmulUserAddress } from '../types/amul';

export default function AddressesScreen() {
  const router = useRouter();
  const {
    session,
    userProfile,
    addresses,
    isLoadingUserData,
    loadUserData,
    addAddress,
    deleteAddress,
    setDefaultAddress,
  } = useSessionStore();

  const [isSyncing, setIsSyncing] = useState(false);

  // Add Address Modal State
  const [isAddAddressVisible, setIsAddAddressVisible] = useState(false);
  const [addrFullName, setAddrFullName] = useState(
    userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : 'Hemant Nigam'
  );
  const [addrPhone, setAddrPhone] = useState(
    userProfile?.phone || session.mobile || '+919899940268'
  );
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('New Delhi');
  const [addrState, setAddrState] = useState('Delhi');
  const [addrZip, setAddrZip] = useState('110044');
  const [addrType, setAddrType] = useState<'home' | 'office'>('home');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const handleRefresh = async () => {
    setIsSyncing(true);
    await loadUserData();
    setIsSyncing(false);
  };

  const handleSaveNewAddress = async () => {
    if (!addrStreet.trim() || !addrZip.trim()) {
      Alert.alert('Missing Details', 'Please enter your street address and pincode.');
      return;
    }

    setIsSavingAddress(true);
    const success = await addAddress({
      fullName: addrFullName.trim(),
      phone: addrPhone.trim(),
      address: addrStreet.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      zip: addrZip.trim(),
      country: 'IN',
      addressType: addrType,
      userId: userProfile?.id || session.userId || '696091a6025cd5c65247e101',
      isDefault: addresses.length === 0,
    });
    setIsSavingAddress(false);

    if (success) {
      setIsAddAddressVisible(false);
      setAddrStreet('');
    } else {
      Alert.alert('Notice', 'Address was saved to your active session.');
      setIsAddAddressVisible(false);
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Delete this delivery address from your Amul account?')) {
        deleteAddress(id);
      }
      return;
    }

    Alert.alert('Delete Address', 'Are you sure you want to delete this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddress(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Delivery Addresses</Text>
          <Text style={styles.headerSubtitle}>
            {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'} saved
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => setIsAddAddressVisible(true)}
          activeOpacity={0.7}
        >
          <Plus size={16} color="#2563EB" />
          <Text style={styles.addHeaderText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingUserData || isSyncing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {addresses.length > 0 ? (
          addresses.map((addr) => {
            const isDefault = addr.isDefault || session.defaultAddressId === addr.id;
            const isOffice = addr.addressType === 'office';

            return (
              <View
                key={addr.id}
                style={[styles.addressCard, isDefault && styles.addressCardDefault]}
              >
                {/* Top Row: Type pill + Default tag + Delete */}
                <View style={styles.addressTopRow}>
                  <View style={styles.addressTypePill}>
                    {isOffice ? (
                      <Building size={12} color="#475569" />
                    ) : (
                      <Home size={12} color="#475569" />
                    )}
                    <Text style={styles.addressTypeText}>
                      {addr.addressType.toUpperCase()}
                    </Text>
                  </View>

                  {isDefault && (
                    <View style={styles.defaultPill}>
                      <CheckCircle2 size={11} color="#059669" />
                      <Text style={styles.defaultPillText}>DEFAULT ADDRESS</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(addr.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={15} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Address Details */}
                <Text style={styles.recipientName}>{addr.fullName}</Text>
                <Text style={styles.streetAddress}>{addr.address}</Text>
                <Text style={styles.cityStateZip}>
                  {addr.city}, {addr.state} - {addr.zip}
                </Text>
                <Text style={styles.phoneText}>Mobile: {addr.phone}</Text>

                {/* Bottom Action: Set as Default */}
                {!isDefault && (
                  <TouchableOpacity
                    style={styles.setDefaultBtn}
                    onPress={() => setDefaultAddress(addr.id)}
                    activeOpacity={0.7}
                  >
                    <Check size={14} color="#2563EB" />
                    <Text style={styles.setDefaultText}>Set as Default Delivery Address</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <MapPin size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Addresses</Text>
            <Text style={styles.emptySubtitle}>
              Add your delivery address to enable quick 1-tap checkout for high-protein drops.
            </Text>
            <TouchableOpacity
              style={styles.addFirstBtn}
              onPress={() => setIsAddAddressVisible(true)}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addFirstBtnText}>Add Delivery Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={isAddAddressVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MapPin size={18} color="#2563EB" />
                <Text style={styles.modalTitle}>Add Delivery Address</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddAddressVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={addrFullName}
                onChangeText={setAddrFullName}
                placeholder="Recipient Name"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Mobile Phone (+91)</Text>
              <TextInput
                style={styles.modalInput}
                value={addrPhone}
                onChangeText={setAddrPhone}
                placeholder="+91 Phone Number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Flat / House No. / Street / Landmark</Text>
              <TextInput
                style={[styles.modalInput, { height: 64, textAlignVertical: 'top' }]}
                value={addrStreet}
                onChangeText={setAddrStreet}
                placeholder="e.g. G-50/10, Gali No 2A, Molarband Extn"
                placeholderTextColor="#94A3B8"
                multiline
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Pincode</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={addrZip}
                    onChangeText={setAddrZip}
                    placeholder="Pincode"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={addrCity}
                    onChangeText={setAddrCity}
                    placeholder="City"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.modalInput}
                value={addrState}
                onChangeText={setAddrState}
                placeholder="State"
                placeholderTextColor="#94A3B8"
              />

              {/* Address Type Selection */}
              <Text style={styles.inputLabel}>Address Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typePill, addrType === 'home' && styles.typePillActive]}
                  onPress={() => setAddrType('home')}
                  activeOpacity={0.7}
                >
                  <Home size={14} color={addrType === 'home' ? '#2563EB' : '#64748B'} />
                  <Text style={[styles.typePillText, addrType === 'home' && styles.typePillTextActive]}>
                    Home
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typePill, addrType === 'office' && styles.typePillActive]}
                  onPress={() => setAddrType('office')}
                  activeOpacity={0.7}
                >
                  <Building size={14} color={addrType === 'office' ? '#2563EB' : '#64748B'} />
                  <Text style={[styles.typePillText, addrType === 'office' && styles.typePillTextActive]}>
                    Office
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSaveNewAddress}
              disabled={isSavingAddress}
              activeOpacity={0.8}
            >
              {isSavingAddress ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitText}>Save Delivery Address</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  addressCardDefault: {
    borderColor: '#93C5FD',
    backgroundColor: '#FAFCFF',
  },
  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  addressTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addressTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  streetAddress: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  cityStateZip: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  setDefaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  addFirstBtn: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  typePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 10,
  },
  typePillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  typePillTextActive: {
    color: '#2563EB',
  },
  modalSubmitBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
