import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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
} from 'lucide-react-native';
import { useSubscriptionStore, RAZORPAY_PAYMENT_LINKS } from '../store/useSubscriptionStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAppTheme } from '../hooks/useAppTheme';

export const SubscriptionModal: React.FC = () => {
  const { isPaywallVisible, paywallReason, closePaywall, verifySubscriptionStatus } = useSubscriptionStore();
  const { session } = useSessionStore();
  const { colors, isDark } = useAppTheme();

  const [selectedPlan, setSelectedPlan] = useState<'1_week_pass' | '1_month_pass'>('1_month_pass');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handlePay = async () => {
    setIsProcessing(true);
    const paymentUrl = RAZORPAY_PAYMENT_LINKS[selectedPlan];

    try {
      // 1. Open Razorpay payment link directly in browser
      await WebBrowser.openBrowserAsync(paymentUrl);

      // 2. Poll Supabase to check if server-side Razorpay webhook verified & activated the account
      let isVerified = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (session.mobile) {
          const isVip = await verifySubscriptionStatus(session.mobile);
          if (isVip) {
            isVerified = true;
            break;
          }
        }
      }

      setIsProcessing(false);
      if (isVerified) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          closePaywall();
        }, 1600);
      }
    } catch (err) {
      console.log('Payment error:', err);
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={isPaywallVisible}
      transparent
      animationType="slide"
      onRequestClose={closePaywall}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Top Grab Bar & Close */}
          <View style={styles.topRow}>
            <View style={styles.headerTag}>
              <Zap size={14} color="#F59E0B" />
              <Text style={styles.headerTagText}>AMUL FLASH VIP PASS</Text>
            </View>
            <TouchableOpacity
              onPress={closePaywall}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {isSuccess ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <CheckCircle2 size={48} color="#10B981" />
                </View>
                <Text style={[styles.successTitle, { color: colors.text }]}>VIP Pass Activated!</Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                  Unlimited product tracking, multi-pincode alerts, and drop intelligence unlocked.
                </Text>
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

                {/* Pay Action Button */}
                <TouchableOpacity
                  style={[styles.payButton, { backgroundColor: colors.primary }]}
                  onPress={handlePay}
                  disabled={isProcessing}
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

                <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
                  ⚡ Instant activation • No recurring lock-in • 100% Secure
                </Text>
              </>
            )}
          </ScrollView>
        </View>
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
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
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
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
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
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
