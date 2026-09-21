import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AppText as Text } from './AppText';
import {
  X,
  Zap,
  CreditCard,
  Clock,
  Sparkles,
  ShieldCheck,
  BarChart2,
  BellRing,
  ArrowRight,
} from 'lucide-react-native';
import { useSubscriptionStore, parseFlexibleDate } from '../store/useSubscriptionStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAppTheme } from '../hooks/useAppTheme';

interface PaymentDetailsModalProps {
  visible?: boolean;
  onClose?: () => void;
  onUpgrade?: () => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  visible,
  onClose,
  onUpgrade,
}) => {
  const {
    subscription,
    isVipActive,
    isTrial,
    daysRemaining,
    isExpiringSoon,
    isPaymentDetailsVisible,
    closePaymentDetails,
    openPaywall,
    verifySubscriptionStatus,
  } = useSubscriptionStore();
  const { session, userProfile } = useSessionStore();
  const { colors, isDark } = useAppTheme();

  const isModalVisible = visible !== undefined ? visible : isPaymentDetailsVisible;
  const handleClose = onClose || closePaymentDetails;

  useEffect(() => {
    if (isModalVisible) {
      const activeMobile = session?.mobile || userProfile?.phone;
      if (activeMobile) {
        verifySubscriptionStatus(activeMobile);
      }
    }
  }, [isModalVisible, session?.mobile, userProfile?.phone, verifySubscriptionStatus]);

  if (!isModalVisible) return null;

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return 'N/A';
    try {
      const ts = parseFlexibleDate(isoDate);
      if (!ts) return String(isoDate);
      const d = new Date(ts);
      if (isNaN(d.getTime())) return String(isoDate);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (_e) {
      return String(isoDate);
    }
  };

  const getPlanTitle = () => {
    if (!subscription) return 'Free Plan';
    if (subscription.plan_name === '1_month_pass') return isVipActive ? '1-Month VIP Pass' : '1-Month VIP Pass (Expired)';
    if (subscription.plan_name === '1_week_pass') return isVipActive ? '1-Week VIP Pass' : '1-Week VIP Pass (Expired)';
    if (subscription.plan_name === '30_day_welcome_trial') return isVipActive ? '30-Day VIP Welcome Trial' : '30-Day Welcome Trial (Expired)';
    return isVipActive ? 'VIP Active' : 'Free Plan';
  };

  const getAmountPaid = () => {
    if (subscription?.amount_paid) return `₹${subscription.amount_paid}`;
    if (subscription?.plan_name === '1_month_pass') return '₹25';
    if (subscription?.plan_name === '1_week_pass') return '₹7';
    if (subscription?.plan_name === '30_day_welcome_trial') return '₹0 (Free Trial)';
    return 'Free';
  };

  const totalDays = subscription?.plan_name === '1_week_pass' ? 7 : 30;
  const progressPercent = Math.min(Math.max((daysRemaining / totalDays) * 100, 0), 100);

  const benefits = [
    {
      icon: Sparkles,
      title: 'Unlimited Product Tracking',
      desc: 'Track all Amul protein, whey, paneer, and lassi items simultaneously',
    },
    {
      icon: ShieldCheck,
      title: 'Multi-Pincode Hub Alerts',
      desc: 'Monitor delivery hubs for Home, Office, and Gym in real-time',
    },
    {
      icon: BellRing,
      title: 'High-Priority Siren Alarms',
      desc: 'Instant loud alerts that bypass DND within 60s of restock drops',
    },
    {
      icon: BarChart2,
      title: 'Full Drop Intelligence',
      desc: '24-hour histogram charts, 7-day heatmaps & demand velocity radar',
    },
  ];

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header Row */}
          <View style={styles.topRow}>
            <View style={styles.headerTag}>
              <CreditCard size={14} color={colors.primary} />
              <Text style={[styles.headerTagText, { color: colors.primary }]}>
                PAYMENT & SUBSCRIPTION
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Active Plan Card */}
            <View
              style={[
                styles.planSummaryCard,
                {
                  backgroundColor: isDark ? '#18181B' : '#F8FAFC',
                  borderColor: isVipActive ? '#3B82F6' : colors.border,
                },
              ]}
            >
              <View style={styles.planCardTop}>
                <View style={styles.planTitleCol}>
                  <Text style={[styles.planLabel, { color: colors.textSecondary }]}>CURRENT PLAN</Text>
                  <Text style={[styles.planTitle, { color: colors.text }]}>{getPlanTitle()}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isVipActive
                        ? isDark
                          ? '#064E3B'
                          : '#DCFCE7'
                        : isDark
                        ? '#450A0A'
                        : '#FEE2E2',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isVipActive ? '#10B981' : '#EF4444' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isVipActive ? '#15803D' : '#DC2626' },
                    ]}
                  >
                    {isVipActive ? (isTrial ? 'TRIAL ACTIVE' : 'ACTIVE') : 'EXPIRED'}
                  </Text>
                </View>
              </View>

              {/* Validity Dates & Countdown */}
              {subscription?.expires_at ? (
                <View style={styles.timelineBox}>
                  <View style={styles.datesRow}>
                    <View style={styles.dateCol}>
                      <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Started</Text>
                      <Text style={[styles.dateValue, { color: colors.text }]}>
                        {formatDate(subscription?.starts_at)}
                      </Text>
                    </View>

                    <View style={[styles.dateCol, { alignItems: 'flex-end' }]}>
                      <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                        {isVipActive ? 'Expires' : 'Expired On'}
                      </Text>
                      <Text style={[styles.dateValue, { color: isVipActive ? colors.text : '#EF4444' }]}>
                        {formatDate(subscription?.expires_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${isVipActive ? progressPercent : 0}%`,
                          backgroundColor: isVipActive
                            ? daysRemaining <= 3
                              ? '#F59E0B'
                              : '#3B82F6'
                            : '#EF4444',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.remainingRow}>
                    <Clock size={13} color={isVipActive ? (daysRemaining <= 3 ? '#F59E0B' : colors.primary) : '#EF4444'} />
                    <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
                      {isVipActive ? (
                        <>
                          <Text style={{ fontWeight: '800', color: colors.text }}>
                            {daysRemaining} day{daysRemaining === 1 ? '' : 's'}
                          </Text>{' '}
                          remaining in current cycle
                        </>
                      ) : (
                        <Text style={{ fontWeight: '800', color: '#EF4444' }}>Plan expired • Upgrade to restore VIP features</Text>
                      )}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Payment Details Meta */}
              <View style={[styles.metaDivider, { borderTopColor: colors.border }]} />
              <View style={styles.metaRow}>
                <Text style={[styles.metaKey, { color: colors.textSecondary }]}>Amount Paid</Text>
                <Text style={[styles.metaVal, { color: colors.text }]}>{getAmountPaid()}</Text>
              </View>
              {subscription?.payment_id && (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, { color: colors.textSecondary }]}>Transaction ID</Text>
                  <Text style={[styles.metaValMono, { color: colors.textSecondary }]}>
                    {subscription.payment_id}
                  </Text>
                </View>
              )}
            </View>

            {/* Benefits Included Under Subscription */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              {isVipActive ? 'UNLOCKED VIP BENEFITS' : 'VIP PASS BENEFITS'}
            </Text>

            <View style={styles.benefitsList}>
              {benefits.map((b, index) => {
                const Icon = b.icon;
                return (
                  <View
                    key={index}
                    style={[
                      styles.benefitItem,
                      {
                        backgroundColor: colors.surfaceContainer,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.benefitIconBox,
                        {
                          backgroundColor: isVipActive
                            ? isDark
                              ? '#064E3B'
                              : '#DCFCE7'
                            : isDark
                            ? '#27272A'
                            : '#F1F5F9',
                        },
                      ]}
                    >
                      <Icon size={16} color={isVipActive ? '#10B981' : colors.textSecondary} />
                    </View>
                    <View style={styles.benefitTextCol}>
                      <Text style={[styles.benefitTitle, { color: colors.text }]}>{b.title}</Text>
                      <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>{b.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsCol}>
              {!isVipActive ? (
                <TouchableOpacity
                  style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    handleClose();
                    if (onUpgrade) onUpgrade();
                    else openPaywall('Renew your VIP Pass for ₹7/week to unlock unlimited tracking.');
                  }}
                  activeOpacity={0.85}
                >
                  <Zap size={18} color="#FFFFFF" />
                  <Text style={styles.upgradeBtnText}>Upgrade to VIP Pass (₹7/week)</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : isExpiringSoon ? (
                <TouchableOpacity
                  style={[styles.upgradeBtn, { backgroundColor: '#D97706' }]}
                  onPress={() => {
                    handleClose();
                    if (onUpgrade) onUpgrade();
                    else openPaywall('Extend your VIP Pass before your welcome gift expires.');
                  }}
                  activeOpacity={0.85}
                >
                  <Zap size={18} color="#FFFFFF" />
                  <Text style={styles.upgradeBtnText}>Extend VIP Pass (₹7/week)</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.doneBtn,
                  {
                    backgroundColor: isVipActive
                      ? colors.primary
                      : isDark
                      ? '#27272A'
                      : '#F1F5F9',
                  },
                ]}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.doneBtnText,
                    { color: isVipActive ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  planSummaryCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 20,
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  planTitleCol: {
    flex: 1,
  },
  planLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timelineBox: {
    marginTop: 14,
    gap: 8,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateCol: {},
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  remainingText: {
    fontSize: 12,
  },
  metaDivider: {
    borderTopWidth: 1,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaKey: {
    fontSize: 12,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  metaValMono: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  benefitsList: {
    gap: 10,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  benefitIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  benefitDesc: {
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  actionButtonsCol: {
    gap: 10,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 999,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
