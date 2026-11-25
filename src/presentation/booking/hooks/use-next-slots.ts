import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppServices } from '../../../composition/app-services-provider';
import { nextOpenSlot, slotLocalParts } from '../../../application/booking/remote-booking-mapping';
import type { RemoteSlot } from '../../../application/booking/remote-appointments';
import { useLiveEvents } from './use-live-events';

export type NextSlot = { slot: RemoteSlot | null } | undefined;

/** Next free slot of each shop: loaded on focus, then updated live when its slots change. */
export function useNextSlots(shopIds: readonly string[]) {
  const app = useAppServices();
  const [result, setResult] = useState<Record<string, NextSlot>>({});
  const key = shopIds.join('|');
  const load = useCallback((id: string) => {
    void app.appointmentsApi.slots(id)
      .then(slots => setResult(current => ({ ...current, [id]: { slot: nextOpenSlot(slots, new Date()) } })))
      .catch(() => { /* The card simply keeps its previous label. */ });
  }, [app]);
  useFocusEffect(useCallback(() => {
    if (!app.appointmentsApi.configured || !key) return;
    key.split('|').forEach(load);
  }, [app, key, load]));
  useLiveEvents(event => {
    const id = event.data.locationId;
    if (event.type === 'slots.changed' && id && key.split('|').includes(id)) load(id);
  });
  return result;
}

/** « Aujourd’hui · 14:30 », « Demain · 09:00 » or « mar. 2 déc. · 09:00 » in Madagascar time. */
export function slotLabel(startsAt: string, now: Date): string {
  const parts = slotLocalParts(startsAt);
  if (!parts) return '';
  const today = slotLocalParts(now.toISOString())?.day;
  const tomorrow = slotLocalParts(new Date(now.getTime() + 86_400_000).toISOString())?.day;
  if (parts.day === today) return `Aujourd’hui · ${parts.time}`;
  if (parts.day === tomorrow) return `Demain · ${parts.time}`;
  const date = new Date(startsAt).toLocaleDateString('fr-FR', { timeZone: 'Indian/Antananarivo', weekday: 'short', day: 'numeric', month: 'short' });
  return `${date.replace(/\./g, '')} · ${parts.time}`;
}
