import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { AppText as Text } from './AppText';
import { X, Check, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { ThemeMode } from '../store/useThemeStore';

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ThemeOption {
  id: ThemeMode;
  title: string;
  subtitle: string;
  icon: any;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { themeMode, setThemeMode, colors, isDark, systemColorScheme } = useAppTheme();

  const options: ThemeOption[] = [
    {
      id: 'system',
      title: 'System Default',
      subtitle: `Follow phone settings (${systemColorScheme === 'dark' ? 'Currently Dark' : 'Currently Light'})`,
      icon: Smartphone,
    },
    {
      id: 'light',
      title: 'Light Mode',
      subtitle: 'Crisp white surfaces with classic contrast',
      icon: Sun,
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      subtitle: 'Pure OLED black surfaces easy on the eyes',
      icon: Moon,
    },
  ];

  const handleSelect = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.modalOverlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                {isDark ? (
                  <Moon size={20} color={colors.primary} />
                ) : (
                  <Sun size={20} color={colors.primary} />
                )}
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Appearance & Theme</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Choose your preferred color theme
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surfaceContainer }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={styles.optionsList}>
            {options.map((option) => {
              const isSelected = themeMode === option.id;
              const IconComp = option.icon;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#1E1E1E'
                          : '#EFF6FF'
                        : colors.cardSecondary,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(option.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionIconBox,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? '#2A2A2A'
                            : '#E2E8F0',
                        },
                      ]}
                    >
                      <IconComp
                        size={18}
                        color={isSelected ? '#FFFFFF' : colors.textSecondary}
                      />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text
                        style={[
                          styles.optionTitle,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.primary : colors.outline,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsList: {
    padding: 16,
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
