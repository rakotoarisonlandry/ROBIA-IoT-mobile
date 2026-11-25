import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Brand } from '../shared/brand';
import { Text } from '../shared/components/text';
import { CopilotProvider, useCopilot } from 'react-native-copilot';
import { GUIDE_STEPS } from './guide-plan';
import { GuideRuntimeContext, useGuideRuntime, type GuideControls, type GuideTargetHandle } from './guide-runtime';

function GuideTooltip() {
  const { currentStep } = useCopilot();
  const { controls, busy } = useGuideRuntime();
  const index = GUIDE_STEPS.findIndex(step => step.name === currentStep?.name);
  return <View accessibilityViewIsModal accessibilityLabel="Visite guidée de Robia">
    <View style={s.heading}><Text style={s.eyebrow}>BIENVENUE CHEZ ROBIA</Text><Text style={s.counter}>{Math.max(0, index) + 1} / {GUIDE_STEPS.length}</Text></View>
    <Text style={s.text} accessibilityLiveRegion="polite">{currentStep?.text}</Text>
    <View style={s.actions}>
      <Pressable style={s.textButton} onPress={() => controls.current?.skip()} accessibilityRole="button"><Text style={s.muted}>Passer</Text></Pressable>
      <View style={{ flex: 1 }} />
      {index > 0 && <Pressable disabled={busy} style={s.textButton} onPress={() => controls.current?.previous()} accessibilityRole="button"><Text style={s.muted}>Retour</Text></Pressable>}
      <Pressable disabled={busy} style={[s.next, busy && { opacity: .5 }]} onPress={() => controls.current?.next()} accessibilityRole="button"><Text style={s.nextText}>{index === GUIDE_STEPS.length - 1 ? 'Terminer' : 'Suivant'}</Text></Pressable>
    </View>
  </View>;
}
const NoStepNumber = () => null;
export function GuideProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const controls = useRef<GuideControls | null>(null);
  const [targets] = useState(() => new Map<string, GuideTargetHandle>());
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(false);
  const runtime = useMemo(() => ({ controls, targets, busy, setBusy, active, setActive }), [active, busy, targets]);
  return <GuideRuntimeContext.Provider value={runtime}>
    <CopilotProvider overlay={Platform.OS === 'web' ? 'view' : 'svg'} animated={false} animationDuration={0} tooltipComponent={GuideTooltip}
      stepNumberComponent={NoStepNumber} backdropColor="rgba(15,18,22,.65)" arrowColor="white"
      androidStatusBarVisible stopOnOutsideClick={false}
      tooltipStyle={{ borderRadius: 24, padding: 20, width: Math.min(width - 32, 360) }}>
      {children}
    </CopilotProvider>
  </GuideRuntimeContext.Provider>;
}
const s = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: Brand.orange },
  counter: { fontSize: 12, fontWeight: '700', color: Brand.textTertiary, backgroundColor: Brand.canvas, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden' },
  text: { fontSize: 15, color: Brand.ink, lineHeight: 23, marginTop: 14, fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 6 },
  textButton: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  muted: { fontSize: 14, color: Brand.textSecondary, fontWeight: '600' },
  next: { minHeight: 46, paddingHorizontal: 20, backgroundColor: Brand.orange, borderRadius: 14, justifyContent: 'center', boxShadow: '0px 8px 18px rgba(255,102,0,0.28)' },
  nextText: { color: Brand.white, fontSize: 15, fontWeight: '700' },
});
