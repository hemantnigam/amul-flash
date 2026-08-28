import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin,
  ShieldCheck,
  Zap,
  LogOut,
  ChevronRight,
  Sparkles,
  Smartphone,
  Edit2,
  Plus,
  Trash2,
  Package,
  CheckCircle2,
  Truck,
  ShoppingCart,
  User,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react-native';
import { useSessionStore } from '../../store/useSessionStore';
import { useStockStore } from '../../store/useStockStore';
import { PincodeSelectorModal } from '../../components/PincodeSelectorModal';
import { AmulCheckoutModal } from '../../components/AmulCheckoutModal';
import { AmulUserAddress, AmulProduct } from '../../types/amul';
import { INITIAL_PRODUCTS } from '../../constants/products';

export default function AccountScreen() {
  const router = useRouter();
  const {
    session,
    userProfile,
    addresses,
    orders,
    cart,
    isLoadingUserData,
    heartbeatEnabled,
    setHeartbeatEnabled,
    smsRetrieverEnabled,
    setSmsRetrieverEnabled,
    updateUserProfile,
    loadUserData,
    logout,
  } = useSessionStore();

  const { selectedPincode } = useStockStore();

  const [isPincodeModalVisible, setIsPincodeModalVisible] = useState(false);

  // Profile Edit Modal State
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [firstName, setFirstName] = useState(userProfile?.firstName || 'Hemant');
  const [lastName, setLastName] = useState(userProfile?.lastName || 'Nigam');
  const [email, setEmail] = useState(userProfile?.email || 'h.nigam654@gmail.com');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    await updateUserProfile({
      first_name: firstName,
      last_name: lastName,
      email: email,
    });
    setIsSavingProfile(false);
    setIsEditProfileVisible(false);
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to sign out of your Amul session?');
      if (confirmed) {
        await logout();
        router.replace('/login');
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out of your Amul session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  // Auto-fetch fresh cart and profile data from Amul cloud on screen focus
  useEffect(() => {
    if (session.isLoggedIn) {
      loadUserData();
    }
  }, [session.isLoggedIn]);

  const displayName = userProfile
    ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
    : session.userName || 'Hemant Nigam';
  const displayEmail = userProfile?.email || 'h.nigam654@gmail.com';
  const displayPhone = userProfile?.phone || session.mobile || '+919899940268';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Profile</Text>
        <Text style={styles.headerSub}>Connected to Amul D2C Cloud & Fulfillment Hub</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingUserData}
            onRefresh={loadUserData}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      >
        {/* User Profile Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase() || 'H'}</Text>
          </View>
          <View style={styles.userTextCol}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userPhone}>{displayPhone}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => {
              setFirstName(userProfile?.firstName || 'Hemant');
              setLastName(userProfile?.lastName || 'Nigam');
              setEmail(userProfile?.email || 'h.nigam654@gmail.com');
              setIsEditProfileVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Edit2 size={14} color="#2563EB" />
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: My Amul Shopping (Cart & Orders) */}
        <Text style={styles.groupHeading}>MY AMUL SHOPPING</Text>
        <View style={styles.cardGroup}>
          {/* Cart Navigation Option */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => router.push('/cart')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <ShoppingCart size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.rowTitle}>Cart</Text>
                  {cart && (cart.itemsCount || cart.items.length) > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {cart.itemsCount || cart.items.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rowSub}>
                  {cart && cart.items.length > 0
                    ? `${cart.itemsCount || cart.items.length} items reserved • ₹${cart.total}`
                    : 'View and manage items in your cart'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Orders Navigation Option */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => router.push('/orders')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Package size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.rowTitle}>Orders</Text>
                  {orders.length > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.countBadgeText, { color: '#15803D' }]}>
                        {orders.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rowSub}>
                  {orders.length > 0
                    ? `${orders.length} past orders • Track courier shipments`
                    : 'View past orders and tracking status'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Addresses Navigation Option */}
          <TouchableOpacity
            style={[styles.cardRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/addresses')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <MapPin size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.rowTitle}>Addresses</Text>
                  {addresses.length > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.countBadgeText, { color: '#B45309' }]}>
                        {addresses.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rowSub}>
                  {addresses.length > 0
                    ? `${addresses.length} saved addresses • Manage delivery locations`
                    : 'Manage saved delivery addresses'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Section 3: Delivery Pincode & Radar */}
        <Text style={styles.groupHeading}>RADAR & AUTOMATION</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setIsPincodeModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <MapPin size={18} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Radar Delivery Hub</Text>
                <Text style={styles.rowSub}>
                  {selectedPincode.pincode} • {selectedPincode.label}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Heartbeat Switch */}
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Zap size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Auto Session Keeper</Text>
                <Text style={styles.rowSub}>Maintains active Amul D2C checkout cookies</Text>
              </View>
            </View>
            <Switch
              value={heartbeatEnabled}
              onValueChange={setHeartbeatEnabled}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
            />
          </View>

          {/* SMS Retriever Switch */}
          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <Smartphone size={18} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Instant SMS Auto-Fill</Text>
                <Text style={styles.rowSub}>&lt;500ms drop OTP authentication</Text>
              </View>
            </View>
            <Switch
              value={smsRetrieverEnabled}
              onValueChange={setSmsRetrieverEnabled}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Sign Out of Amul Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Pincode Modal */}
      <PincodeSelectorModal
        visible={isPincodeModalVisible}
        onClose={() => setIsPincodeModalVisible(false)}
      />

      {/* Edit Profile Modal */}
      <Modal visible={isEditProfileVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Amul Profile</Text>
              <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.modalInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
            />

            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.modalInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
              activeOpacity={0.8}
            >
              {isSavingProfile ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitText}>Save Changes</Text>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  userTextCol: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userPhone: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  addAddressText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  addressesList: {
    gap: 10,
    marginBottom: 16,
  },
  emptyAddressCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressCardDefault: {
    borderColor: '#93C5FD',
    backgroundColor: '#FAFCFF',
  },
  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressTypePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addressTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  deleteAddrBtn: {
    marginLeft: 'auto',
  },
  addrFullName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  addrText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  addrCity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  addrPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  setDefaultBtn: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  setDefaultText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  ordersList: {
    gap: 10,
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  orderItemQty: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  orderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  courierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  courierText: {
    fontSize: 11,
    color: '#64748B',
  },
  orderTotalText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 440,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 10,
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
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: '#2563EB',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  modalSubmitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
