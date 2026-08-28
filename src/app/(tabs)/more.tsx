import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin,
  GitFork,
  Boxes,
  KeyRound,
  BellRing,
  LayoutGrid,
  ShieldCheck,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { useSessionStore } from '../../store/useSessionStore';
import { NotificationService } from '../../services/notificationService';

export default function MoreScreen() {
  const router = useRouter();
  const {
    session,
    heartbeatEnabled,
    setHeartbeatEnabled,
    smsRetrieverEnabled,
    setSmsRetrieverEnabled,
  } = useSessionStore();

  const handleTestAlarm = async () => {
    await NotificationService.triggerEmergencyAlarm({
      title: '🚨 AMUL FLASH ALARM TEST',
      body: 'Emergency restock siren audio & full-screen notification override working successfully!',
      isEmergencyAlarm: true,
    });
    Alert.alert(
      'Emergency Alarm Fired',
      'High-priority alarm channel invoked with DND bypass flags & custom sound.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More & Settings</Text>
        <Text style={styles.headerSub}>Preferences, Session Keeper & Automation Rules</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Tiles Section */}
        <Text style={styles.sectionHeader}>Strategy & Automation</Text>
        <View style={styles.cardGroup}>
          {/* Radius Radar */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/locations')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MapPin size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Multi-Pincode Radius Radar</Text>
              <Text style={styles.menuSubtitle}>
                Cross-zone tracking across Home, Office & Gym
              </Text>
            </View>
            <ChevronRight size={18} color={Theme.colors.secondary} />
          </TouchableOpacity>

          {/* Fallback Rules */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/fallback')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <GitFork size={20} color={Theme.colors.statusWarningText} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Fallback Variant & Basket Bundler</Text>
              <Text style={styles.menuSubtitle}>
                Auto-substitute SKUs & ₹1000 free shipping optimizer
              </Text>
            </View>
            <ChevronRight size={18} color={Theme.colors.secondary} />
          </TouchableOpacity>

          {/* Refill Tracker */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/refill')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Boxes size={20} color={Theme.colors.statusSuccessText} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Personal Refill & Expiry Tracker</Text>
              <Text style={styles.menuSubtitle}>
                Daily protein intake pace & supply countdown
              </Text>
            </View>
            <ChevronRight size={18} color={Theme.colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Amul D2C Session Management */}
        <Text style={styles.sectionHeader}>Amul D2C Cloud Session</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/login')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <KeyRound size={20} color="#7E22CE" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Amul Account & Token Persistence</Text>
              <Text style={styles.menuSubtitle}>
                {session.isLoggedIn
                  ? `Logged in (+91 ${session.mobile}) • Android Keystore active`
                  : 'Not authenticated • Tap to login'}
              </Text>
            </View>
            <ChevronRight size={18} color={Theme.colors.secondary} />
          </TouchableOpacity>

          {/* 4h Heartbeat Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Background Session Keeper (4h Daemon)</Text>
              <Text style={styles.switchSubtitle}>
                Silent heartbeat via expo-task-manager to prevent checkout session expiry
              </Text>
            </View>
            <Switch
              value={heartbeatEnabled}
              onValueChange={setHeartbeatEnabled}
              trackColor={{ true: Theme.colors.primaryContainer, false: '#D1D5DB' }}
            />
          </View>

          {/* SMS Retriever Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Zero-Click SMS OTP Retriever</Text>
              <Text style={styles.switchSubtitle}>
                Google Play Services SmsRetriever API auto-extract in &lt;300ms
              </Text>
            </View>
            <Switch
              value={smsRetrieverEnabled}
              onValueChange={setSmsRetrieverEnabled}
              trackColor={{ true: Theme.colors.primaryContainer, false: '#D1D5DB' }}
            />
          </View>
        </View>

        {/* Notifications & Widgets */}
        <Text style={styles.sectionHeader}>Emergency Alarms & Widgets</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleTestAlarm}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <BellRing size={20} color={Theme.colors.statusDangerText} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Test Emergency Restock Siren</Text>
              <Text style={styles.menuSubtitle}>
                Fires @notifee alarm channel with full-screen audio override
              </Text>
            </View>
            <Zap size={18} color={Theme.colors.statusDangerText} />
          </TouchableOpacity>

          {/* Glanceable Home Screen Widget Card */}
          <View style={styles.widgetPreviewBox}>
            <View style={styles.widgetHeader}>
              <LayoutGrid size={16} color={Theme.colors.primary} />
              <Text style={styles.widgetHeaderTitle}>Android Glanceable Widget Preview</Text>
            </View>
            <View style={styles.mockWidgetPill}>
              <View style={styles.widgetPulse} />
              <Text style={styles.mockWidgetText}>
                Amul Lassi (Rose): 14 in Stock • Bangalore (560034)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  header: {
    paddingHorizontal: Theme.spacing.containerMargin,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  headerSub: {
    fontSize: 13,
    color: Theme.colors.secondary,
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.containerMargin,
    paddingBottom: 36,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    overflow: 'hidden',
    ...Theme.shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
    gap: 12,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.onSurface,
  },
  switchSubtitle: {
    fontSize: 12,
    color: Theme.colors.secondary,
    marginTop: 2,
  },
  widgetPreviewBox: {
    padding: 14,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  widgetHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  mockWidgetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    gap: 8,
  },
  widgetPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.statusSuccessText,
  },
  mockWidgetText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.onSurface,
  },
});
