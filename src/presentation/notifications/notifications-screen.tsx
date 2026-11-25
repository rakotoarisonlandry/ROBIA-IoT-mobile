import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppServices } from '../../composition/app-services-provider';
import type { Ticket } from '../../domain/booking/entities';
import { Icon } from '../booking/components/booking-icon';
import { Brand, Elevation, Radius, TOUCH, Tone, type ToneName } from '../shared/brand';
import { PressableScale } from '../shared/components/pressable-scale';
import { Text } from '../shared/components/text';
import { useLiveEvents } from '../booking/hooks/use-live-events';

function describe(ticket: Ticket): { title: string; tone: ToneName; icon: string } {
  if (ticket.serviceResult) return ticket.serviceResult === 'treated'
    ? { title: 'Demande traitée', tone: 'success', icon: 'check' }
    : { title: 'Demande non traitée', tone: 'danger', icon: 'close' };
  switch (ticket.status) {
    case 'pending': return { title: 'Demande en attente', tone: 'warning', icon: 'clock' };
    case 'confirmed': return { title: 'Rendez-vous confirmé', tone: 'success', icon: 'check' };
    case 'rejected': return { title: 'Demande refusée', tone: 'danger', icon: 'close' };
    case 'cancelled': return { title: 'Rendez-vous annulé', tone: 'neutral', icon: 'close' };
    default: return { title: 'Rendez-vous enregistré', tone: 'neutral', icon: 'calendar' };
  }
}

export default function NotificationsScreen() {
  const app = useAppServices();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const liveRef = useRef(false);
  const live = useLiveEvents(event => { if (event.type === 'ready' || event.type.startsWith('booking.')) void refreshRef.current?.(); });
  useEffect(() => { liveRef.current = live; }, [live]);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    let pending = false;
    const refresh = async (initial = false) => {
      if (pending || (!initial && AppState.currentState !== 'active')) return;
      pending = true;
      try {
        if (initial) await app.refreshCatalog();
        const items = await app.listTickets();
        if (!active) return;
        setTickets(items);
        setError(false);
        await AsyncStorage.setItem('@robia/read-notifications-v1', JSON.stringify(items.map(item => `${item.reference}:${item.status ?? 'local'}:${item.serviceResult ?? ''}`)));
      } catch { if (active && initial) setError(true); }
      finally { pending = false; if (active && initial) setLoading(false); }
    };
    void refresh(true);
    refreshRef.current = () => refresh();
    const timer = app.appointmentsApi.configured ? setInterval(() => { if (!liveRef.current) void refresh(); }, 10000) : null;
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { active = false; refreshRef.current = null; if (timer) clearInterval(timer); subscription.remove(); };
    // `attempt` re-runs the initial load when the user taps « Réessayer ».
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, attempt]));
  const shops = app.getCatalog().shops;
  const sorted = [...tickets].sort((a, b) => Date.parse(b.appointmentAt) - Date.parse(a.appointmentAt));

  return <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
    <View style={s.header}>
      <PressableScale accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.back}>
        <View style={{ transform: [{ scaleX: -1 }] }}><Icon name="arrow" size={20} color={Brand.ink} /></View>
      </PressableScale>
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={s.heading}>Notifications</Text>
      </View>
    </View>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.intro}>
        <View style={s.introIcon}><Icon name="bell" size={24} color={Brand.orange} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>Restez informé</Text>
          <Text style={s.introText}>Chaque réponse de la boutique et chaque rappel arrivent ici.</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ gap: 12 }}>{[0, 1, 2].map(i => <View key={i} style={s.skeleton} />)}</View>
      ) : error ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Impossible de charger vos notifications</Text>
          <Text style={s.caption}>Vérifiez votre connexion puis réessayez.</Text>
          <PressableScale accessibilityRole="button" onPress={() => setAttempt(n => n + 1)} style={s.retry}>
            <Text style={s.retryText}>Réessayer</Text>
          </PressableScale>
        </View>
      ) : sorted.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyArt}><Icon name="bell" size={32} color={Brand.orange} /></View>
          <Text style={s.emptyTitle}>Rien à signaler pour le moment</Text>
          <Text style={s.caption}>Vos prochains rendez-vous et leurs mises à jour apparaîtront ici.</Text>
        </View>
      ) : (
        <View>
          <Text style={s.section}>RÉCENTES</Text>
          {sorted.map((ticket, index) => {
            const date = new Date(ticket.appointmentAt);
            const shop = shops.find(item => item.id === ticket.shopId)?.name ?? 'votre boutique';
            const info = describe(ticket);
            const tone = Tone[info.tone];
            const last = index === sorted.length - 1;
            return (
              <Animated.View key={ticket.reference} entering={FadeInDown.duration(380).delay(index * 60)} style={s.row}>
                <View style={s.rail}>
                  <View style={[s.railDot, { backgroundColor: tone.bg }]}><Icon name={info.icon} size={16} color={tone.fg} /></View>
                  {!last && <View style={s.railLine} />}
                </View>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`${info.title}. ${shop}. Voir mon rendez-vous`}
                  onPress={() => router.replace({ pathname: '/', params: { view: 'Mes rendez-vous' } })}
                  scaleTo={0.985}
                  style={s.card}
                >
                  <Text style={[s.cardTitle, { color: tone.fg === Tone.neutral.fg ? Brand.ink : tone.fg }]}>{info.title}</Text>
                  <Text style={s.body}>{shop}</Text>
                  <Text style={[s.body, { textTransform: 'capitalize' }]}>
                    {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {!!ticket.serviceMessage && <View style={s.quote}><Text style={s.body}>{ticket.serviceMessage}</Text></View>}
                  <View style={s.linkRow}>
                    <Text style={s.link}>Voir mon rendez-vous</Text>
                    <Icon name="arrow" size={15} color={Brand.orangeDark} />
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.canvas },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
  back: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: Brand.surface, alignItems: 'center', justifyContent: 'center', ...Elevation.card },
  heading: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  caption: { fontSize: 14, color: Brand.textSecondary, lineHeight: 20, textAlign: 'center' },
  content: { padding: 20, paddingTop: 8, gap: 18, maxWidth: 760, width: '100%', alignSelf: 'center', paddingBottom: 40 },
  intro: { backgroundColor: Brand.orange, borderRadius: Radius.card, padding: 20, flexDirection: 'row', gap: 14, alignItems: 'center', overflow: 'hidden', ...Elevation.glow },
  introIcon: { width: 50, height: 50, backgroundColor: Brand.white, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontWeight: '800', fontSize: 17, color: Brand.white, marginBottom: 2 },
  introText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 19 },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: Brand.textTertiary, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 34 },
  railDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  railLine: { flex: 1, width: 2, backgroundColor: Brand.border, marginTop: 4 },
  card: { flex: 1, backgroundColor: Brand.surface, borderRadius: Radius.card - 4, padding: 16, gap: 3, marginBottom: 12, ...Elevation.card },
  cardTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 2 },
  body: { color: Brand.textSecondary, fontSize: 14, lineHeight: 20 },
  quote: { backgroundColor: Brand.canvas, borderRadius: 12, padding: 10, marginTop: 6 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  link: { color: Brand.orangeDark, fontWeight: '700', fontSize: 13 },
  skeleton: { height: 96, borderRadius: Radius.card - 4, backgroundColor: Brand.surfaceSubtle },
  empty: { padding: 28, backgroundColor: Brand.surface, borderRadius: Radius.card, alignItems: 'center', gap: 8, ...Elevation.card },
  emptyArt: { width: 72, height: 72, borderRadius: 24, backgroundColor: Brand.orangeLight, alignItems: 'center', justifyContent: 'center', marginBottom: 6, transform: [{ rotate: '-6deg' }] },
  emptyTitle: { fontWeight: '800', fontSize: 17, textAlign: 'center', letterSpacing: -0.3 },
  retry: { marginTop: 8, minHeight: TOUCH, paddingHorizontal: 20, borderRadius: Radius.control, backgroundColor: Brand.orangeLight, justifyContent: 'center' },
  retryText: { color: Brand.orangeDark, fontWeight: '700', fontSize: 14 },
});
