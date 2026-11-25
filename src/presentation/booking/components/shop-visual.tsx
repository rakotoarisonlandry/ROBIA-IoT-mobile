import { StyleSheet, View } from 'react-native';
import { Brand } from '../../shared/brand';
import { Text } from '../../shared/components/text';
import { Icon } from './booking-icon';

const GENERIC = /^(orange|boutique|shop|agence|espace|store)$/i;

/** The distinctive part of a shop name: « Orange Analakely » → « Analakely ». */
export function shopShortName(name: string) {
  const words = name.trim().split(/\s+/).filter(word => !GENERIC.test(word));
  return words.join(' ') || name.trim();
}

/** Deterministic variation so neighbouring cards do not look identical. */
function seed(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

/** Branded storefront illustration used instead of stock photos. */
export function ShopVisual({ id, name, city, height = 150 }: { id: string; name: string; city?: string; height?: number }) {
  const short = shopShortName(name);
  const n = seed(id || name);
  const tilt = (n % 3) - 1;
  return (
    <View style={[s.wrap, { height }]} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={[s.sign, { transform: [{ rotate: `${tilt * 4}deg` }] }]}>
        <Text style={s.signText}>orange</Text>
      </View>
      <View style={s.copy}>
        <View style={s.pin}><Icon name="pin" size={13} color={Brand.orange} /></View>
        <Text style={s.city} numberOfLines={1}>{city || 'Madagascar'}</Text>
      </View>
      <Text style={s.name} numberOfLines={2}>{short}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: Brand.orange, overflow: 'hidden', padding: 14, justifyContent: 'flex-end' },
  sign: { position: 'absolute', top: 14, right: 14, width: 46, height: 40, backgroundColor: Brand.white, borderRadius: 6, padding: 5, justifyContent: 'flex-end' },
  signText: { fontSize: 11, fontWeight: '800', color: Brand.orange, letterSpacing: -0.4 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pin: { width: 22, height: 22, borderRadius: 11, backgroundColor: Brand.white, alignItems: 'center', justifyContent: 'center' },
  city: { color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  name: { color: Brand.white, fontSize: 24, lineHeight: 28, fontWeight: '800', letterSpacing: -1 },
});
