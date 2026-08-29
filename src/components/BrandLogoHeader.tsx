import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
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
          <Zap size={isLarge ? 20 : 16} color="#FFFFFF" fill="#FFFFFF" />
        </View>

        <Text style={[styles.titleAmul, isLarge ? styles.titleAmulLarge : styles.titleAmulNormal]}>
          Amul
        </Text>

        <View style={[styles.flashPill, isLarge ? styles.flashPillLarge : styles.flashPillNormal]}>
          <Text style={[styles.flashText, isLarge ? styles.flashTextLarge : styles.flashTextNormal]}>
            FLASH
          </Text>
        </View>
      </View>

      {showSubtitle && (
        <Text style={styles.subtitle}>
          OFFICIAL RESTOCK RADAR
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
    backgroundColor: '#004AC6',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  titleAmul: {
    fontWeight: '900',
    color: '#0037B0',
    fontStyle: 'italic',
  },
  titleAmulLarge: {
    fontSize: 32,
    lineHeight: 38,
  },
  titleAmulNormal: {
    fontSize: 24,
    lineHeight: 30,
  },
  flashPill: {
    backgroundColor: '#FF5722',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashPillLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  flashPillNormal: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  flashText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  flashTextLarge: {
    fontSize: 13,
  },
  flashTextNormal: {
    fontSize: 11,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
