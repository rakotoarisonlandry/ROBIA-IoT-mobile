import { Pressable, View } from 'react-native';
import { Brand, TOUCH } from '../../shared/brand';
import { Text } from '../../shared/components/text';
import { Icon } from './booking-icon';

export function CheckRow({ checked, onToggle, label }: { checked: boolean; onToggle: (next: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onToggle(!checked)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH, paddingVertical: 6 }}
    >
      <View style={{ width: 26, height: 26, borderWidth: 2, borderColor: checked ? Brand.orange : '#CFD1D6', borderRadius: 9, backgroundColor: checked ? Brand.orange : Brand.white, alignItems: 'center', justifyContent: 'center' }}>
        {checked && <Icon name="check" size={16} color="white" />}
      </View>
      <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}
