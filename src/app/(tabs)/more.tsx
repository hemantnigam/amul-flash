import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
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
} from 'lucide-react-native';
import { useSessionStore } from '../../store/useSessionStore';
import { useStockStore } from '../../store/useStockStore';
import { PincodeSelectorModal } from '../../components/PincodeSelectorModal';

export default function AccountScreen() {
  const router = useRouter();
  const {
    session,
    heartbeatEnabled,
    setHeartbeatEnabled,
    smsRetrieverEnabled,
    setSmsRetrieverEnabled,
    logout,
  } = useSessionStore();
  const { selectedPincode } = useStockStore();

  const [isPincodeModalVisible, setIsPincodeModalVisible] = useState(false);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <Text style={styles.headerSub}>Active Amul D2C Session & Delivery Hub</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>A</Text>
          </View>
          <View style={styles.userTextCol}>
            <Text style={styles.userName}>Amul Member</Text>
            <Text style={styles.userPhone}>
              {session.mobile ? `+91 ${session.mobile}` : 'Signed in via Android Keystore'}
            </Text>
          </View>
          <View style={styles.activePill}>
            <View style={styles.greenDot} />
            <Text style={styles.activePillText}>CONNECTED</Text>
          </View>
        </View>

        {/* Primary Settings Group */}
        <Text style={styles.groupHeading}>DELIVERY & RADAR</Text>
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
                <Text style={styles.rowTitle}>Delivery Pincode</Text>
                <Text style={styles.rowSub}>
                  {selectedPincode.pincode} • {selectedPincode.label} (Hub: {selectedPincode.storeId})
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Automation Settings */}
        <Text style={styles.groupHeading}>AUTOMATION & BACKGROUND</Text>
        <View style={styles.cardGroup}>
          {/* Heartbeat Switch */}
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Zap size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Auto Session Keeper</Text>
                <Text style={styles.rowSub}>Maintains valid Amul checkout session in background</Text>
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
                <Text style={styles.rowSub}>Zero-latency OTP autofill during stock drops</Text>
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
    fontSize: 20,
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
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 20,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  userTextCol: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  userPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginBottom: 18,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
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
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 10,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
