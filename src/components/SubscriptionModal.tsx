import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Alert,
  PanResponder,
  Animated,
} from 'react-native';
import { AppText as Text } from './AppText';
import * as WebBrowser from 'expo-web-browser';
import {
  X,
  Zap,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BarChart2,
  MapPin,
  Bell,
  ArrowRight,
  Check,
  RefreshCw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore, RAZORPAY_PAYMENT_LINKS } from '../store/useSubscriptionStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { LegalDisclaimer } from './LegalDisclaimer';

export const SubscriptionModal: React.FC = () => {
  const router = useRouter();
  const {
    isPaywallVisible,
    paywallReason,
    closePaywall,
    verifySubscriptionStatus,
    isVipActive,
    isTrial,
    daysRemaining,
    isExpiringSoon,
    openPaymentDetails,
  } = useSubscriptionStore();
  const { session, userProfile } = useSessionStore();
  const { colors, isDark } = useAppTheme();

  const [selectedPlan, setSelectedPlan] = useState<'1_week_pass' | '1_month_pass'>('1_month_pass');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isCheckingManual, setIsCheckingManual] = useState<boolean>(false);
  const [pendingVerification, setPendingVerification] = useState<boolean>(false);
  const [verificationStatusText, setVerificationStatusText] = useState<string>('');

  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (isPaywallVisible) {
      translateY.setValue(400);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }
  }, [isPaywallVisible, translateY]);

  const handleDismiss = () => {
    if (isSuccess) {
      handleDone();
    } else {
      closePaywall();
    }
  };

  const closeWithSlideDown = () => {
    Animated.timing(translateY, {
      toValue: 600,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      handleDismiss();
    });
  };

  const resetPosition = () => {
    Animated.spring(translateY, {
      toValue: 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || (gestureState.dy > 30 && gestureState.vy > 0.4)) {
          closeWithSlideDown();
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        resetPosition();
      },
    })
  ).current;

  const handlePay = async () => {
    setIsProcessing(true);
    setPendingVerification(false);
    setVerificationStatusText('Opening secure payment...');

    // Open exact Razorpay link without appending query parameters as requested
    const paymentUrl = RAZORPAY_PAYMENT_LINKS[selectedPlan];
    const mobile = session.mobile || userProfile?.phone || '';

    try {
      // 1. Open Razorpay in in-app browser
      await WebBrowser.openBrowserAsync(paymentUrl);

      // 2. Returned from browser: Poll Supabase for webhook activation
      setVerificationStatusText('Verifying payment with bank & Razorpay...');

      let isVerified = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (mobile) {
          const isVip = await verifySubscriptionStatus(mobile);
          if (isVip) {
            isVerified = true;
            break;
          }
        }
      }

      setIsProcessing(false);
      if (isVerified) {
        setIsSuccess(true);
        setPendingVerification(false);
      } else {
        setPendingVerification(true);
        setVerificationStatusText('');
      }
    } catch (err) {
      console.log('Payment error:', err);
      setIsProcessing(false);
      setPendingVerification(true);
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingManual(true);
    const mobile = session.mobile || userProfile?.phone || '';
    if (mobile) {
      const isVip = await verifySubscriptionStatus(mobile);
      setIsCheckingManual(false);
      if (isVip) {
        setIsSuccess(true);
        setPendingVerification(false);
      } else {
        Alert.alert(
          'Verification Pending',
          'Payment is being processed by the bank. If money was debited, please wait a few seconds and tap "Check Payment Status" again.',
          [{ text: 'OK' }]
        );
      }
    } else {
      setIsCheckingManual(false);
    }
  };

  const handleDone = () => {
    setIsSuccess(false);
    setPendingVerification(false);
    closePaywall();
    router.push('/(tabs)/more' as any);
  };

  return (
    <Modal
      visible={isPaywallVisible}
      transparent
      animationType="fade"
      onRequestClose={closeWithSlideDown}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <TouchableWithoutFeedback onPress={closeWithSlideDown}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Draggable Header Section */}
          <View {...panResponder.panHandlers} style={styles.dragHeaderWrapper}>
            {/* Grab Handle Pill */}
            <View style={styles.dragHandleArea}>
              <View
                style={[
                  styles.dragHandlePill,
                  { backgroundColor: isDark ? '#52525B' : '#CBD5E1' },
                ]}
              />
            </View>

            {/* Top Grab Bar & Close */}
            <View style={styles.topRow}>
              <View style={styles.headerTag}>
                <Zap size={14} color="#F59E0B" />
                <Text style={styles.headerTagText}>PROTEINRADAR VIP PASS</Text>
              </View>
              <TouchableOpacity
                onPress={closeWithSlideDown}
                style={[styles.closeBtn, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {isSuccess ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <CheckCircle2 size={44} color="#10B981" />
                </View>
                <Text style={[styles.successCongrats, { color: colors.primary }]}>Congratulations! 🎉</Text>
                <Text style={[styles.successTitle, { color: colors.text }]}>VIP Membership Activated</Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                  Thank you for subscribing! Your account now has full priority access to all flash restock tools.
                </Text>

                {/* Plan Receipt Card */}
                <View
                  style={[
                    styles.receiptCard,
                    {
                      backgroundColor: isDark ? '#18181B' : '#F8FAFC',
                      borderColor: '#10B981',
                    },
                  ]}
                >
                  <View style={styles.receiptTopRow}>
                    <View>
                      <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>PURCHASED PASS</Text>
                      <Text style={[styles.receiptPlanName, { color: colors.text }]}>
                        {selectedPlan === '1_month_pass' ? '1-Month VIP Pass' : '1-Week VIP Pass'}
                      </Text>
                    </View>
                    <View style={styles.receiptActiveBadge}>
                      <View style={styles.receiptActiveDot} />
                      <Text style={styles.receiptActiveText}>ACTIVE</Text>
                    </View>
                  </View>

                  <View style={[styles.receiptDivider, { borderTopColor: colors.border }]} />

                  {/* Highlights */}
                  <View style={styles.receiptBenefitsList}>
                    <View style={styles.receiptBenefitRow}>
                      <Check size={14} color="#10B981" />
                      <Text style={[styles.receiptBenefitText, { color: colors.text }]}>
                        Unlimited Product Tracking
                      </Text>
                    </View>
                    <View style={styles.receiptBenefitRow}>
                      <Check size={14} color="#10B981" />
                      <Text style={[styles.receiptBenefitText, { color: colors.text }]}>
                        Multi-Pincode Delivery Hub Alerts
                      </Text>
                    </View>
                    <View style={styles.receiptBenefitRow}>
                      <Check size={14} color="#10B981" />
                      <Text style={[styles.receiptBenefitText, { color: colors.text }]}>
                        Instant Restock Siren Notifications
                      </Text>
                    </View>
                    <View style={styles.receiptBenefitRow}>
                      <Check size={14} color="#10B981" />
                      <Text style={[styles.receiptBenefitText, { color: colors.text }]}>
                        Full Drop Intelligence & 24h Histograms
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Done Button */}
                <TouchableOpacity
                  style={[styles.doneButton, { backgroundColor: colors.primary }]}
                  onPress={handleDone}
                  activeOpacity={0.88}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Main Heading */}
                <Text style={[styles.mainTitle, { color: colors.text }]}>
                  Never Miss a 60-Second Flash Drop
                </Text>

                {paywallReason ? (
                  <View
                    style={[
                      styles.reasonBox,
                      {
                        backgroundColor: isDark ? '#26193C' : '#F3E8FF',
                        borderColor: isDark ? '#4C1D95' : '#DDD6FE',
                      },
                    ]}
                  >
                    <Sparkles size={14} color="#8B5CF6" />
                    <Text style={[styles.reasonText, { color: isDark ? '#E9D5FF' : '#6B21A8' }]}>
                      {paywallReason}
                    </Text>
                  </View>
                ) : null}

                {/* Pricing Cards Selection */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CHOOSE YOUR PASS</Text>
                <View style={styles.plansRow}>
                  {/* 1-Month Pass (Most Popular) */}
                  <TouchableOpacity
                    style={[
                      styles.planCard,
                      {
                        backgroundColor:
                          selectedPlan === '1_month_pass'
                            ? isDark
                              ? '#1E1B4B'
                              : '#EEF2FF'
                            : colors.surfaceContainer,
                        borderColor:
                          selectedPlan === '1_month_pass'
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPlan('1_month_pass')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>🔥 MOST POPULAR</Text>
                    </View>
                    <Text style={[styles.planDuration, { color: colors.text }]}>1-Month Pass</Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceCurrency, { color: colors.primary }]}>₹</Text>
                      <Text style={[styles.priceAmount, { color: colors.primary }]}>25</Text>
                      <Text style={[styles.priceSub, { color: colors.textSecondary }]}>/ mo</Text>
                    </View>
                    <Text style={[styles.planPerWeek, { color: '#059669' }]}>₹6.25 / week • Best Value</Text>
                  </TouchableOpacity>

                  {/* 1-Week Pass */}
                  <TouchableOpacity
                    style={[
                      styles.planCard,
                      {
                        backgroundColor:
                          selectedPlan === '1_week_pass'
                            ? isDark
                              ? '#1E1B4B'
                              : '#EEF2FF'
                            : colors.surfaceContainer,
                        borderColor:
                          selectedPlan === '1_week_pass'
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPlan('1_week_pass')}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.trialBadge, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]}>
                      <Text style={[styles.trialBadgeText, { color: colors.textSecondary }]}>CYCLE PASS</Text>
                    </View>
                    <Text style={[styles.planDuration, { color: colors.text }]}>1-Week Pass</Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceCurrency, { color: colors.primary }]}>₹</Text>
                      <Text style={[styles.priceAmount, { color: colors.primary }]}>7</Text>
                      <Text style={[styles.priceSub, { color: colors.textSecondary }]}>/ 7 days</Text>
                    </View>
                    <Text style={[styles.planPerWeek, { color: colors.textSecondary }]}>Single restock cycle</Text>
                  </TouchableOpacity>
                </View>

                {/* Feature Gating Comparison Matrix */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>WHAT YOU UNLOCK</Text>
                <View style={[styles.featureMatrix, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                  <View style={[styles.matrixRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.matrixLeft}>
                      <Bell size={15} color={colors.primary} />
                      <Text style={[styles.matrixLabel, { color: colors.text }]} numberOfLines={1}>
                        Tracked Items
                      </Text>
                    </View>
                    <View style={styles.matrixRight}>
                      <Text style={[styles.freeValue, { color: colors.textSecondary }]}>1 Item</Text>
                      <View style={styles.vipTag}>
                        <Text style={styles.vipTagText}>UNLIMITED</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.matrixRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.matrixLeft}>
                      <MapPin size={15} color={colors.primary} />
                      <Text style={[styles.matrixLabel, { color: colors.text }]} numberOfLines={1}>
                        Delivery Hubs
                      </Text>
                    </View>
                    <View style={styles.matrixRight}>
                      <Text style={[styles.freeValue, { color: colors.textSecondary }]}>1 Pincode</Text>
                      <View style={styles.vipTag}>
                        <Text style={styles.vipTagText}>ALL HUBS</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.matrixRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.matrixLeft}>
                      <BarChart2 size={15} color={colors.primary} />
                      <Text style={[styles.matrixLabel, { color: colors.text }]} numberOfLines={1}>
                        Drop Radar & Stats
                      </Text>
                    </View>
                    <View style={styles.matrixRight}>
                      <Text style={[styles.freeValue, { color: colors.textSecondary }]}>Locked</Text>
                      <View style={styles.vipTag}>
                        <Text style={styles.vipTagText}>UNLOCKED</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.matrixRow, { borderBottomWidth: 0 }]}>
                    <View style={styles.matrixLeft}>
                      <ShieldCheck size={15} color="#10B981" />
                      <Text style={[styles.matrixLabel, { color: colors.text }]} numberOfLines={1}>
                        Loud Sirens & 1-Tap
                      </Text>
                    </View>
                    <View style={styles.matrixRight}>
                      <Text style={[styles.includedText, { color: '#10B981' }]}>Included for all</Text>
                    </View>
                  </View>
                </View>

                {/* Pending Verification Notice / Manual Verify Option */}
                {pendingVerification ? (
                  <View
                    style={[
                      styles.pendingBox,
                      {
                        backgroundColor: isDark ? '#1C1917' : '#FFFBEB',
                        borderColor: isDark ? '#78350F' : '#FDE68A',
                      },
                    ]}
                  >
                    <View style={styles.pendingHeader}>
                      <RefreshCw size={14} color="#D97706" />
                      <Text style={[styles.pendingTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                        Payment Verification Pending
                      </Text>
                    </View>
                    <Text style={[styles.pendingSubtitle, { color: colors.textSecondary }]}>
                      Already paid on Razorpay? Tap below to verify and activate your VIP Pass immediately.
                    </Text>
                    <TouchableOpacity
                      style={[styles.manualCheckButton, { backgroundColor: '#D97706' }]}
                      onPress={handleManualCheck}
                      disabled={isCheckingManual}
                      activeOpacity={0.85}
                    >
                      {isCheckingManual ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} color="#FFFFFF" />
                          <Text style={styles.manualCheckButtonText}>Check Payment Status</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Processing status banner */}
                {isProcessing && verificationStatusText ? (
                  <View style={styles.processingBanner}>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={[styles.processingText, { color: colors.textSecondary }]}>
                      {verificationStatusText}
                    </Text>
                  </View>
                ) : null}

                {/* Pay Action Button */}
                {isVipActive && isTrial && !isExpiringSoon ? (
                  <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: '#10B981' }]}
                    onPress={() => {
                      closePaywall();
                      openPaymentDetails();
                    }}
                    activeOpacity={0.85}
                  >
                    <Sparkles size={18} color="#FFFFFF" />
                    <Text style={styles.payButtonText}>
                      VIP Active • 30-Day Gift Pack ({daysRemaining}d Left)
                    </Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: colors.primary }]}
                    onPress={handlePay}
                    disabled={isProcessing || isCheckingManual}
                    activeOpacity={0.85}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Zap size={18} color="#FFFFFF" />
                        <Text style={styles.payButtonText}>
                          Unlock VIP Pass • Pay ₹{selectedPlan === '1_week_pass' ? '7' : '25'}
                        </Text>
                        <ArrowRight size={16} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
                  ⚡ Instant activation • No recurring lock-in • 100% Secure
                </Text>

                <LegalDisclaimer compact />
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  dragHeaderWrapper: {
    width: '100%',
    paddingBottom: 4,
  },
  dragHandleArea: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandlePill: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  trialBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trialBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  planDuration: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  priceCurrency: {
    fontSize: 16,
    fontWeight: '800',
  },
  priceAmount: {
    fontSize: 26,
    fontWeight: '900',
  },
  priceSub: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  planPerWeek: {
    fontSize: 11,
    fontWeight: '700',
  },
  featureMatrix: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  matrixLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  matrixLabel: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  matrixRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  freeValue: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 44,
    textAlign: 'right',
  },
  vipTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    minWidth: 68,
    alignItems: 'center',
  },
  vipTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  includedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pendingBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  pendingSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  manualCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  manualCheckButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  guaranteeText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 10,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successCongrats: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  receiptCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 24,
  },
  receiptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  receiptPlanName: {
    fontSize: 16,
    fontWeight: '900',
  },
  receiptActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  receiptActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  receiptActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  receiptDivider: {
    borderTopWidth: 1,
    marginVertical: 12,
  },
  receiptBenefitsList: {
    gap: 8,
  },
  receiptBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptBenefitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  doneButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
