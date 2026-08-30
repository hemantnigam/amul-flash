import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { AppText as Text } from './AppText';
import {
  X,
  Volume2,
  Play,
  Pause,
  Check,
  Music,
} from 'lucide-react-native';
import { LOCAL_ALARM_SOUNDS, LocalSoundItem } from '../constants/alarmSounds';
import { useStockStore } from '../store/useStockStore';
import { alarmSoundService } from '../services/alarmSoundService';

interface AlarmSoundSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AlarmSoundSelectorModal: React.FC<AlarmSoundSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { selectedAlarmSoundId, setSelectedAlarmSoundId } = useStockStore();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleTogglePreview = async (item: LocalSoundItem) => {
    console.log('🔘 [AlarmSoundSelectorModal] Play/Pause clicked for:', item.name, `(ID: ${item.id})`, 'Current playingId:', playingId);
    
    if (playingId === item.id) {
      console.log('⏸️ [AlarmSoundSelectorModal] Stopping preview for:', item.name);
      await alarmSoundService.stopPreview();
      setPlayingId(null);
    } else {
      console.log('▶️ [AlarmSoundSelectorModal] Starting preview for:', item.name);
      setPlayingId(item.id);
      setSelectedAlarmSoundId(item.id);
      await alarmSoundService.previewSound(item.id);
    }
  };

  const handleCardPress = (item: LocalSoundItem) => {
    console.log('📋 [AlarmSoundSelectorModal] Card selected:', item.name);
    setSelectedAlarmSoundId(item.id);
  };

  const handleDone = () => {
    console.log('✅ [AlarmSoundSelectorModal] Closing modal and stopping previews');
    alarmSoundService.stopPreview();
    setPlayingId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleDone}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Volume2 size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.title}>Alarm Sound ({LOCAL_ALARM_SOUNDS.length} Sounds)</Text>
                <Text style={styles.subTitle}>Select restock alarm sound from src/music</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleDone}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Sound Options List */}
          <ScrollView
            style={styles.soundList}
            contentContainerStyle={styles.soundListContent}
            showsVerticalScrollIndicator={false}
          >
            {LOCAL_ALARM_SOUNDS.map((item) => {
              const isSelected = item.id === selectedAlarmSoundId;
              const isPlaying = playingId === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.soundCard,
                    isSelected && styles.soundCardSelected,
                  ]}
                  onPress={() => handleCardPress(item)}
                  activeOpacity={0.7}
                >
                  {/* Play / Pause Dedicated Button */}
                  <TouchableOpacity
                    style={[
                      styles.playBtn,
                      isPlaying && styles.playBtnActive,
                    ]}
                    onPress={() => handleTogglePreview(item)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {isPlaying ? (
                      <Pause size={16} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                      <Play
                        size={16}
                        color={isSelected ? '#2563EB' : '#64748B'}
                        fill={isSelected ? '#2563EB' : '#64748B'}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Sound Details */}
                  <View style={styles.soundInfo}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          styles.soundName,
                          isSelected && styles.soundNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.soundDesc}>{item.description}</Text>
                  </View>

                  {/* Radio Checkmark */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
              <Music size={18} color="#FFFFFF" />
              <Text style={styles.doneBtnText}>Confirm Alarm Sound</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'android' ? 24 : 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundList: {
    maxHeight: 400,
  },
  soundListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  soundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  soundCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  soundInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1E293B',
  },
  soundNameSelected: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  categoryBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  soundDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  doneBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
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
