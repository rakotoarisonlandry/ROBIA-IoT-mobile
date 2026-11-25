import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type StyleProp, type TextInputProps, type TextProps, type TextStyle } from 'react-native';
import { Brand } from '../brand';

/** Font files loaded once in the root layout. */
export const appFonts = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
};

export const Font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

const byWeight: Record<string, string> = {
  '100': Font.regular, '200': Font.regular, '300': Font.regular, '400': Font.regular, normal: Font.regular,
  '500': Font.medium, '600': Font.semibold, '700': Font.bold, bold: Font.bold, '800': Font.extrabold, '900': Font.extrabold,
};

/**
 * Android cannot pick a weight inside a custom family, so each weight is its own file.
 * Map `fontWeight` to the matching file and leave explicit non-Jakarta families (mono) alone.
 */
function withFont(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily && !flat.fontFamily.startsWith('PlusJakartaSans')) return style;
  return [style, { fontFamily: flat.fontFamily ?? byWeight[String(flat.fontWeight ?? '400')] ?? Font.regular, fontWeight: 'normal' }];
}

export function Text({ style, ...props }: TextProps) {
  return <RNText {...props} style={withFont([{ color: Brand.ink }, style])} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <RNTextInput placeholderTextColor={Brand.textTertiary} {...props} style={withFont([{ color: Brand.ink, fontSize: 16 }, style])} />;
}
