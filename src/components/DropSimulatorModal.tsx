import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AppText as Text } from './AppText';
import { Zap, BellRing, ShieldCheck, X, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { Theme } from '../constants/theme';
import { useStockStore } from '../store/useStockStore';

interface DropSimulatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DropSimulatorModal: React.FC<DropSimulatorModalProps> = ({
  visible,
  onClose,
}) => {
  const { products, triggerSimulatedDrop, isSimulatingDrop, selectedPincode } = useStockStore();
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [simComplete, setSimComplete] = useState(false);

  const handleRunSimulation = async () => {
    await triggerSimulatedDrop(selectedProdId);
    setSimComplete(true);
    setTimeout(() => {
      setSimComplete(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Zap size={16} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Flash Drop Simulator</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.desc}>
            Test flash drop behavior: Updates inventory state $\rightarrow$ triggers real-time stock alert in &lt;300ms $\rightarrow$ triggers Notifee emergency audio alarm override.
          </Text>

          {/* Target Product Selection */}
          <Text style={styles.sectionTitle}>Select Target Product to Restock</Text>
          <ScrollView style={styles.prodList} contentContainerStyle={styles.prodListContent}>
            {products.map((p) => {
              const isSelected = p.id === selectedProdId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.prodItem, isSelected && styles.prodItemSelected]}
                  onPress={() => setSelectedProdId(p.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.prodItemInfo}>
                    <Text style={styles.prodItemTitle}>{p.title}</Text>
                    <Text style={styles.prodItemSub}>
                      {p.nutrition?.proteinGrams ? `${p.nutrition.proteinGrams}g Protein • ` : ''}₹{p.defaultPrice}
                    </Text>
                  </View>
                  {p.autoCartEnabled && (
                    <View style={styles.autoCartTag}>
                      <Zap size={10} color={Theme.colors.primary} />
                      <Text style={styles.autoCartTagText}>Stock Radar</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Current Target Location */}
          <View style={styles.targetLocationBox}>
            <Text style={styles.targetLocationLabel}>Drop Target Pincode:</Text>
            <Text style={styles.targetLocationValue}>
              {selectedPincode?.label || 'Target Location'} ({selectedPincode?.pincode || 'Select Pincode'})
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.simActionBtn, isSimulatingDrop && styles.btnDisabled]}
            onPress={handleRunSimulation}
            disabled={isSimulatingDrop}
            activeOpacity={0.8}
          >
            {isSimulatingDrop ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : simComplete ? (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text style={styles.simActionText}>Restock Alert Triggered!</Text>
              </>
            ) : (
              <>
                <Zap size={18} color="#FFFFFF" />
                <Text style={styles.simActionText}>Trigger Flash Drop Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: Theme.radius.xxl,
    borderTopRightRadius: Theme.radius.xxl,
    padding: Theme.spacing.containerMargin,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.statusDangerText,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  desc: {
    fontSize: 13,
    color: Theme.colors.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginBottom: 10,
  },
  prodList: {
    maxHeight: 220,
    marginBottom: 14,
  },
  prodListContent: {
    gap: 8,
  },
  prodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  prodItemSelected: {
    borderColor: Theme.colors.statusDangerText,
    backgroundColor: '#FFF1F2',
  },
  prodItemInfo: {
    flex: 1,
  },
  prodItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  prodItemSub: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  autoCartTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
    borderWidth: 1,
    borderColor: Theme.colors.primaryFixed,
  },
  autoCartTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  targetLocationBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 12,
    borderRadius: Theme.radius.lg,
    marginBottom: 16,
  },
  targetLocationLabel: {
    fontSize: 13,
    color: Theme.colors.secondary,
  },
  targetLocationValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  simActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.statusDangerText,
    paddingVertical: 14,
    borderRadius: Theme.radius.lg,
    gap: 8,
    ...Theme.shadows.active,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  simActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
