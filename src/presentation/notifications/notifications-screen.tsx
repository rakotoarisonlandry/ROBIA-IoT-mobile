import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppServices } from '../../composition/app-services-provider';
import type { Ticket } from '../../domain/booking/entities';
import { Icon } from '../booking/components/booking-icon';

export default function NotificationsScreen() {
  const app = useAppServices();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    void app.listTickets().then(async items => {
      if (!active) return;
      setTickets(items);
      setError(false);
      await AsyncStorage.setItem('@robia/read-notifications-v1', JSON.stringify(items.map(item => item.reference)));
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [app]));
  const shops = app.getCatalog().shops;
  return <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
      <View style={{ flex: 1 }}><Text style={styles.heading}>Notifications</Text><Text style={styles.caption}>Toute votre actualité en un coup d’œil</Text></View>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.intro}><View style={styles.introIcon}><Icon name="bell" size={24} color="#ff6600" /></View><View style={{ flex: 1 }}><Text style={styles.introTitle}>Restez informé</Text><Text style={styles.caption}>Vos rendez-vous enregistrés et vos rappels sont ici.</Text></View></View>
      <Text style={styles.section}>VOS NOTIFICATIONS</Text>
      {loading ? <Text style={styles.caption}>Chargement…</Text> : error ? <Text style={styles.caption}>Impossible de charger vos notifications. Réessayez plus tard.</Text> : tickets.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Rien à signaler pour le moment</Text><Text style={styles.caption}>Vos prochains rendez-vous enregistrés apparaîtront ici.</Text></View> : tickets.map(ticket => {
        const date = new Date(ticket.appointmentAt);
        const shop = shops.find(item => item.id === ticket.shopId)?.name ?? 'votre boutique';
        return <Pressable key={ticket.reference} accessibilityRole="button" onPress={() => router.replace({ pathname: '/', params: { view: 'Mes rendez-vous' } })} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
          <View style={styles.cardIcon}><Icon name="calendar" size={20} color="#ff6600" /></View>
          <View style={{ flex: 1, gap: 5 }}><Text style={styles.cardTitle}>Rendez-vous enregistré</Text><Text style={styles.body}>{shop} · {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text><Text style={styles.link}>Voir mon rendez-vous  ›</Text></View>
        </Pressable>;
      })}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f9fb' }, header: { backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderColor: '#eee' }, back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }, backText: { fontSize: 30, color: '#292929', lineHeight: 34 }, heading: { fontSize: 22, fontWeight: '800', color: '#202124' }, caption: { fontSize: 13, color: '#7b7b80', lineHeight: 20 }, content: { padding: 20, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' }, intro: { backgroundColor: '#fff0e5', borderRadius: 18, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center' }, introIcon: { width: 48, height: 48, backgroundColor: 'white', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, introTitle: { fontWeight: '800', fontSize: 16, color: '#242424', marginBottom: 3 }, section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#929298', marginTop: 12 }, card: { flexDirection: 'row', gap: 14, backgroundColor: 'white', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#eee' }, cardIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff0e5', alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontSize: 15, fontWeight: '700', color: '#202124' }, body: { color: '#65656a', fontSize: 13, lineHeight: 20 }, link: { color: '#e85e00', fontWeight: '700', fontSize: 12, marginTop: 4 }, empty: { padding: 28, backgroundColor: 'white', borderRadius: 18, alignItems: 'center', gap: 8 }, emptyTitle: { fontWeight: '700', fontSize: 15, color: '#292929', textAlign: 'center' },
});
