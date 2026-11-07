import { createElement, useMemo } from 'react';
import { Text, View } from 'react-native';
import { openStreetMapUrl } from '../models/openstreetmap';
import type { NearbyMapProps } from './map.types';

export default function NearbyMap({ position, selected }: NearbyMapProps) {
  const uri = useMemo(() => openStreetMapUrl(position, selected?.coordinates), [position, selected?.coordinates]);
  return <View style={{ borderRadius: 15, overflow: 'hidden', backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' }}>
    {createElement('iframe', {
      title: 'Carte OpenStreetMap du quartier', src: uri,
      style: { width: '100%', height: 350, border: 0 }, referrerPolicy: 'strict-origin-when-cross-origin',
    })}
    <Text style={{ padding: 12, color: '#777', fontSize: 10 }}>© OpenStreetMap contributors · Carte en ligne</Text>
  </View>;
}
