import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAppServices } from '../../composition/app-services-provider';

export function EmailRecovery() {
  const { appointmentsApi: api } = useAppServices();
  const [expanded, setExpanded] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!api.configured) return null;
  const act = async (confirm: boolean) => {
    if (busy || !email.trim()) { setMessage('Indiquez votre adresse e-mail.'); return; }
    if (confirm && !/^\d{6}$/.test(code)) { setMessage('Indiquez le code à 6 chiffres.'); return; }
    setBusy(true); setMessage('');
    try {
      if (!confirm) {
        if (recovery) await api.requestRecovery(email.trim()); else await api.requestEmailVerification(email.trim());
        setMessage('Si la demande peut être traitée, un code sera envoyé à cette adresse.');
      } else if (recovery) { await api.recover(email.trim(), code); setMessage('Votre accès est récupéré.'); setCode(''); }
      else { await api.verifyEmail(email.trim(), code); setMessage('Votre adresse e-mail est vérifiée.'); setCode(''); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Impossible de traiter votre demande.'); }
    finally { setBusy(false); }
  };
  return <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, gap: 12, borderWidth: 1, borderColor: '#f1e8e0' }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: '#df6516', fontWeight: '700' }}>{expanded ? 'Masquer' : 'Vérifier ou récupérer mon accès par e-mail'}</Text></Pressable>
    {expanded && <><Text style={{ color: '#666', lineHeight: 20 }}>{recovery ? 'Saisissez l’adresse déjà vérifiée sur votre ancien appareil.' : 'Vérifiez votre adresse pour retrouver vos rendez-vous sur un autre appareil.'}</Text><Pressable onPress={() => { setRecovery(!recovery); setCode(''); setMessage(''); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: '#df6516', fontWeight: '700' }}>{recovery ? 'Vérifier une adresse' : 'J’ai changé de téléphone'}</Text></Pressable><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" accessibilityLabel="Adresse e-mail" placeholder="Adresse e-mail" style={input} /><Pressable disabled={busy} onPress={() => void act(false)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: '#df6516', fontWeight: '700' }}>Envoyer un code</Text></Pressable><TextInput value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} accessibilityLabel="Code à six chiffres" placeholder="Code à 6 chiffres" style={input} /><Pressable disabled={busy} onPress={() => void act(true)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: '#df6516', fontWeight: '700' }}>{recovery ? 'Récupérer mon accès' : 'Vérifier mon e-mail'}</Text></Pressable>{!!message && <Text accessibilityRole="alert" style={{ color: '#555', lineHeight: 20 }}>{message}</Text>}</>}
  </View>;
}
const input = { borderWidth: 1, borderColor: '#e7e3df', borderRadius: 12, paddingHorizontal: 14, minHeight: 50, color: '#222' } as const;
