export const LightColors = {
  // Brand Colors
  primary: '#004AC6',
  primaryContainer: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryHover: '#1D4ED8',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#EEEFFF',
  primaryFixed: '#DBE1FF',
  primaryFixedDim: '#B4C5FF',

  // Surfaces & Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F8FAFC',
  surfaceContainer: '#F1F5F9',
  surfaceContainerHigh: '#E2E8F0',
  surfaceContainerHighest: '#CBD5E1',
  surfaceDim: '#E2E8F0',
  surfaceBright: '#FFFFFF',

  // Cards & Modals
  card: '#FFFFFF',
  cardSecondary: '#F8FAFC',
  cardHighlight: '#F0F9FF',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  headerBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',

  // Text & Outlines
  onSurface: '#0F172A',
  onSurfaceVariant: '#475569',
  onBackground: '#0F172A',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  outline: '#94A3B8',
  outlineVariant: '#E2E8F0',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Secondary & Accent
  secondary: '#475569',
  secondaryContainer: '#F1F5F9',
  onSecondary: '#FFFFFF',

  // Status Colors (Live badges, flash alerts)
  statusSuccessBg: '#DCFCE7',
  statusSuccessText: '#16A34A',
  statusSuccessBorder: '#86EFAC',

  statusDangerBg: '#FEE2E2',
  statusDangerText: '#DC2626',
  statusDangerBorder: '#FCA5A5',

  statusWarningBg: '#FEF3C7',
  statusWarningText: '#D97706',
  statusWarningBorder: '#FCD34D',

  // Protein Highlight Badge
  proteinGoldBg: '#FEF9C3',
  proteinGoldText: '#854D0E',
  proteinGoldBorder: '#FDE047',

  // UPI Brands
  gpay: '#4285F4',
  phonepe: '#5F259F',
  paytm: '#00BAF2',
  cred: '#1A1A1A',
};

export const DarkColors = {
  // Brand Colors
  primary: '#3B82F6',
  primaryContainer: '#2563EB',
  primaryLight: '#18181B',
  primaryHover: '#60A5FA',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#FFFFFF',
  primaryFixed: '#27272A',
  primaryFixedDim: '#3F3F46',

  // Surfaces & Backgrounds (Pure OLED True Black - Zero Eye Strain)
  background: '#000000',
  surface: '#121212',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#0D0D0D',
  surfaceContainer: '#171717',
  surfaceContainerHigh: '#212121',
  surfaceContainerHighest: '#2C2C2C',
  surfaceDim: '#121212',
  surfaceBright: '#1E1E1E',

  // Cards & Modals
  card: '#121212',
  cardSecondary: '#171717',
  cardHighlight: '#222222',
  modalOverlay: 'rgba(0, 0, 0, 0.85)',
  headerBg: '#000000',
  tabBarBg: '#000000',

  // Text & Outlines
  onSurface: '#F4F4F5',
  onSurfaceVariant: '#A1A1AA',
  onBackground: '#F4F4F5',
  text: '#F4F4F5',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  outline: '#71717A',
  outlineVariant: '#262626',
  border: '#262626',
  borderLight: '#1A1A1A',

  // Secondary & Accent
  secondary: '#A1A1AA',
  secondaryContainer: '#1E1E1E',
  onSecondary: '#FFFFFF',

  // Status Colors (Live badges, flash alerts)
  statusSuccessBg: '#052E16',
  statusSuccessText: '#4ADE80',
  statusSuccessBorder: '#166534',

  statusDangerBg: '#450A0A',
  statusDangerText: '#F87171',
  statusDangerBorder: '#991B1B',

  statusWarningBg: '#451A03',
  statusWarningText: '#FBBF24',
  statusWarningBorder: '#B45309',

  // Protein Highlight Badge
  proteinGoldBg: '#2A1E00',
  proteinGoldText: '#FDE047',
  proteinGoldBorder: '#78350F',

  // UPI Brands
  gpay: '#4285F4',
  phonepe: '#8B5CF6',
  paytm: '#38BDF8',
  cred: '#262626',
};

export const CommonTheme = {
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    containerMargin: 16,
    gutter: 12,
  },

  typography: {
    display: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    headlineLg: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },
    headlineMd: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '600' as const,
    },
    titleLg: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    bodyLg: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '400' as const,
    },
    bodyMd: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    labelLg: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
    },
    labelMd: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
    },
    caption: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '400' as const,
    },
  },

  fonts: {
    regular: 'Sora_400Regular',
    medium: 'Sora_500Medium',
    semiBold: 'Sora_600SemiBold',
    bold: 'Sora_700Bold',
    extraBold: 'Sora_800ExtraBold',
  },

  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    active: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};

export const getTheme = (isDark: boolean) => ({
  colors: isDark ? DarkColors : LightColors,
  isDark,
  ...CommonTheme,
});

export const Theme = {
  colors: LightColors,
  ...CommonTheme,
};
