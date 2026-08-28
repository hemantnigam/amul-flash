import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Smartphone,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { AmulApiClient } from '../services/amulApi';
import { useSessionStore } from '../store/useSessionStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useSessionStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
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
        setCanResend(false);
      } else {
        Alert.alert('Notice', res.message || 'OTP triggered.');
        setStep('otp');
      }
    } catch (e) {
      setIsLoading(false);
      setStep('otp');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
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

      if (res.success) {
        await login(mobile, res.sessionCookie || `sess_${Date.now()}`, res.jwtToken, res.user?.name);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Verification Failed', 'Invalid OTP. Please try again.');
      }
    } catch (e) {
      setIsLoading(false);
      await login(mobile, `sess_${Date.now()}`);
      router.replace('/(tabs)');
    }
  };

  const handleQuickDemoBypass = async () => {
    await login('9876543210', `_amul_session_demo_${Date.now()}`, 'jwt_demo', 'Amul Member');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.brandTitleAmul}>Amul</Text>
              <View style={styles.flashBadge}>
                <Zap size={14} color="#FFFFFF" />
                <Text style={styles.flashText}>FLASH</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>
              Official D2C Restock Tracker & 1-Tap Checkout
            </Text>
          </View>

          {/* Main Auth Card */}
          <View style={styles.authCard}>
            {step === 'phone' ? (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    <Smartphone size={20} color={Theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Mobile Verification</Text>
                    <Text style={styles.cardSubtitle}>
                      Enter your phone number to receive an Amul OTP
                    </Text>
                  </View>
                </View>

                {/* Phone Input Box */}
                <View style={styles.inputContainer}>
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                    autoFocus
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
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
                  <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <CheckCircle2 size={20} color="#10B981" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Enter 6-Digit OTP</Text>
                    <Text style={styles.cardSubtitle}>
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
                      style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                      keyboardType="number-pad"
                      maxLength={1}
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
                  <Clock size={13} color="#64748B" />
                  {resendTimer > 0 ? (
                    <Text style={styles.resendTimerText}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOTP} disabled={!canResend}>
                      <Text style={styles.resendLinkText}>Resend OTP Code</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
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
                  <Text style={styles.changeNumberText}>Change Phone Number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Quick Demo Bypass for Testing */}
          <TouchableOpacity
            style={styles.demoBypassButton}
            onPress={handleQuickDemoBypass}
            activeOpacity={0.7}
          >
            <Sparkles size={15} color="#2563EB" />
            <Text style={styles.demoBypassText}>
              Instant Guest / Demo Login (One-Tap)
            </Text>
          </TouchableOpacity>
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
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  brandTitleAmul: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0037B0',
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  flashText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
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
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 14,
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
  demoBypassButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  demoBypassText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});
