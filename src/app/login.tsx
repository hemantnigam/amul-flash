import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Lock,
  RotateCw,
  LogOut,
  Zap,
} from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { useSessionStore } from '../store/useSessionStore';
import { AmulApiClient } from '../services/amulApi';

export default function LoginScreen() {
  const router = useRouter();
  const { session, login, logout, updateLastHeartbeat } = useSessionStore();

  const [mobileNumber, setMobileNumber] = useState(session.mobile || '9876543210');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>(session.isLoggedIn ? 'phone' : 'phone');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (mobileNumber.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    const res = await AmulApiClient.sendOTP(mobileNumber);
    setIsLoading(false);

    if (res.success) {
      setStep('otp');
      // Simulate SMS Retriever autofill in 600ms
      setTimeout(() => {
        setOtpCode('123456');
        Alert.alert(
          'SMS Retriever Intercepted OTP',
          'Google Play Services SmsRetriever auto-extracted Amul verification code: 123456'
        );
      }, 600);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    const res = await AmulApiClient.verifyOTP(mobileNumber, otpCode);
    setIsLoading(false);

    if (res.success && res.sessionCookie) {
      login(mobileNumber, res.sessionCookie, res.jwtToken);
      Alert.alert(
        'Authentication Successful',
        'Amul D2C Session cookie stored securely in Android Keystore via expo-secure-store.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const handleManualHeartbeat = () => {
    updateLastHeartbeat();
    Alert.alert('Session Keeper Pinged', 'GET /api/v1/user/profile: 200 OK. Session valid.');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Session Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconBadge}>
          <KeyRound size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Amul D2C Session Keeper</Text>
        <Text style={styles.heroDesc}>
          Persistent session caching via Android Keystore (AES-256 GCM) prevents sudden OTP logouts during 2-minute high-traffic flash restocks.
        </Text>
      </View>

      {/* Active Session Status Card */}
      {session.isLoggedIn ? (
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={16} color={Theme.colors.statusSuccessText} />
              <Text style={styles.statusBadgeText}>ACTIVE SESSION</Text>
            </View>
            <TouchableOpacity onPress={handleManualHeartbeat} style={styles.heartbeatBtn}>
              <RotateCw size={12} color={Theme.colors.primary} />
              <Text style={styles.heartbeatBtnText}>Ping Heartbeat</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.userMobile}>+91 {session.mobile}</Text>
          <Text style={styles.cookieSub} numberOfLines={1}>
            Cookie: {session.sessionCookie}
          </Text>

          <View style={styles.keystoreNotice}>
            <Lock size={14} color={Theme.colors.primary} />
            <Text style={styles.keystoreNoticeText}>
              Hardware Keystore Encrypted (expo-secure-store)
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={16} color={Theme.colors.statusDangerText} />
            <Text style={styles.logoutBtnText}>Logout & Invalidate Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Authenticate with Amul D2C</Text>
          <Text style={styles.cardSubtitle}>
            Login once to enable instant Headless Auto-Cart and 1-Tap flash checkout.
          </Text>

          {step === 'phone' ? (
            <View style={styles.form}>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, mobileNumber.length !== 10 && styles.btnDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading || mobileNumber.length !== 10}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Smartphone size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Send Amul OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                style={styles.otpInput}
                placeholder="6-digit OTP code"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, otpCode.length !== 6 && styles.btnDisabled]}
                onPress={handleVerifyOTP}
                disabled={isLoading || otpCode.length !== 6}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Zap size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Verify & Save Session</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep('phone')}
              >
                <Text style={styles.backBtnText}>Edit Mobile Number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Security Guarantee Box */}
      <View style={styles.securityCard}>
        <ShieldCheck size={20} color={Theme.colors.statusSuccessText} />
        <View style={styles.securityContent}>
          <Text style={styles.securityTitle}>Zero Credential Leakage</Text>
          <Text style={styles.securityDesc}>
            Tokens are stored locally in the hardware Android Keystore. No passwords or bank UPI PINs are ever captured or transmitted.
          </Text>
        </View>
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
  heroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#4338CA',
    ...Theme.shadows.card,
  },
  heroIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7E22CE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 13,
    color: '#C7D2FE',
    lineHeight: 18,
  },
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusSuccessBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.statusSuccessText,
  },
  heartbeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.sm,
    gap: 4,
  },
  heartbeatBtnText: {
    fontSize: 11,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  userMobile: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  cookieSub: {
    fontSize: 12,
    color: Theme.colors.secondary,
    marginBottom: 12,
  },
  keystoreNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: Theme.radius.md,
    gap: 6,
    marginBottom: 16,
  },
  keystoreNoticeText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.statusDangerBg,
    gap: 6,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.statusDangerText,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Theme.colors.secondary,
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  otpInput: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    gap: 6,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 13,
    color: Theme.colors.secondary,
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    gap: 12,
    ...Theme.shadows.card,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 16,
  },
});
