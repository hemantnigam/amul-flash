import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { AppTextInput as TextInput } from '../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { BrandLogoHeader } from '../components/BrandLogoHeader';
import { AmulApiClient } from '../services/amulApi';
import { useSessionStore } from '../store/useSessionStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { analyticsService } from '../services/analyticsService';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useSessionStore();
  const { colors, isDark } = useAppTheme();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  const otpInputs = useRef<(any | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOTP = async () => {
    const cleanNumber = mobile.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AmulApiClient.sendOTP(cleanNumber);
      setIsLoading(false);
      if (res.success) {
        setStep('otp');
        setResendTimer(30);
      } else {
        Alert.alert('Notice', res.message || 'Failed to send OTP. Please try again.');
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert('Error', 'Unable to send OTP. Please check your network connection.');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // If user pastes or autofills a multi-digit OTP (e.g. 6 digits)
    const cleanDigits = value.replace(/\D/g, '');
    if (cleanDigits.length > 1) {
      const newOtp = ['', '', '', '', '', ''];
      for (let i = 0; i < 6 && i < cleanDigits.length; i++) {
        newOtp[i] = cleanDigits[i];
      }
      setOtp(newOtp);
      if (cleanDigits.length === 6) {
        handleVerifyOTP(cleanDigits.substring(0, 6));
      } else {
        const nextIndex = Math.min(cleanDigits.length, 5);
        otpInputs.current[nextIndex]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are typed
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleVerifyOTP = async (customOtp?: string) => {
    const code = customOtp || otp.join('');
    if (code.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the full 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AmulApiClient.verifyOTP(mobile, code);
      setIsLoading(false);

      if (res.success && res.sessionCookie) {
        await login(mobile, res.sessionCookie, res.jwtToken, res.user?.name, res.user?._id);
        analyticsService.logUserLogin(res.user?._id || mobile, mobile);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Verification Failed', 'Invalid OTP code. Please enter the OTP sent by Amul.');
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert('Verification Failed', 'Could not verify OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <BrandLogoHeader size="large" showSubtitle />
          </View>

          {/* Main Auth Card */}
          <View style={[styles.authCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {step === 'phone' ? (
              <>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.surfaceContainer }]}>
                    <Smartphone size={20} color={colors.primary} />
                  </View>
                  <View style={styles.cardHeaderTextCol}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Mobile Verification</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                      Enter your phone number to receive an Amul OTP
                    </Text>
                  </View>
                </View>

                {/* Phone Input Box */}
                <View style={[styles.inputContainer, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                  <View style={[styles.countryCodeBadge, { backgroundColor: colors.surfaceContainerHigh, borderRightColor: colors.border }]}>
                    <Text style={[styles.countryCodeText, { color: colors.text }]}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Enter mobile number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                    autoFocus
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Get OTP Code</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                    <CheckCircle2 size={20} color={isDark ? '#34D399' : '#10B981'} />
                  </View>
                  <View style={styles.cardHeaderTextCol}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Enter 6-Digit OTP</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                      Sent to +91 {mobile}
                    </Text>
                  </View>
                </View>

                {/* 6-Digit OTP Inputs */}
                <View style={styles.otpRow}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        otpInputs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        {
                          backgroundColor: colors.surfaceContainer,
                          borderColor: digit ? colors.primary : colors.border,
                          color: colors.text,
                        },
                      ]}
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      autoComplete="sms-otp"
                      maxLength={index === 0 ? 6 : 1}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, index)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                          otpInputs.current[index - 1]?.focus();
                        }
                      }}
                    />
                  ))}
                </View>

                {/* Resend Timer */}
                <View style={styles.resendRow}>
                  <Clock size={13} color={colors.textSecondary} />
                  {resendTimer > 0 ? (
                    <Text style={[styles.resendTimerText, { color: colors.textSecondary }]}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={async () => {
                        setResendTimer(30);
                        await handleSendOTP();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.resendLinkText, { color: colors.primary }]}>Resend OTP Code</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
                  onPress={() => handleVerifyOTP()}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.changeNumberButton}
                  onPress={() => {
                    setStep('phone');
                    setOtp(['', '', '', '', '', '']);
                  }}
                >
                  <Text style={[styles.changeNumberText, { color: colors.primary }]}>Change Phone Number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  brandTitleAmul: {
    fontSize: 36,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    color: '#0037B0',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  flashText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  cardHeaderTextCol: {
    flex: 1,
    flexShrink: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
    flexWrap: 'wrap',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  countryCodeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  otpInput: {
    width: 38,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  otpInputFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  resendTimerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  resendLinkText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  testHintBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  changeNumberButton: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 6,
  },
  changeNumberText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
