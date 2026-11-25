import { ActivityIndicator, StyleSheet } from 'react-native';
import { Brand, Elevation, Radius } from '../../shared/brand';
import { PressableScale } from '../../shared/components/pressable-scale';
import { Text } from '../../shared/components/text';
import { Icon } from './booking-icon';

export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}) {
  const inactive = disabled || loading;
  const color = disabled && !loading ? Brand.textTertiary : secondary ? Brand.orangeDark : Brand.white;
  return (
    <PressableScale
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      style={[
        s.base,
        secondary ? s.secondary : s.primary,
        disabled && !loading && s.disabled,
      ]}
      pressedStyle={secondary ? { backgroundColor: '#FFE6D4' } : { backgroundColor: Brand.orangeDark }}
    >
      {loading && <ActivityIndicator size="small" color={color} />}
      <Text style={[s.label, { color }]}>{label}</Text>
      {!loading && <Icon name={icon ?? (secondary ? 'download' : 'arrow')} size={19} color={color} />}
    </PressableScale>
  );
}

const s = StyleSheet.create({
  base: { minHeight: 56, paddingHorizontal: 22, borderRadius: Radius.control + 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  primary: { backgroundColor: Brand.orange, ...Elevation.glow },
  secondary: { backgroundColor: Brand.orangeLight },
  disabled: { backgroundColor: Brand.surfaceSubtle, boxShadow: 'none' },
  label: { fontSize: 16, fontWeight: '700', letterSpacing: -0.1 },
});
