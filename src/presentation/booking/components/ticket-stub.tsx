import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Brand, Elevation, Radius } from '../../shared/brand';
import { PressableScale } from '../../shared/components/pressable-scale';
import { Text } from '../../shared/components/text';
import type { TicketViewModel } from '../models/booking-view-models';
import { Icon } from './booking-icon';
import { StatusBadge } from './status-badge';

const STUB = 96;

export function dayParts(t: TicketViewModel) {
  const date = new Date(t.appointmentAt);
  const zone = t.status ? { timeZone: 'Indian/Antananarivo' } : {};
  return {
    day: date.toLocaleDateString('fr-FR', { day: 'numeric', ...zone }),
    month: date.toLocaleDateString('fr-FR', { month: 'short', ...zone }).replace('.', ''),
    weekday: date.toLocaleDateString('fr-FR', { weekday: 'short', ...zone }).replace('.', ''),
  };
}

/** Ticket-shaped card: date stub, perforation, details. */
export function TicketStub({ ticket, shopName, services, isRemote, onPress, eyebrow, children }: {
  ticket: TicketViewModel;
  shopName: string;
  services: string;
  isRemote: boolean;
  onPress: () => void;
  eyebrow?: string;
  children?: ReactNode;
}) {
  const { day, month, weekday } = dayParts(ticket);
  return (
    <View style={s.card}>
      <View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${eyebrow ? eyebrow + ' : ' : ''}${shopName}, ${ticket.date} à ${ticket.time}. Ouvrir le ticket ${ticket.code}`}
        onPress={onPress}
        scaleTo={0.985}
        style={s.row}
      >
        <View style={[s.stub, !!children && { borderBottomLeftRadius: 0 }]}>
          <Text style={s.weekday}>{weekday}</Text>
          <Text style={s.day}>{day}</Text>
          <Text style={s.month}>{month}</Text>
          <View style={s.timePill}><Text style={s.time}>{ticket.time}</Text></View>
        </View>
        <View style={s.perforation}>
          {Array.from({ length: 7 }, (_, i) => <View key={i} style={s.dash} />)}
        </View>
        <View style={s.body}>
          {!!eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
          <Text style={s.shop} numberOfLines={1}>{shopName}</Text>
          {!!services && <Text style={s.services} numberOfLines={1}>{services}</Text>}
          <View style={s.meta}>
            <StatusBadge status={ticket.status} isRemote={isRemote} compact />
          </View>
          <View style={s.idRow}>
            <Icon name="ticket" size={15} color={Brand.textTertiary} />
            <Text style={s.id}>Ticket #{ticket.code}</Text>
            <View style={{ flex: 1 }} />
            <Icon name="arrow" size={16} color={Brand.orange} />
          </View>
        </View>
      </PressableScale>
      <View pointerEvents="none" style={[s.notch, { top: -11 }]} />
      <View pointerEvents="none" style={[s.notch, { bottom: -11 }]} />
      </View>
      {children && <View style={s.footer}>{children}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: Brand.surface, borderRadius: Radius.card, ...Elevation.card },
  row: { flexDirection: 'row', alignItems: 'stretch', minHeight: 128 },
  stub: {
    width: STUB,
    backgroundColor: Brand.orangeLight,
    borderTopLeftRadius: Radius.card,
    borderBottomLeftRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  weekday: { fontSize: 12, fontWeight: '600', color: Brand.orangeDark, textTransform: 'capitalize' },
  day: { fontSize: 34, lineHeight: 38, fontWeight: '800', color: Brand.orangeDark, letterSpacing: -1 },
  month: { fontSize: 12, fontWeight: '700', color: Brand.orangeDark, textTransform: 'uppercase', letterSpacing: 0.8 },
  timePill: { marginTop: 8, backgroundColor: Brand.surface, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  time: { fontSize: 13, fontWeight: '800', color: Brand.ink },
  perforation: { width: 1, justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 14 },
  dash: { width: 1.5, height: 7, borderRadius: 1, backgroundColor: '#E3E4E8' },
  body: { flex: 1, padding: 16, paddingLeft: 18, gap: 4, justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: Brand.orange },
  shop: { fontSize: 17, fontWeight: '700', color: Brand.ink, letterSpacing: -0.3 },
  services: { fontSize: 13, color: Brand.textSecondary },
  meta: { marginTop: 6 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  id: { fontSize: 12, fontWeight: '600', color: Brand.textTertiary },
  notch: { position: 'absolute', left: STUB - 11, width: 22, height: 22, borderRadius: 11, backgroundColor: Brand.canvas },
  footer: { borderTopWidth: 1, borderColor: Brand.border, borderStyle: 'dashed', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
});
