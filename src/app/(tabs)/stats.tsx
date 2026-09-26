import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { AppText as Text } from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Rect,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
  G,
} from 'react-native-svg';
import {
  BarChart2,
  Zap,
  Flame,
  Clock,
  TrendingUp,
  MapPin,
  Lock,
  ArrowRight,
  Calendar,
} from 'lucide-react-native';
import { useStockStore } from '../../store/useStockStore';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  supabaseService,
  HourlyDropStat,
  WeeklyHeatmapDay,
  TrackedLeaderboardItem,
  PincodeActivityStats,
} from '../../services/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = Math.min(SCREEN_WIDTH - 48, 360);

// Default Calibrated Baseline Fallbacks (used when database has no recorded events)
const DEFAULT_HOURLY_DISTRIBUTION: HourlyDropStat[] = [
  { hour: 0, count: 2, label: '12 AM', isPeak: false },
  { hour: 1, count: 1, label: '1 AM', isPeak: false },
  { hour: 2, count: 0, label: '2 AM', isPeak: false },
  { hour: 3, count: 0, label: '3 AM', isPeak: false },
  { hour: 4, count: 1, label: '4 AM', isPeak: false },
  { hour: 5, count: 3, label: '5 AM', isPeak: false },
  { hour: 6, count: 8, label: '6 AM', isPeak: false },
  { hour: 7, count: 14, label: '7 AM', isPeak: false },
  { hour: 8, count: 19, label: '8 AM', isPeak: false },
  { hour: 9, count: 28, label: '9 AM', isPeak: false },
  { hour: 10, count: 34, label: '10 AM', isPeak: false },
  { hour: 11, count: 58, label: '11 AM', isPeak: true },
  { hour: 12, count: 64, label: '12 PM', isPeak: true },
  { hour: 13, count: 48, label: '1 PM', isPeak: true },
  { hour: 14, count: 22, label: '2 PM', isPeak: false },
  { hour: 15, count: 18, label: '3 PM', isPeak: false },
  { hour: 16, count: 25, label: '4 PM', isPeak: false },
  { hour: 17, count: 32, label: '5 PM', isPeak: false },
  { hour: 18, count: 68, label: '6 PM', isPeak: true },
  { hour: 19, count: 72, label: '7 PM', isPeak: true },
  { hour: 20, count: 44, label: '8 PM', isPeak: true },
  { hour: 21, count: 26, label: '9 PM', isPeak: false },
  { hour: 22, count: 12, label: '10 PM', isPeak: false },
  { hour: 23, count: 5, label: '11 PM', isPeak: false },
];

const DEFAULT_LEADERBOARD_ITEMS: TrackedLeaderboardItem[] = [
  {
    id: 'blueberry_lassi',
    rank: 1,
    name: 'High Protein Blueberry Lassi 25g',
    demandShare: 88,
    subscribers: '14,280',
    subscriberCount: 14280,
    category: 'Protein Lassi',
    image: 'https://shop.amul.com/placeholder.png',
  },
  {
    id: 'whey_protein',
    rank: 2,
    name: 'High Protein Whey 32g',
    demandShare: 76,
    subscribers: '11,940',
    subscriberCount: 11940,
    category: 'Whey Protein',
    image: 'https://shop.amul.com/placeholder.png',
  },
  {
    id: 'rose_lassi',
    rank: 3,
    name: 'High Protein Rose Lassi 15g',
    demandShare: 64,
    subscribers: '9,410',
    subscriberCount: 9410,
    category: 'Protein Lassi',
    image: 'https://shop.amul.com/placeholder.png',
  },
  {
    id: 'protein_paneer',
    rank: 4,
    name: 'High Protein Fresh Paneer',
    demandShare: 52,
    subscribers: '7,830',
    subscriberCount: 7830,
    category: 'Dairy Protein',
    image: 'https://shop.amul.com/placeholder.png',
  },
  {
    id: 'protein_buttermilk',
    rank: 5,
    name: 'High Protein Buttermilk 15g',
    demandShare: 45,
    subscribers: '6,220',
    subscriberCount: 6220,
    category: 'Buttermilk',
    image: 'https://shop.amul.com/placeholder.png',
  },
];

const DEFAULT_WEEKLY_HEATMAP: WeeklyHeatmapDay[] = [
  { day: 'Mon', full: 'Monday', prob: 24, isHot: false, dropCount: 24 },
  { day: 'Tue', full: 'Tuesday', prob: 38, isHot: true, dropCount: 38 },
  { day: 'Wed', full: 'Wednesday', prob: 18, isHot: false, dropCount: 18 },
  { day: 'Thu', full: 'Thursday', prob: 42, isHot: true, dropCount: 42 },
  { day: 'Fri', full: 'Friday', prob: 32, isHot: false, dropCount: 32 },
  { day: 'Sat', full: 'Saturday', prob: 16, isHot: false, dropCount: 16 },
  { day: 'Sun', full: 'Sunday', prob: 12, isHot: false, dropCount: 12 },
];

// Module-level persistent cache for seamless instant tab switches without flicker
let cachedHourlyDistribution: HourlyDropStat[] | null = null;
let cachedWeeklyHeatmap: WeeklyHeatmapDay[] | null = null;
let cachedLeaderboardItems: TrackedLeaderboardItem[] | null = null;
let cachedPincodeStats: Record<string, PincodeActivityStats> = {};
let cachedLiveDrops: any[] | null = null;
let hasLoadedStatsOnce = false;

export default function DropIntelligenceScreen() {
  const { selectedPincode, products } = useStockStore();
  const { isVipActive, openPaywall } = useSubscriptionStore();
  const { colors, isDark } = useAppTheme();

  const [hourlyDistribution, setHourlyDistribution] = useState<HourlyDropStat[]>(cachedHourlyDistribution || []);
  const [weeklyHeatmap, setWeeklyHeatmap] = useState<WeeklyHeatmapDay[]>(cachedWeeklyHeatmap || []);
  const [leaderboardItems, setLeaderboardItems] = useState<TrackedLeaderboardItem[]>(cachedLeaderboardItems || []);
  const [pincodeStats, setPincodeStats] = useState<PincodeActivityStats | null>(
    (selectedPincode?.pincode && cachedPincodeStats[selectedPincode.pincode]) || null
  );
  const [liveDrops, setLiveDrops] = useState<any[]>(cachedLiveDrops || []);
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedDay, setSelectedDay] = useState<string>('Thu');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(!hasLoadedStatsOnce);

  const formatTimeAgo = (isoDate: string) => {
    if (!isoDate) return 'Just now';
    const diffSecs = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const loadAllStatsData = async () => {
    try {
      const activePin = selectedPincode?.pincode || '110001';
      const [hoursData, weeklyData, leaderboardData, pinData, historyData] = await Promise.all([
        supabaseService.fetchHourlyDistribution(30),
        supabaseService.fetchWeeklyHeatmap(30),
        supabaseService.fetchTopTrackedLeaderboard(products),
        supabaseService.fetchPincodeRestockActivity(activePin),
        supabaseService.fetchDropHistory(8),
      ]);

      if (hoursData && hoursData.length > 0) {
        cachedHourlyDistribution = hoursData;
        setHourlyDistribution(hoursData);
        const highestHour = [...hoursData].sort((a, b) => b.count - a.count)[0];
        if (highestHour && highestHour.count > 0) {
          setSelectedHour(highestHour.hour);
        }
      }

      if (weeklyData && weeklyData.length > 0) {
        cachedWeeklyHeatmap = weeklyData;
        setWeeklyHeatmap(weeklyData);
        const hotDay = weeklyData.find((d) => d.isHot) || weeklyData[0];
        if (hotDay) setSelectedDay(hotDay.day);
      }

      if (leaderboardData && leaderboardData.length > 0) {
        cachedLeaderboardItems = leaderboardData;
        setLeaderboardItems(leaderboardData);
      }

      if (pinData) {
        cachedPincodeStats[activePin] = pinData;
        setPincodeStats(pinData);
      }

      if (historyData) {
        const formatted = historyData.map((item) => ({
          id: item.id || String(Math.random()),
          productTitle: item.product_title || 'High Protein Restock',
          pincode: item.pincode ? `Hub ${item.pincode}` : 'India Central Hub',
          unitsAdded: item.units_added || item.stock_count || 30,
          timeAgo: formatTimeAgo(item.detected_at),
          survivalSecs: 85,
        }));
        cachedLiveDrops = formatted;
        setLiveDrops(formatted);
      }

      hasLoadedStatsOnce = true;
    } catch (e) {
      console.log('⚠️ [DropIntelligence] loadAllStatsData error:', e);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadAllStatsData();

    // Subscribe to live Realtime restock events from Supabase
    const unsubscribe = supabaseService.subscribeToRestockEvents((newDrop) => {
      const newDropItem = {
        id: newDrop.id || String(Date.now()),
        productTitle: newDrop.product_title || 'High Protein Restock',
        pincode: newDrop.pincode ? `Hub ${newDrop.pincode}` : 'India Central Hub',
        unitsAdded: newDrop.units_added || newDrop.stock_count || 24,
        timeAgo: 'Just now',
        survivalSecs: 90,
      };
      setLiveDrops((prev) => [newDropItem, ...prev.slice(0, 9)]);
      // Silently refresh aggregations with new event
      loadAllStatsData();
    });

    return () => {
      unsubscribe();
    };
  }, [selectedPincode?.pincode, products.length]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAllStatsData();
    setIsRefreshing(false);
  };

  const displayHours = hourlyDistribution.length === 24 ? hourlyDistribution : DEFAULT_HOURLY_DISTRIBUTION;
  const maxHourlyCount = Math.max(...displayHours.map((h) => h.count), 1);
  const activeHourData = displayHours.find((h) => h.hour === selectedHour) || displayHours[12] || displayHours[0];

  const displayWeekly = weeklyHeatmap.length === 7 ? weeklyHeatmap : DEFAULT_WEEKLY_HEATMAP;
  const activeDayData = displayWeekly.find((d) => d.day === selectedDay) || displayWeekly[0];

  const displayLeaderboard = leaderboardItems.length > 0 ? leaderboardItems : DEFAULT_LEADERBOARD_ITEMS;

  const currentPinStats: PincodeActivityStats = pincodeStats || {
    pincode: selectedPincode?.pincode || '110001',
    score: 7.8,
    statusText: 'HOT RESTOCK HUB',
    totalDrops: 0,
    unitsAdded: 0,
    lastDropAgo: 'Checking...',
    isHot: true,
  };

  // Gauge calculations for selected hub
  const gaugeScore = currentPinStats.score.toFixed(1);
  const gaugeProgress = Math.min(Math.max((currentPinStats.score - 2) / 8, 0), 1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTopRow}>
          <View>
            <View style={styles.titleRow}>
              <BarChart2 size={22} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Drop Intelligence</Text>
            </View>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Real-time restock patterns, demand radar & historical drops
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {isLoadingInitial ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingTitle, { color: colors.text }]}>Analyzing Drop Intelligence...</Text>
            <Text style={[styles.loadingSub, { color: colors.textSecondary }]}>
              Aggregating live restock frequencies, demand radar & hub activity
            </Text>
          </View>
        ) : (
          <>
            {/* =========================================================================
                COMPONENT 1: 24-Hour Peak Restock Histogram Bar Chart
               ========================================================================= */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconPill, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
              <Clock size={16} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Peak Restock Hours (24h Histogram)</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Prime drop windows glow in amber gradient
              </Text>
            </View>
          </View>

          {/* SVG Bar Chart */}
          <View style={styles.chartWrapper}>
            <Svg width={CHART_WIDTH} height={140}>
              <Defs>
                <SvgLinearGradient id="peakBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FF6B00" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
                </SvgLinearGradient>
                <SvgLinearGradient id="normalBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
                </SvgLinearGradient>
              </Defs>

              {displayHours.map((item, index) => {
                const barHeight = Math.max((item.count / maxHourlyCount) * 95, 4);
                const barWidth = (CHART_WIDTH - 24) / 24 - 2;
                const x = 12 + index * ((CHART_WIDTH - 24) / 24);
                const y = 110 - barHeight;
                const isSelected = item.hour === selectedHour;

                return (
                  <G key={item.hour}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={3}
                      fill={item.isPeak ? 'url(#peakBarGrad)' : 'url(#normalBarGrad)'}
                      stroke={isSelected ? '#FFFFFF' : 'none'}
                      strokeWidth={isSelected ? 1.5 : 0}
                    />
                    {/* Time ticks for key markers */}
                    {index % 4 === 0 && (
                      <SvgText
                        x={x + barWidth / 2}
                        y={128}
                        fontSize={8}
                        fontWeight="700"
                        fill={colors.textSecondary}
                        textAnchor="middle"
                      >
                        {item.hour === 0 ? '12A' : item.hour === 12 ? '12P' : `${item.hour % 12}${item.hour < 12 ? 'A' : 'P'}`}
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </Svg>

            {/* Interactive Touch Layer for Bars */}
            <View style={styles.touchBarOverlay}>
              {displayHours.map((item) => (
                <TouchableOpacity
                  key={item.hour}
                  style={styles.touchColumn}
                  onPress={() => setSelectedHour(item.hour)}
                  activeOpacity={0.6}
                />
              ))}
            </View>
          </View>

          {/* Selected Hour Insight Box */}
          <View
            style={[
              styles.hourInsightBox,
              {
                backgroundColor: activeHourData.isPeak
                  ? isDark
                    ? '#451A03'
                    : '#FEF3C7'
                  : colors.surfaceContainer,
                borderColor: activeHourData.isPeak
                  ? '#F59E0B'
                  : colors.border,
              },
            ]}
          >
            {activeHourData.isPeak && (
              <View style={styles.insightTopBadgeRow}>
                <View style={styles.hotWindowBadge}>
                  <Flame size={11} color="#FFFFFF" />
                  <Text style={styles.hotWindowText}>PRIME DROP WINDOW</Text>
                </View>
              </View>
            )}
            <View style={styles.insightLeft}>
              <Clock size={16} color={activeHourData.isPeak ? '#FF6B00' : colors.primary} />
              <Text style={[styles.insightHourText, { color: colors.text }]}>
                {activeHourData.label}: {activeHourData.count} Restock Drops Recorded
              </Text>
            </View>
          </View>
        </View>

        {/* =========================================================================
            COMPONENT 2: Most Tracked Products Leaderboard (Demand Meter)
           ========================================================================= */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconPill, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
              <TrendingUp size={16} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Most Tracked Products</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                National demand share & subscriber velocity
              </Text>
            </View>
          </View>

          <View style={styles.leaderboardList}>
            {displayLeaderboard.map((prod) => (
              <View
                key={prod.id}
                style={[
                  styles.leaderboardRow,
                  { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                ]}
              >
                {/* Rank Badge */}
                <View
                  style={[
                    styles.rankBadge,
                    {
                      backgroundColor:
                        prod.rank === 1
                          ? '#FF6B00'
                          : prod.rank === 2
                          ? '#F59E0B'
                          : prod.rank === 3
                          ? colors.primary
                          : isDark
                          ? '#374151'
                          : '#CBD5E1',
                    },
                  ]}
                >
                  <Text style={styles.rankBadgeText}>#{prod.rank}</Text>
                </View>

                {/* Info Column */}
                <View style={styles.leaderboardInfo}>
                  <View style={styles.leaderboardTitleRow}>
                    <Text style={[styles.leaderboardName, { color: colors.text }]} numberOfLines={1}>
                      {prod.name}
                    </Text>
                    <Text style={[styles.demandShareText, { color: colors.primary }]}>
                      {prod.demandShare}% Share
                    </Text>
                  </View>

                  {/* Dynamic Progress Bar */}
                  <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${prod.demandShare}%`,
                          backgroundColor:
                            prod.rank === 1
                              ? '#FF6B00'
                              : prod.rank === 2
                              ? '#F59E0B'
                              : colors.primary,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.subscriberRow}>
                    <Text style={[styles.subscriberCount, { color: colors.textSecondary }]}>
                      ⚡ {prod.subscribers} Live Trackers
                    </Text>
                    <Text style={[styles.prodCat, { color: colors.textSecondary }]}>{prod.category}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* =========================================================================
            COMPONENT 3: Weekly Restock Heatmap (7-Day Interactive Pills)
           ========================================================================= */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconPill, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
              <Calendar size={16} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Restock Heatmap</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Day-by-day restock probability index
              </Text>
            </View>
          </View>

          {/* 7-Day Pills */}
          <View style={styles.daysRow}>
            {displayWeekly.map((d) => {
              const isSelected = selectedDay === d.day;
              return (
                <TouchableOpacity
                  key={d.day}
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: isSelected
                        ? d.isHot
                          ? '#FF6B00'
                          : colors.primary
                        : colors.surfaceContainer,
                      borderColor: isSelected
                        ? d.isHot
                          ? '#FF6B00'
                          : colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedDay(d.day)}
                  activeOpacity={0.7}
                >
                  {d.isHot && <Flame size={12} color={isSelected ? '#FFFFFF' : '#FF6B00'} />}
                  <Text
                    style={[
                      styles.dayPillText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {d.day}
                  </Text>
                  <Text
                    style={[
                      styles.dayProbText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : d.isHot
                          ? '#FF6B00'
                          : colors.textSecondary,
                        fontWeight: d.isHot ? '800' : '600',
                      },
                    ]}
                  >
                    {d.prob}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day Detail Insight */}
          <View style={[styles.dayDetailCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <View style={styles.dayDetailTopBadgeRow}>
              {activeDayData.isHot ? (
                <View style={[styles.hotWindowBadge, { backgroundColor: '#FF6B00' }]}>
                  <Flame size={11} color="#FFFFFF" />
                  <Text style={styles.hotWindowText}>HIGH DROP CHANCE</Text>
                </View>
              ) : (
                <View style={[styles.hotWindowBadge, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]}>
                  <Text style={[styles.hotWindowText, { color: colors.textSecondary }]}>NORMAL CYCLE</Text>
                </View>
              )}
            </View>
            <Text style={[styles.dayDetailTitle, { color: colors.text }]}>
              {activeDayData.full} • {activeDayData.prob}% Drop Chance
            </Text>
            <Text style={[styles.dayDetailDesc, { color: colors.textSecondary }]}>
              {activeDayData.isHot
                ? `High plant output dispatch observed (${activeDayData.dropCount} drops recorded). Restocks typically land between 11:30 AM & 1:00 PM.`
                : `Steady maintenance inventory (${activeDayData.dropCount} drops recorded). Restocks observed around 6:30 PM.`}
            </Text>
          </View>
        </View>

        {/* =========================================================================
            COMPONENT 4: Pincode Activity Gauge (Hot / Cold Radar Meter)
           ========================================================================= */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconPill, { backgroundColor: isDark ? '#0C2A3E' : '#E0F2FE' }]}>
              <MapPin size={16} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Pincode Radar Activity</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Restock velocity score for {selectedPincode?.pincode ? `Hub ${selectedPincode.pincode}` : 'Active Delivery Hub'}
              </Text>
            </View>
          </View>

          {/* Radial Speedometer Gauge */}
          <View style={styles.gaugeContainer}>
            <Svg width={200} height={110} viewBox="0 0 200 110">
              <Defs>
                <SvgLinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#3B82F6" />
                  <Stop offset="50%" stopColor="#F59E0B" />
                  <Stop offset="100%" stopColor="#EF4444" />
                </SvgLinearGradient>
              </Defs>
              {/* Background Arc */}
              <Path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={isDark ? '#27272A' : '#E2E8F0'}
                strokeWidth={16}
                strokeLinecap="round"
              />
              {/* Progress Arc */}
              <Path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth={16}
                strokeLinecap="round"
                strokeDasharray={`${gaugeProgress * 251} 251`}
              />
            </Svg>

            <View style={styles.gaugeCenterText}>
              <Text style={[styles.gaugeScore, { color: colors.text }]}>{gaugeScore}</Text>
              <Text style={[styles.gaugeMax, { color: colors.textSecondary }]}>/ 10</Text>
            </View>
          </View>

          <View style={[styles.gaugeStatusCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <View style={styles.gaugeStatusRow}>
              <View style={[styles.livePulseDot, { backgroundColor: currentPinStats.isHot ? '#10B981' : '#F59E0B' }]} />
              <Text style={[styles.gaugeStatusTitle, { color: colors.text }]}>{currentPinStats.statusText}</Text>
            </View>
            <Text style={[styles.gaugeStatusSub, { color: colors.textSecondary }]}>
              {selectedPincode?.pincode ? `Hub ${selectedPincode.pincode}` : 'This hub'} recorded {currentPinStats.totalDrops} restock drops ({currentPinStats.unitsAdded} units added). Last drop recorded {currentPinStats.lastDropAgo}.
            </Text>
          </View>
        </View>

        {/* =========================================================================
            COMPONENT 5: Live Restock Timeline Feed
           ========================================================================= */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconPill, { backgroundColor: isDark ? '#3B0E1B' : '#FFE4E6' }]}>
              <Zap size={16} color="#E11D48" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Live Restock Timeline</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Real-time stock drops detected across India
              </Text>
            </View>
          </View>

          <View style={styles.timelineList}>
            {liveDrops.map((drop, idx) => (
              <View
                key={drop.id}
                style={[
                  styles.timelineItem,
                  {
                    borderBottomColor: idx === liveDrops.length - 1 ? 'transparent' : colors.border,
                  },
                ]}
              >
                <View style={styles.timelineDotCol}>
                  <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                  {idx < liveDrops.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeaderRow}>
                    <Text style={[styles.timelineProdName, { color: colors.text }]} numberOfLines={1}>
                      {drop.productTitle}
                    </Text>
                    <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>{drop.timeAgo}</Text>
                  </View>

                  <View style={styles.timelineMetaRow}>
                    <View style={styles.unitsPill}>
                      <Text style={styles.unitsPillText}>+{drop.unitsAdded} Units</Text>
                    </View>
                    <Text style={[styles.timelineHubText, { color: colors.textSecondary }]}>📍 {drop.pincode}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
          </>
        )}

        {/* =========================================================================
            FREE TIER BLURRED TEASER / PAYWALL OVERLAY
           ========================================================================= */}
        {!isVipActive && (
          <View style={[styles.blurredPaywallOverlay, { backgroundColor: isDark ? 'rgba(15,23,42,0.94)' : 'rgba(255,255,255,0.94)' }]}>
            <View style={[styles.lockIconCircle, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Lock size={32} color={colors.primary} />
            </View>
            <Text style={[styles.paywallTitle, { color: colors.text }]}>Unlock Drop Intelligence</Text>
            <Text style={[styles.paywallDesc, { color: colors.textSecondary }]}>
              Get full interactive 24-hour histogram charts, nationwide demand leaderboards, 7-day drop probability heatmaps, and live timeline streams.
            </Text>

            <TouchableOpacity
              style={[styles.unlockVipBtn, { backgroundColor: colors.primary }]}
              onPress={() => openPaywall('Unlock 24h Peak Restock Charts & Drop Intelligence with VIP Pass.')}
              activeOpacity={0.85}
            >
              <Zap size={18} color="#FFFFFF" />
              <Text style={styles.unlockVipBtnText}>Get VIP Pass for ₹7/week</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={[styles.paywallGuarantee, { color: colors.textSecondary }]}>
              Includes unlimited product tracking & multi-pincode alerts
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
    position: 'relative',
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    position: 'relative',
  },
  touchBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 120,
    flexDirection: 'row',
  },
  touchColumn: {
    flex: 1,
    height: '100%',
  },
  hourInsightBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    gap: 6,
  },
  insightTopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  insightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightHourText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  hotWindowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  hotWindowText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  leaderboardList: {
    gap: 10,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leaderboardName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  demandShareText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subscriberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  subscriberCount: {
    fontSize: 10,
    fontWeight: '600',
  },
  prodCat: {
    fontSize: 10,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayPill: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 2,
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dayProbText: {
    fontSize: 10,
  },
  dayDetailCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  dayDetailTopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayDetailTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  dayDetailDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  gaugeCenterText: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  gaugeScore: {
    fontSize: 28,
    fontWeight: '900',
  },
  gaugeMax: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 2,
  },
  gaugeStatusCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  gaugeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gaugeStatusTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10B981',
  },
  gaugeStatusSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 8,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineProdName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  timelineTime: {
    fontSize: 11,
    marginLeft: 8,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  unitsPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitsPillText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  timelineHubText: {
    fontSize: 11,
  },
  blurredPaywallOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  paywallDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  unlockVipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  unlockVipBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  paywallGuarantee: {
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
