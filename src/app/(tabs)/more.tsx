import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { AppTextInput as TextInput } from '../../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  MapPin,
  Zap,
  LogOut,
  ChevronRight,
  Smartphone,
  Edit2,
  Package,
  X,
  BellRing,
  Music,
  Radio,
  RefreshCw,
} from 'lucide-react-native';
import { useSessionStore } from '../../store/useSessionStore';
import { useStockStore } from '../../store/useStockStore';
import { PincodeSelectorModal } from '../../components/PincodeSelectorModal';
import { AlarmSoundSelectorModal } from '../../components/AlarmSoundSelectorModal';
import { LOCAL_ALARM_SOUNDS } from '../../constants/alarmSounds';

let UpdatesModule: any = null;
try {
  UpdatesModule = require('expo-updates');
} catch (_e) {
  UpdatesModule = null;
}

export default function AccountScreen() {
  const router = useRouter();
  const {
    session,
    userProfile,
    addresses,
    orders,
    isLoadingUserData,
    heartbeatEnabled,
    setHeartbeatEnabled,
    smsRetrieverEnabled,
    setSmsRetrieverEnabled,
    updateUserProfile,
    loadUserData,
    logout,
  } = useSessionStore();

  const {
    selectedPincode,
    selectedAlarmSoundId,
    alarmOverlayEnabled,
    setAlarmOverlayEnabled,
    triggerSimulatedDrop,
    triggerDelayedDropTest,
    isSimulatingDrop,
  } = useStockStore();

  const [isPincodeModalVisible, setIsPincodeModalVisible] = useState(false);
  const [isSoundModalVisible, setIsSoundModalVisible] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const startCountdownTest = async () => {
    setCountdownSeconds(5);
    await triggerDelayedDropTest(5);
  };

  useEffect(() => {
    if (countdownSeconds === null) return;
    if (countdownSeconds === 0) {
      setCountdownSeconds(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdownSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdownSeconds]);

  const currentSound =
    LOCAL_ALARM_SOUNDS.find((s) => s.id === selectedAlarmSoundId) || LOCAL_ALARM_SOUNDS[0];

  // Profile Edit Modal State
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleCheckUpdate = async () => {
    try {
      setIsCheckingUpdate(true);
      if (!UpdatesModule || !UpdatesModule.isEnabled) {
        Alert.alert(
          'EAS Update Status',
          'You are running version 1.0.0 on channel preview.'
        );
        return;
      }
      const update = await UpdatesModule.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert('Update Available', 'Downloading the latest restock update in background...');
        await UpdatesModule.fetchUpdateAsync();
        Alert.alert('Update Ready', 'Restart app to apply latest update immediately?', [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart Now', onPress: () => UpdatesModule.reloadAsync() },
        ]);
      } else {
        const id = UpdatesModule.updateId ? UpdatesModule.updateId.slice(0, 8) : '174a3e6';
        Alert.alert('App Up to Date', `You are running the newest build (${id}).`);
      }
    } catch (e: any) {
      Alert.alert('Update Info', e?.message || 'Up to date with latest commit.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const displayName = userProfile && (userProfile.firstName || userProfile.lastName)
    ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
    : session.userName || (addresses.length > 0 ? addresses[0].fullName : (session.mobile ? `+91 ${session.mobile.replace('+91', '')}` : 'Amul User'));
  const displayEmail = userProfile?.email || '';
  const displayPhone = userProfile?.phone || (session.mobile ? (session.mobile.startsWith('+') ? session.mobile : `+91 ${session.mobile}`) : 'Not available');

  useEffect(() => {
    console.log('--------------------------------------------------');
    console.log('🔍 [AccountScreen DEBUG] userProfile:', JSON.stringify(userProfile, null, 2));
    console.log('🔍 [AccountScreen DEBUG] session:', JSON.stringify(session, null, 2));
    console.log('🔍 [AccountScreen DEBUG] addresses count:', addresses.length);
    if (addresses.length > 0) {
      console.log('🔍 [AccountScreen DEBUG] first address:', JSON.stringify(addresses[0], null, 2));
    }
    console.log('--------------------------------------------------');
  }, [userProfile, session, addresses]);

  const handleOpenEditProfile = () => {
    console.log('👉 [handleOpenEditProfile CLICKED]');
    console.log('👉 Current userProfile:', userProfile);
    console.log('👉 Current displayName:', displayName);

    let fName = userProfile?.firstName || '';
    let lName = userProfile?.lastName || '';
    let mail = userProfile?.email || '';

    // Directly populate from the outside displayed name if profile fields are split-empty
    if (!fName && displayName) {
      const parts = displayName.trim().split(' ');
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }

    console.log(`👉 Populating Modal State -> firstName: "${fName}", lastName: "${lName}", email: "${mail}"`);

    setFirstName(fName);
    setLastName(lName);
    setEmail(mail);
    setIsEditProfileVisible(true);
  };

  useEffect(() => {
    if (isEditProfileVisible) {
      let fName = userProfile?.firstName || '';
      let lName = userProfile?.lastName || '';
      let mail = userProfile?.email || '';

      if (!fName && displayName) {
        const parts = displayName.trim().split(' ');
        fName = parts[0] || '';
        lName = parts.slice(1).join(' ') || '';
      }

      setFirstName(fName);
      setLastName(lName);
      setEmail(mail);
    }
  }, [isEditProfileVisible, userProfile, displayName]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    await updateUserProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
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

  // Auto-fetch fresh profile and user data from Amul cloud on screen focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Profile</Text>
        <Text style={styles.headerSub}>Connected to Amul Store</Text>
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
            <Text style={styles.avatarLetter}>
              {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>
          <View style={styles.userTextCol}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userPhone}>{displayPhone}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={handleOpenEditProfile}
            activeOpacity={0.7}
          >
            <Edit2 size={14} color="#2563EB" />
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: My Amul Orders */}
        <Text style={styles.groupHeading}>MY AMUL ACTIVITY</Text>
        <View style={styles.cardGroup}>

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
                  {selectedPincode?.pincode ? `${selectedPincode.pincode} • ${selectedPincode.label}` : 'Select Delivery Hub'}
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
                <Text style={styles.rowSub}>Maintains active Amul session cookies</Text>
              </View>
            </View>
            <Switch
              value={heartbeatEnabled}
              onValueChange={setHeartbeatEnabled}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={heartbeatEnabled ? '#2563EB' : '#94A3B8'}
            />
          </View>

          {/* SMS Retriever Switch */}
          <View style={styles.switchRow}>
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
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={smsRetrieverEnabled ? '#2563EB' : '#94A3B8'}
            />
          </View>

          {/* In-App Stock Drop Alarm Overlay Switch */}
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                <Zap size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>In-App Restock Alarm</Text>
                <Text style={styles.rowSub}>Full-screen alert with continuous sound & quick buy</Text>
              </View>
            </View>
            <Switch
              value={alarmOverlayEnabled}
              onValueChange={setAlarmOverlayEnabled}
              trackColor={{ false: '#E2E8F0', true: '#FECACA' }}
              thumbColor={alarmOverlayEnabled ? '#EF4444' : '#94A3B8'}
            />
          </View>

          {/* Restock Sound & Ringtone Picker */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setIsSoundModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <Music size={18} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Restock Alert Tone</Text>
                <Text style={styles.rowSub}>{currentSound.name} ({currentSound.category})</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Tap to test live restock notification */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={async () => {
              await triggerSimulatedDrop();
            }}
            disabled={isSimulatingDrop}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <BellRing size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: '#1D4ED8', fontWeight: '800' }]}>
                  Test Restock Notification
                </Text>
                <Text style={styles.rowSub}>
                  {isSimulatingDrop ? 'Sending test notification...' : 'Sends high-priority restock alert banner with sound & vibration'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#2563EB" />
          </TouchableOpacity>

          {/* Test Delayed Restock (5s delay) */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={startCountdownTest}
            disabled={isSimulatingDrop || countdownSeconds !== null}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <Radio size={18} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: '#C2410C', fontWeight: '800' }]}>
                  Test Delayed Restock (5s delay)
                </Text>
                <Text style={styles.rowSub}>
                  Lock phone or minimize app now to test notification & sound
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#EA580C" />
          </TouchableOpacity>

          {/* Check for Live OTA Updates */}
          <TouchableOpacity
            style={[styles.cardRow, { borderBottomWidth: 0 }]}
            onPress={handleCheckUpdate}
            disabled={isCheckingUpdate}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <RefreshCw size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: '#15803D', fontWeight: '800' }]}>
                  {isCheckingUpdate ? 'Checking for updates...' : 'Check for Live OTA Updates'}
                </Text>
                <Text style={styles.rowSub}>
                  Download latest restock radar updates instantly
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#16A34A" />
          </TouchableOpacity>
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

      {/* Alarm Sound Picker Modal */}
      <AlarmSoundSelectorModal
        visible={isSoundModalVisible}
        onClose={() => setIsSoundModalVisible(false)}
      />

      {/* Edit Profile Modal */}
      <Modal visible={isEditProfileVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Amul Profile</Text>
              <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>FIRST NAME</Text>
            <TextInput
              style={styles.modalInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>LAST NAME</Text>
            <TextInput
              style={styles.modalInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.modalInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Email Address"
              placeholderTextColor="#94A3B8"
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
        </KeyboardAvoidingView>
      </Modal>

      {/* 5-Second Test Countdown Modal */}
      <Modal visible={countdownSeconds !== null} transparent animationType="fade">
        <View style={styles.countdownBackdrop}>
          <View style={styles.countdownCard}>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumber}>{countdownSeconds}</Text>
            </View>
            <Text style={styles.countdownTitle}>Lock Phone or Minimize NOW!</Text>
            <Text style={styles.countdownDesc}>
              Restock notification will fire in {countdownSeconds}s with your chosen sound & vibration.
            </Text>
            <TouchableOpacity
              style={styles.countdownCancelBtn}
              onPress={() => setCountdownSeconds(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.countdownCancelText}>Cancel Test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  countdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  countdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  countdownCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EFF6FF',
    borderWidth: 4,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1D4ED8',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  countdownTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  countdownCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  countdownCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 46,
    marginBottom: 10,
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
