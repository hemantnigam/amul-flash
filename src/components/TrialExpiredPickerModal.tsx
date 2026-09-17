import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AppText as Text } from './AppText';
import { ShieldAlert, Check, Zap, ArrowRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useStockStore } from '../store/useStockStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useAppTheme } from '../hooks/useAppTheme';

export const TrialExpiredPickerModal: React.FC = () => {
  const { isTrialExpiredPickerVisible, resolveExpiredTrackedItems, openPaywall } = useSubscriptionStore();
  const { trackedProductsMap } = useStockStore();
  const { colors, isDark } = useAppTheme();

  const trackedList = Object.values(trackedProductsMap);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    trackedList[0]?.id || ''
  );

  if (!isTrialExpiredPickerVisible || trackedList.length <= 1) {
    return null;
  }

  const handleConfirmChoice = () => {
    if (selectedProductId) {
      resolveExpiredTrackedItems(selectedProductId);
    }
  };

  const handleUpgradeInstead = () => {
    openPaywall('Renew VIP Pass for ₹7/week to keep all your tracked items & drop intelligence active.');
  };

  return (
    <Modal
      visible={isTrialExpiredPickerVisible}
      transparent
      animationType="fade"
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header Badge */}
          <View style={styles.headerRow}>
            <View style={[styles.alertIconBox, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
              <ShieldAlert size={20} color="#D97706" />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>VIP Trial Completed</Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Free Tier tracks 1 product. Choose your active item:
              </Text>
            </View>
          </View>

          {/* List of tracked products with radio picker */}
          <ScrollView style={styles.productsScroll} showsVerticalScrollIndicator={false}>
            {trackedList.map((product) => {
              const isSelected = selectedProductId === product.id;
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productItem,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#1E1B4B'
                          : '#EEF2FF'
                        : colors.surfaceContainer,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedProductId(product.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.imgWrapper}>
                    {product.imageUrl ? (
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.productImg}
                        contentFit="contain"
                      />
                    ) : (
                      <View style={styles.imgPlaceholder} />
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
                      {product.title}
                    </Text>
                    <Text style={[styles.productCategory, { color: colors.textSecondary }]}>
                      {product.flavor || product.category || 'Amul High Protein'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
              onPress={handleConfirmChoice}
              activeOpacity={0.8}
            >
              <Text style={[styles.confirmBtnText, { color: colors.text }]}>Keep Selected 1 Product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
              onPress={handleUpgradeInstead}
              activeOpacity={0.85}
            >
              <Zap size={16} color="#FFFFFF" />
              <Text style={styles.upgradeBtnText}>Keep All for ₹7/Week</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  alertIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  productsScroll: {
    maxHeight: 220,
    marginVertical: 10,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 10,
  },
  imgWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  productCategory: {
    fontSize: 10,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    gap: 10,
    marginTop: 10,
  },
  confirmBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
