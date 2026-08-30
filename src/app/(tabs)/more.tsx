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
  Edit2,
  Package,
  X,
  BellRing,
  Music,
  Radio,
  RefreshCw,
  Sun,
  Moon,
  Smartphone,
} from 'lucide-react-native';
import { useSessionStore } from '../../store/useSessionStore';
import { useStockStore } from '../../store/useStockStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { PincodeSelectorModal } from '../../components/PincodeSelectorModal';
import { AlarmSoundSelectorModal } from '../../components/AlarmSoundSelectorModal';
import { ThemeSelectorModal } from '../../components/ThemeSelectorModal';
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

  const { colors, isDark, themeMode, systemColorScheme } = useAppTheme();

  const [isPincodeModalVisible, setIsPincodeModalVisible] = useState(false);
  const [isSoundModalVisible, setIsSoundModalVisible] = useState(false);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
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

  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleCheckUpdate = async () => {
    if (!UpdatesModule || !UpdatesModule.checkForUpdateAsync) {
      Alert.alert('OTA Updates', 'OTA Updates are active on production preview builds.');
      return;
    }

    try {
      setIsCheckingUpdate(true);
      const update = await UpdatesModule.checkForUpdateAsync();
      if (update.isAvailable) {
        await UpdatesModule.fetchUpdateAsync();
        Alert.alert(
          'Update Ready!',
          'A fresh Amul Flash update has been downloaded. Restart app now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart Now',
              onPress: async () => {
                await UpdatesModule.reloadAsync();
              },
            },
          ]
        );
      } else {
        Alert.alert('Up to Date', 'You are already running the latest Amul Flash build!');
      }
    } catch (err: any) {
      Alert.alert('Update Check', err?.message || 'Could not check for OTA updates right now.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const displayName =
    userProfile?.firstName || userProfile?.lastName
      ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
      : session.userName || (addresses.length > 0 ? addresses[0].fullName : (session.mobile ? `+91 ${session.mobile.replace('+91', '')}` : 'Amul User'));

  const displayPhone = userProfile?.phone || (session.mobile ? (session.mobile.startsWith('+') ? session.mobile : `+91 ${session.mobile}`) : 'Not available');
  const displayEmail = userProfile?.email || 'No email set';

  const handleOpenEditProfile = () => {
    setFirstName(userProfile?.firstName || '');
    setLastName(userProfile?.lastName || '');
    setEmail(userProfile?.email || '');
    setIsEditProfileVisible(true);
  };

  useEffect(() => {
    if (isEditProfileVisible) {
      let fName = userProfile?.firstName || '';
      let lName = userProfile?.lastName || '';
      let mail = userProfile?.email || '';

      if (!fName && displayName && displayName !== 'Amul User') {
        const parts = displayName.split(' ');
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

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account & Profile</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Connected to Amul Store</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingUserData}
            onRefresh={loadUserData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarLetter}>
              {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>
          <View style={styles.userTextCol}>
            <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.userPhone, { color: colors.primary }]}>{displayPhone}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{displayEmail}</Text>
          </View>
          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}
            onPress={handleOpenEditProfile}
            activeOpacity={0.7}
          >
            <Edit2 size={14} color={colors.primary} />
            <Text style={[styles.editProfileText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.groupHeading, { color: colors.textSecondary }]}>MY AMUL ACTIVITY</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          <TouchableOpacity
            style={[styles.cardRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/orders')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#064E3B' : '#F0FDF4' }]}>
                <Package size={18} color={isDark ? '#34D399' : '#059669'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleBadgeRow}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Orders</Text>
                  {orders.length > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' }]}>
                      <Text style={[styles.countBadgeText, { color: isDark ? '#34D399' : '#15803D' }]}>
                        {orders.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {orders.length > 0
                    ? `${orders.length} past orders • Track courier shipments`
                    : 'View past orders and tracking status'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/addresses')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                <MapPin size={18} color={isDark ? '#FBBF24' : '#D97706'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleBadgeRow}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Addresses</Text>
                  {addresses.length > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                      <Text style={[styles.countBadgeText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                        {addresses.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {addresses.length > 0
                    ? `${addresses.length} saved addresses • Manage delivery locations`
                    : 'Manage saved delivery addresses'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.groupHeading, { color: colors.textSecondary }]}>APP PREFERENCES</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          <TouchableOpacity
            style={[styles.cardRow, { borderBottomColor: colors.border }]}
            onPress={() => setIsThemeModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#26193C' : '#F3E8FF' }]}>
                {themeMode === 'dark' ? (
                  <Moon size={18} color="#8B5CF6" />
                ) : themeMode === 'light' ? (
                  <Sun size={18} color="#8B5CF6" />
                ) : (
                  <Smartphone size={18} color="#8B5CF6" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Theme</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {themeMode === 'system'
                    ? `System Default (${systemColorScheme === 'dark' ? 'Dark' : 'Light'})`
                    : themeMode === 'dark'
                    ? 'Dark Mode'
                    : 'Light Mode'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={[
                  styles.themeTag,
                  {
                    backgroundColor: isDark ? '#26193C' : '#F3E8FF',
                    borderColor: isDark ? '#4C1D95' : '#DDD6FE',
                  },
                ]}
              >
                <Text style={[styles.themeTagText, { color: '#8B5CF6' }]}>
                  {themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardRow, { borderBottomColor: colors.border }]}
            onPress={() => setIsPincodeModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#0C2A3E' : '#E0F2FE' }]}>
                <MapPin size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Tracked Pincodes</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {selectedPincode?.pincode ? `${selectedPincode.pincode} • ${selectedPincode.label}` : 'Select Tracked Pincode'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#3B0E1B' : '#FFE4E6' }]}>
                <Zap size={18} color="#E11D48" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>High Priority Alarm</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Full-screen alert with continuous sound & quick buy</Text>
              </View>
            </View>
            <Switch
              value={alarmOverlayEnabled}
              onValueChange={setAlarmOverlayEnabled}
              trackColor={{ false: isDark ? '#2A2A2A' : '#E2E8F0', true: isDark ? '#1D4ED8' : '#BFDBFE' }}
              thumbColor={alarmOverlayEnabled ? colors.primary : (isDark ? '#525252' : '#94A3B8')}
            />
          </View>

          <TouchableOpacity
            style={[styles.cardRow, { borderBottomColor: colors.border }]}
            onPress={() => setIsSoundModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#1E183B' : '#EDE9FE' }]}>
                <Music size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Custom Notification Sound</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{currentSound.name} ({currentSound.category})</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Test Delayed Restock button (Uncomment to test notification & sound countdown)
          <TouchableOpacity
            style={[styles.cardRow, { borderBottomColor: colors.border }]}
            onPress={startCountdownTest}
            disabled={isSimulatingDrop || countdownSeconds !== null}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#431407' : '#FFF7ED' }]}>
                <Radio size={18} color={isDark ? '#FB923C' : '#EA580C'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FB923C' : '#C2410C', fontWeight: '800' }]}>
                  {countdownSeconds !== null
                    ? `Triggering in ${countdownSeconds}s...`
                    : 'Test Delayed Restock (5s delay)'}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {countdownSeconds !== null
                    ? 'Lock phone or stay in-app to test restock alarm overlay'
                    : 'Lock phone or minimize app now to test notification & sound'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={isDark ? '#FB923C' : '#EA580C'} />
          </TouchableOpacity>
          */}

          <TouchableOpacity
            style={[styles.cardRow, { borderBottomWidth: 0 }]}
            onPress={handleCheckUpdate}
            disabled={isCheckingUpdate}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#042F2E' : '#CCFBF1' }]}>
                <RefreshCw size={18} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text, fontWeight: '700' }]}>
                  {isCheckingUpdate ? 'Checking for update...' : 'Check for App Update'}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  Download latest restock radar updates instantly
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
              borderColor: isDark ? '#7F1D1D' : '#FECACA',
            },
          ]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={isDark ? '#F87171' : '#DC2626'} />
          <Text style={[styles.logoutButtonText, { color: isDark ? '#F87171' : '#DC2626' }]}>
            Sign Out of Amul Account
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <PincodeSelectorModal
        visible={isPincodeModalVisible}
        onClose={() => setIsPincodeModalVisible(false)}
      />

      <AlarmSoundSelectorModal
        visible={isSoundModalVisible}
        onClose={() => setIsSoundModalVisible(false)}
      />

      <ThemeSelectorModal
        visible={isThemeModalVisible}
        onClose={() => setIsThemeModalVisible(false)}
      />

      <Modal visible={isEditProfileVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Amul Profile</Text>
              <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FIRST NAME</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceContainer, borderColor: colors.border, color: colors.text }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LAST NAME</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceContainer, borderColor: colors.border, color: colors.text }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceContainer, borderColor: colors.border, color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email Address"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
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

      <Modal visible={countdownSeconds !== null} transparent animationType="fade">
        <View style={styles.countdownBackdrop}>
          <View style={[styles.countdownCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.countdownCircle, { backgroundColor: colors.surfaceContainer, borderColor: colors.primary }]}>
              <Text style={[styles.countdownNumber, { color: colors.primary }]}>{countdownSeconds}</Text>
            </View>
            <Text style={[styles.countdownTitle, { color: colors.text }]}>Lock Phone or Minimize NOW!</Text>
            <Text style={[styles.countdownDesc, { color: colors.textSecondary }]}>
              Restock notification will fire in {countdownSeconds}s with your chosen sound & vibration.
            </Text>
            <TouchableOpacity
              style={[styles.countdownCancelBtn, { backgroundColor: colors.surfaceContainer }]}
              onPress={() => setCountdownSeconds(null)}
              activeOpacity={0.8}
            >
              <Text style={[styles.countdownCancelText, { color: colors.textSecondary }]}>Cancel Test</Text>
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
  themeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
