import { useEffect, useState, type RefObject } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCopilot } from 'react-native-copilot';
import { useAppServices } from '../../composition/app-services-provider';
import type { GuideScope } from '../../application/onboarding/ports';

export function GuideEntry({ scope, scrollRef, ready }: { scope: GuideScope | null; scrollRef: RefObject<ScrollView | null>; ready: boolean }) {
  const { start, stop, totalStepsNumber } = useCopilot();
  const { guidePreferences } = useAppServices();
  const [promptScope, setPromptScope] = useState<GuideScope | null>(null);
  useEffect(() => {
    if (!scope || !ready || totalStepsNumber < 3) return;
    let active = true;
    void guidePreferences.hasSeen(scope).then(seen => { if (active && !seen) setPromptScope(scope); }).catch(() => {});
    return () => { active = false; };
  }, [guidePreferences, ready, scope, totalStepsNumber]);
  useEffect(() => () => { void stop(); }, [scope, stop]);

  if (!scope) return null;
  const dismiss = () => {
    setPromptScope(null);
    void guidePreferences.markSeen(scope).catch(() => {});
  };
  const launch = () => {
    dismiss();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    requestAnimationFrame(() => { void start(scope === 'home' ? 'home-reserve' : 'shops-position', scrollRef.current).catch(() => stop()); });
  };
  return <>
    <Pressable onPress={launch} disabled={!ready || totalStepsNumber < 3} style={s.link} accessibilityRole="button"><Text style={s.linkText}>ⓘ Découvrir cet écran</Text></Pressable>
    <Modal transparent visible={promptScope === scope} animationType="fade" onRequestClose={dismiss}>
      <View style={s.backdrop}><View style={s.card}>
        <Text style={s.eyebrow}>UN PETIT TOUR ?</Text>
        <Text style={s.title}>{scope === 'home' ? 'Votre première visite, en toute simplicité.' : 'Trouvez votre chemin dans Robia.'}</Text>
        <Text style={s.description}>Laissez-vous guider sur les boutons utiles. Vous pourrez passer le guide à tout moment et le relancer ici.</Text>
        <Pressable style={s.primary} onPress={launch}><Text style={s.primaryText}>Me guider</Text></Pressable>
        <Pressable style={s.later} onPress={dismiss}><Text style={s.laterText}>Plus tard</Text></Pressable>
      </View></View>
    </Modal>
  </>;
}
const s = StyleSheet.create({
  link: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 5 },
  linkText: { fontSize: 11, color: '#e65b00', fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,18,22,.5)', padding: 24, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 390, padding: 27, backgroundColor: 'white', borderRadius: 18, gap: 15 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: '#ff6600' },
  title: { fontSize: 24, fontWeight: '700', color: '#252525', lineHeight: 31, letterSpacing: -.6 },
  description: { fontSize: 13, color: '#888', lineHeight: 22 },
  primary: { backgroundColor: '#ff6600', borderRadius: 9, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  primaryText: { fontSize: 13, fontWeight: '700', color: 'white' },
  later: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  laterText: { fontSize: 12, color: '#888' },
});
