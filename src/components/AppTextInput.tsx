import React from 'react';
import { TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';

export const AppTextInput = React.forwardRef<RNTextInput, TextInputProps>(({ style, ...props }, ref) => {
  const flatStyle = StyleSheet.flatten(style) || {};
  const weight = flatStyle.fontWeight;

  let fontFamily = 'Sora_500Medium';
  if (weight === '900' || weight === '800' || weight === 'bold') {
    fontFamily = 'Sora_800ExtraBold';
  } else if (weight === '700') {
    fontFamily = 'Sora_700Bold';
  } else if (weight === '600' || weight === 'semibold') {
    fontFamily = 'Sora_600SemiBold';
  }

  // Strip `fontWeight` so native Android/iOS EditText views render the custom Sora font file directly!
  const customStyle = {
    ...flatStyle,
    fontFamily,
    fontWeight: undefined,
  };

  return (
    <RNTextInput
      ref={ref}
      style={customStyle}
      {...props}
    />
  );
});

AppTextInput.displayName = 'AppTextInput';
