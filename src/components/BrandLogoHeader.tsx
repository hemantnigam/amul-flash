import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Radio, Zap } from 'lucide-react-native';
import { AppText as Text } from './AppText';

interface BrandLogoHeaderProps {
  size?: 'normal' | 'large';
  showSubtitle?: boolean;
}

export const BrandLogoHeader: React.FC<BrandLogoHeaderProps> = ({
  size = 'large',
  showSubtitle = true,
}) => {
  const isLarge = size === 'large';

  return (
    <View style={styles.container}>
      {/* Premium Emblem Badge */}
      <View style={[styles.logoCard, isLarge ? styles.logoCardLarge : styles.logoCardNormal]}>
        <View style={styles.iconCircle}>
          <Radio size={isLarge ? 20 : 16} color="#FFFFFF" />
        </View>

        <Text style={[styles.titleBrand, isLarge ? styles.titleBrandLarge : styles.titleBrandNormal]}>
          Protein
        </Text>

        <View style={[styles.radarPill, isLarge ? styles.radarPillLarge : styles.radarPillNormal]}>
          <Text style={[styles.radarText, isLarge ? styles.radarTextLarge : styles.radarTextNormal]}>
            RADAR
          </Text>
        </View>
      </View>

      {showSubtitle && (
        <Text style={styles.subtitle}>
          LIVE HIGH-PROTEIN RESTOCK RADAR
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  logoCardLarge: {
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 7,
    gap: 10,
  },
  logoCardNormal: {
    paddingLeft: 6,
    paddingRight: 8,
    paddingVertical: 5,
    gap: 8,
  },
  iconCircle: {
    backgroundColor: '#2563EB',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  titleBrand: {
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  titleBrandLarge: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleBrandNormal: {
    fontSize: 22,
    lineHeight: 28,
  },
  radarPill: {
    backgroundColor: '#FF5722',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPillLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  radarPillNormal: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  radarText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  radarTextLarge: {
    fontSize: 13,
  },
  radarTextNormal: {
    fontSize: 11,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
