import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  History,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ShoppingBag,
  Info,
} from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { useStockStore } from '../../store/useStockStore';
import { ActivityLog } from '../../types/amul';

export default function ActivityScreen() {
  const { activityLogs } = useStockStore();

  const renderIcon = (log: ActivityLog) => {
    switch (log.type) {
      case 'restock':
        return <Zap size={18} color="#FFFFFF" />;
      case 'auto_cart':
        return <ShoppingBag size={18} color="#FFFFFF" />;
      case 'heartbeat':
        return <RotateCw size={18} color="#FFFFFF" />;
      case 'checkout':
        return <CheckCircle2 size={18} color="#FFFFFF" />;
      default:
        return <Info size={18} color="#FFFFFF" />;
    }
  };

  const getIconBg = (log: ActivityLog) => {
    switch (log.status) {
      case 'success':
        return Theme.colors.statusSuccessText;
      case 'warning':
        return Theme.colors.statusDangerText;
      case 'info':
        return Theme.colors.primaryContainer;
      default:
        return Theme.colors.secondary;
    }
  };

  const formatTimestamp = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Timeline</Text>
        <Text style={styles.headerSub}>
          Live event log: Restocks, Headless Auto-Carts & Token Heartbeats
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timelineList}>
          {activityLogs.map((log, index) => {
            const isLast = index === activityLogs.length - 1;
            return (
              <View key={log.id} style={styles.timelineRow}>
                {/* Left Indicator & Spine */}
                <View style={styles.spineColumn}>
                  <View
                    style={[styles.iconCircle, { backgroundColor: getIconBg(log) }]}
                  >
                    {renderIcon(log)}
                  </View>
                  {!isLast && <View style={styles.spineLine} />}
                </View>

                {/* Right Event Card */}
                <View style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{log.title}</Text>
                    <Text style={styles.timestampText}>
                      {formatTimestamp(log.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.eventDesc}>{log.description}</Text>
                </View>
              </View>
            );
          })}
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
    paddingBottom: 32,
  },
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  spineColumn: {
    alignItems: 'center',
    width: 40,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  spineLine: {
    width: 2,
    flex: 1,
    minHeight: 40,
    backgroundColor: Theme.colors.outlineVariant,
    marginVertical: 4,
  },
  eventCard: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.radius.xl,
    padding: 14,
    marginLeft: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    ...Theme.shadows.card,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginRight: 8,
  },
  timestampText: {
    fontSize: 11,
    color: Theme.colors.secondary,
    fontWeight: '500',
  },
  eventDesc: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
});
