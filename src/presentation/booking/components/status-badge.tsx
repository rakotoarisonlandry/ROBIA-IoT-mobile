import { View } from 'react-native';
import { Radius, Tone, type ToneName } from '../../shared/brand';
import { Text } from '../../shared/components/text';
import type { TicketViewModel } from '../models/booking-view-models';

type Status = TicketViewModel['status'];

const remote: Record<NonNullable<Status>, { label: string; short: string; tone: ToneName }> = {
  pending: { label: 'En attente de confirmation', short: 'En attente', tone: 'warning' },
  confirmed: { label: 'Confirmé par la boutique', short: 'Confirmé', tone: 'success' },
  rejected: { label: 'Refusé par la boutique', short: 'Refusé', tone: 'danger' },
  cancelled: { label: 'Annulé', short: 'Annulé', tone: 'neutral' },
};

export function appointmentStatus(status: Status, isRemote: boolean) {
  return isRemote ? remote[status ?? 'pending'] : { label: 'Enregistré sur cet appareil', short: 'Enregistré', tone: 'neutral' as ToneName };
}

/** Colored pill that always carries a text label. */
export function StatusBadge({ status, isRemote, compact = false }: { status: Status; isRemote: boolean; compact?: boolean }) {
  const { label, short, tone } = appointmentStatus(status, isRemote);
  const colors = Tone[tone];
  return (
    <View
      accessibilityLabel={`Statut : ${label}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.bg, borderRadius: Radius.pill, paddingHorizontal: compact ? 9 : 12, paddingVertical: compact ? 4 : 7 }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.fg }} />
      <Text style={{ color: colors.fg, fontSize: compact ? 12 : 13, fontWeight: '700' }}>{compact ? short : label}</Text>
    </View>
  );
}
