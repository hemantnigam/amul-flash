export const Theme = {
  colors: {
    // Stitch Theme Colors
    primary: '#004AC6',
    primaryContainer: '#2563EB',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#EEEFFF',
    primaryFixed: '#DBE1FF',
    primaryFixedDim: '#B4C5FF',

    // Surfaces & Backgrounds
    background: '#FAF8FF',
    surface: '#FAF8FF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F3F3FE',
    surfaceContainer: '#EDEDF9',
    surfaceContainerHigh: '#E7E7F3',
    surfaceContainerHighest: '#E1E2ED',
    surfaceDim: '#D9D9E5',
    surfaceBright: '#FAF8FF',

    // Text & Outlines
    onSurface: '#191B23',
    onSurfaceVariant: '#434655',
    onBackground: '#191B23',
    outline: '#737686',
    outlineVariant: '#E5E7EB',

    // Secondary & Accent
    secondary: '#585F6C',
    secondaryContainer: '#DCE2F3',
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
  },

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
