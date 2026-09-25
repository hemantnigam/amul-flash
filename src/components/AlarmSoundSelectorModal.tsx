import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  PanResponder,
  Animated,
} from 'react-native';
import { AppText as Text } from './AppText';
import {
  X,
  Play,
  Square,
  Check,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LOCAL_ALARM_SOUNDS, LocalSoundItem } from '../constants/alarmSounds';
import { useStockStore } from '../store/useStockStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { alarmSoundService } from '../services/alarmSoundService';

interface AlarmSoundSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AlarmSoundSelectorModal: React.FC<AlarmSoundSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { selectedAlarmSoundId, setSelectedAlarmSoundId } = useStockStore();
  const { colors, isDark } = useAppTheme();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(400)).current;

  // Stop audio on close or unmount
  useEffect(() => {
    if (!visible) {
      alarmSoundService.stopPreview();
      setPlayingId(null);
    } else {
      translateY.setValue(400);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const handleClose = () => {
    alarmSoundService.stopPreview();
    onClose();
  };

  const closeWithSlideDown = () => {
    Animated.timing(translateY, {
      toValue: 600,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      handleClose();
    });
  };

  const resetPosition = () => {
    Animated.spring(translateY, {
      toValue: 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || (gestureState.dy > 30 && gestureState.vy > 0.4)) {
          closeWithSlideDown();
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        resetPosition();
      },
    })
  ).current;

  const handleTogglePlay = async (soundItem: LocalSoundItem) => {
    if (playingId === soundItem.id) {
      await alarmSoundService.stopPreview();
      setPlayingId(null);
    } else {
      setPlayingId(soundItem.id);
      await alarmSoundService.previewSound(soundItem.id);
    }
  };

  const handleSelectSound = async (soundItem: LocalSoundItem) => {
    setSelectedAlarmSoundId(soundItem.id);
    await alarmSoundService.stopPreview();
    setPlayingId(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeWithSlideDown}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <TouchableWithoutFeedback onPress={closeWithSlideDown}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom + 16, 28),
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Draggable Header Section */}
          <View {...panResponder.panHandlers} style={styles.dragHeaderWrapper}>
            {/* Grab Handle Pill */}
            <View style={styles.dragHandleArea}>
              <View
                style={[
                  styles.dragHandlePill,
                  { backgroundColor: isDark ? '#52525B' : '#CBD5E1' },
                ]}
              />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Custom Notification Sound</Text>
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                  Select the sound played when tracked items drop
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeWithSlideDown}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceContainer }]}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sound List */}
          <ScrollView
            style={styles.soundList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {LOCAL_ALARM_SOUNDS.map((item) => {
              const isSelected = selectedAlarmSoundId === item.id;
              const isPlaying = playingId === item.id;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.soundCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#1E1E1E'
                          : '#EFF6FF'
                        : colors.cardSecondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {/* Left: Play / Pause Preview Button */}
                  <TouchableOpacity
                    style={[
                      styles.playBtn,
                      {
                        backgroundColor: isPlaying
                          ? '#EF4444'
                          : isDark
                          ? '#222222'
                          : '#FFFFFF',
                        borderColor: isPlaying
                          ? '#EF4444'
                          : isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleTogglePlay(item)}
                    activeOpacity={0.8}
                  >
                    {isPlaying ? (
                      <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                      <Play
                        size={15}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        fill={isSelected ? colors.primary : colors.textSecondary}
                        style={{ marginLeft: 2 }}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Middle: Sound Title, Category & Description */}
                  <TouchableOpacity
                    style={styles.soundInfoArea}
                    onPress={() => handleSelectSound(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.soundName,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <View
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? '#1E3A8A'
                                : 'rgba(37, 99, 235, 0.12)'
                              : isDark
                              ? '#374151'
                              : 'rgba(100, 116, 139, 0.1)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryBadgeText,
                            { color: isSelected ? colors.primary : colors.textSecondary },
                          ]}
                        >
                          {item.category}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.soundDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                  </TouchableOpacity>

                  {/* Right: Selection Checkmark */}
                  <TouchableOpacity
                    style={styles.rightAction}
                    onPress={() => handleSelectSound(item)}
                    activeOpacity={0.7}
                  >
                    {isSelected ? (
                      <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={[styles.unselectedRadio, { borderColor: colors.outline, backgroundColor: 'transparent' }]} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Done Button */}
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={closeWithSlideDown}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Confirm</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHeaderWrapper: {
    width: '100%',
    paddingBottom: 2,
  },
  dragHandleArea: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandlePill: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  soundList: {
    marginTop: 4,
  },
  soundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  soundCardSelected: {
    backgroundColor: '#F0F7FF',
    borderColor: '#2563EB',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  playBtnSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#93C5FD',
  },
  playBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  soundInfoArea: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  soundName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  soundNameSelected: {
    color: '#1D4ED8',
  },
  categoryBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryBadgeSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryBadgeTextSelected: {
    color: '#2563EB',
  },
  soundDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rightAction: {
    padding: 4,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  doneBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
});
