import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

export const AppText: React.FC<TextProps> = ({ style, children, ...props }) => {
  // Extract font weight to dynamically select the correct Plus Jakarta Sans font variant
  const flatStyle = StyleSheet.flatten(style) || {};
  const weight = flatStyle.fontWeight;
  const isItalic = flatStyle.fontStyle === 'italic';

  let fontFamily = 'Sora_500Medium';

  if (weight === '900' || weight === '800' || weight === 'bold') {
    fontFamily = 'Sora_800ExtraBold';
  } else if (weight === '700') {
    fontFamily = 'Sora_700Bold';
  } else if (weight === '600' || weight === 'semibold') {
    fontFamily = 'Sora_600SemiBold';
  } else if (weight === '500' || weight === 'medium') {
    fontFamily = 'Sora_500Medium';
  } else {
    fontFamily = 'Sora_400Regular';
  }

  // CRITICAL REACT NATIVE / EXPO FIX:
  // On Android/iOS, if both `fontFamily` (e.g. PlusJakartaSans_700Bold) AND `fontWeight: '700'` are specified,
  // the OS font manager fails the lookup and falls back to system default (Roboto/San Francisco).
  // Stripping `fontWeight` and `fontStyle` ensures the exact custom font file is rendered!
  const customStyle = {
    ...flatStyle,
    fontFamily,
    fontWeight: undefined,
    fontStyle: undefined,
  };

  return (
    <RNText style={customStyle} {...props}>
      {children}
    </RNText>
  );
};
