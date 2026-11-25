import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useAppServices } from '../../composition/app-services-provider';
import { Icon } from '../booking/components/booking-icon';
import { Brand, Elevation, Radius, TOUCH } from '../shared/brand';
import { Text, TextInput } from '../shared/components/text';

export function EmailRecovery() {
  const app = useAppServices();
  const { appointmentsApi: api } = app;
  const [expanded, setExpanded] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [assisted, setAssisted] = useState(false);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [request, setRequest] = useState<{ id: string; expiresAt: string } | null>(null);
  useEffect(() => { void AsyncStorage.getItem('@robia/assisted-recovery-v1').then(value => { if (value) { try { const item = JSON.parse(value); if (typeof item.id === 'string' && typeof item.expiresAt === 'string' && Date.parse(item.expiresAt) > Date.now()) setRequest(item); } catch { /* Ignore malformed saved requests. */ } } }).catch(() => {}); }, []);
  const openAssisted = async () => {
    setAssisted(true); setMessage('');
    try { const result = await api.shops(); setShops(result); }
    catch { setMessage('Impossible de charger les boutiques. Réessayez.'); }
  };
  const createRequest = async (locationId: string) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try { const item = await api.createAssistedRecovery(locationId); setRequest(item); await AsyncStorage.setItem('@robia/assisted-recovery-v1', JSON.stringify(item)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Impossible de créer la demande.'); }
    finally { setBusy(false); }
  };
  const checkRequest = async () => {
    if (!request || busy) return;
    setBusy(true); setMessage('');
    try {
      const result = await api.assistedRecoveryStatus(request.id);
      if (result.status === 'pending') setMessage('La demande attend la validation de la boutique.');
      else { setRequest(null); await AsyncStorage.removeItem('@robia/assisted-recovery-v1'); if (result.status === 'completed') { void app.registerAppointmentPush().catch(() => {}); setMessage('Votre accès est récupéré.'); } else setMessage('La demande a expiré. Créez-en une nouvelle.'); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Impossible de vérifier la demande.'); }
    finally { setBusy(false); }
  };
  if (!api.configured) return null;
  const act = async (confirm: boolean) => {
    if (busy || !email.trim()) { setMessage('Indiquez votre adresse e-mail.'); return; }
    if (confirm && !/^\d{6}$/.test(code)) { setMessage('Indiquez le code à 6 chiffres.'); return; }
    setBusy(true); setMessage('');
    try {
      if (!confirm) {
        if (recovery) await api.requestRecovery(email.trim()); else await api.requestEmailVerification(email.trim());
        setMessage('Si la demande peut être traitée, un code sera envoyé à cette adresse.');
      } else if (recovery) { await api.recover(email.trim(), code); void app.registerAppointmentPush().catch(() => {}); setMessage('Votre accès est récupéré.'); setCode(''); }
      else { await api.verifyEmail(email.trim(), code); setMessage('Votre adresse e-mail est vérifiée.'); setCode(''); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Impossible de traiter votre demande.'); }
    finally { setBusy(false); }
  };
  return <View style={s.card}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={s.header}>
      <View style={s.headerIcon}><Icon name="phone" size={20} color={Brand.orange} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Changer de téléphone</Text>
        <Text style={s.text}>Vérifiez ou récupérez votre accès par e-mail.</Text>
      </View>
      <View style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }}><Icon name="arrow" size={16} color={Brand.textTertiary} /></View>
    </Pressable>
    {expanded && <View style={{ gap: 12 }}>
      <View style={s.segment}>
        {[false, true].map(mode => (
          <Pressable key={String(mode)} accessibilityRole="tab" accessibilityState={{ selected: recovery === mode }} onPress={() => { setRecovery(mode); setCode(''); setMessage(''); }} style={[s.segmentItem, recovery === mode && s.segmentActive]}>
            <Text style={[s.segmentText, recovery === mode && { color: Brand.ink }]}>{mode ? 'Nouvel appareil' : 'Vérifier mon e-mail'}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.text}>{recovery ? 'Saisissez l’adresse déjà vérifiée sur votre ancien appareil.' : 'Vérifiez votre adresse pour retrouver vos rendez-vous sur un autre appareil.'}</Text>
      <View style={s.inline}>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" accessibilityLabel="Adresse e-mail" placeholder="Adresse e-mail" style={[s.input, { flex: 1 }]} />
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void act(false)} style={s.ghost}><Text style={s.ghostText}>Envoyer</Text></Pressable>
      </View>
      <View style={s.inline}>
        <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} accessibilityLabel="Code à six chiffres" placeholder="Code à 6 chiffres" style={[s.input, { flex: 1, letterSpacing: code ? 6 : 0 }]} />
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void act(true)} style={[s.ghost, s.solid]}>
          {busy ? <ActivityIndicator size="small" color="white" /> : <Text style={[s.ghostText, { color: Brand.white }]}>{recovery ? 'Récupérer' : 'Vérifier'}</Text>}
        </Pressable>
      </View>
      <View style={s.divider} />
      <Pressable accessibilityRole="button" onPress={() => assisted ? setAssisted(false) : void openAssisted()} style={s.linkRow}>
        <Icon name="shop" size={18} color={Brand.orangeDark} />
        <Text style={s.link}>{assisted ? 'Masquer la récupération en boutique' : 'Récupérer mon accès en boutique'}</Text>
      </Pressable>
      {assisted && <View style={{ gap: 10 }}>
        <Text style={s.text}>Sur un nouvel appareil, choisissez une boutique et présentez votre CIN originale à un agent. La validation nécessite un agent habilité.</Text>
        {request ? <View style={s.request}>
          <Text style={s.text}>Référence à présenter</Text>
          <Text selectable style={s.reference}>{request.id}</Text>
          <Text style={s.text}>Expire le {new Date(request.expiresAt).toLocaleString('fr-FR')}</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void checkRequest()} style={s.linkRow}><Text style={s.link}>Vérifier la validation</Text></Pressable>
        </View> : shops.map(shop => <Pressable key={shop.id} accessibilityRole="button" disabled={busy} onPress={() => void createRequest(shop.id)} style={s.shop}>
          <Text style={{ flex: 1, fontWeight: '600' }}>{shop.name}</Text>
          <Icon name="arrow" size={16} color={Brand.orangeDark} />
        </Pressable>)}
      </View>}
      {!!message && <View style={s.message}><Text accessibilityRole="alert" style={[s.text, { color: Brand.ink }]}>{message}</Text></View>}
    </View>}
  </View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: Brand.surface, borderRadius: Radius.card, padding: 16, gap: 12, ...Elevation.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH },
  headerIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: Brand.orangeLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700' },
  text: { fontSize: 13, color: Brand.textSecondary, lineHeight: 19 },
  segment: { flexDirection: 'row', backgroundColor: Brand.canvas, borderRadius: Radius.control, padding: 4 },
  segmentItem: { flex: 1, minHeight: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: Brand.surface, ...Elevation.card },
  segmentText: { fontSize: 13, fontWeight: '700', color: Brand.textTertiary },
  inline: { flexDirection: 'row', gap: 8 },
  input: { minHeight: 52, paddingHorizontal: 14, borderRadius: Radius.control, backgroundColor: Brand.canvas, fontSize: 15, fontWeight: '600', minWidth: 0 },
  ghost: { minHeight: 52, paddingHorizontal: 16, borderRadius: Radius.control, backgroundColor: Brand.orangeLight, alignItems: 'center', justifyContent: 'center' },
  solid: { backgroundColor: Brand.orange, minWidth: 96 },
  ghostText: { fontSize: 14, fontWeight: '700', color: Brand.orangeDark },
  divider: { height: 1, backgroundColor: Brand.border },
  linkRow: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { fontSize: 14, fontWeight: '700', color: Brand.orangeDark },
  request: { backgroundColor: Brand.orangeSoft, borderRadius: Radius.control, padding: 14, gap: 4 },
  reference: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  shop: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: Radius.control, backgroundColor: Brand.canvas },
  message: { backgroundColor: Brand.canvas, borderRadius: Radius.control, padding: 12 },
});
