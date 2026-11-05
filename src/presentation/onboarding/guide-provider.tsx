import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CopilotProvider, useCopilot } from 'react-native-copilot';

function GuideTooltip() {
  const { currentStep, currentStepNumber, totalStepsNumber, isFirstStep, isLastStep, goToNext, goToPrev, stop } = useCopilot();
  return <View accessibilityViewIsModal>
    <View style={s.heading}><Text style={s.eyebrow}>BIENVENUE CHEZ ROBIA</Text><Text style={s.counter}>{currentStepNumber} / {totalStepsNumber}</Text></View>
    <Text style={s.text} accessibilityLiveRegion="polite">{currentStep?.text}</Text>
    <View style={s.actions}>
      <Pressable style={s.textButton} onPress={() => void stop()} accessibilityRole="button"><Text style={s.muted}>Passer</Text></Pressable>
      <View style={{ flex: 1 }} />
      {!isFirstStep && <Pressable style={s.textButton} onPress={() => void goToPrev()} accessibilityRole="button"><Text style={s.muted}>Retour</Text></Pressable>}
      <Pressable style={s.next} onPress={() => void (isLastStep ? stop() : goToNext())} accessibilityRole="button"><Text style={s.nextText}>{isLastStep ? 'C’est parti' : 'Suivant'}</Text></Pressable>
    </View>
  </View>;
}
const NoStepNumber = () => null;
export function GuideProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  return <CopilotProvider overlay="svg" animated animationDuration={250} tooltipComponent={GuideTooltip}
    stepNumberComponent={NoStepNumber} backdropColor="rgba(15,18,22,.65)" arrowColor="white"
    androidStatusBarVisible stopOnOutsideClick
    tooltipStyle={{ borderRadius: 15, padding: 18, width: Math.min(width - 32, 360), maxWidth: width - 32 }}>
    {children}
  </CopilotProvider>;
}
const s = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.3, color: '#ff6600' },
  counter: { fontSize: 11, color: '#999' },
  text: { fontSize: 14, color: '#333', lineHeight: 23, marginTop: 15 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 17, gap: 6 },
  textButton: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
  muted: { fontSize: 12, color: '#888' },
  next: { minHeight: 44, paddingHorizontal: 17, backgroundColor: '#ff6600', borderRadius: 8, justifyContent: 'center' },
  nextText: { color: 'white', fontSize: 12, fontWeight: '700' },
});
