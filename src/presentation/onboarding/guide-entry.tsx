import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text } from 'react-native';
import { useCopilot } from 'react-native-copilot';
import { useAppServices } from '../../composition/app-services-provider';
import type { BookingWorkflow } from '../booking/hooks/use-booking-workflow';
import { GUIDE_STEPS, matchesGuideStep, type GuideStep } from './guide-plan';
import { useGuideRuntime } from './guide-runtime';

type Snapshot = { tab: string; modal: boolean; step: number; help: boolean };
const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
async function bounded<T>(work: Promise<T>, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Guide layout timeout')), ms); })]);
  } finally { clearTimeout(timer); }
}

export function GuideEntry({ tab, navigate, model, ready }: { tab: string; navigate(tab: string): void; model: BookingWorkflow; ready: boolean }) {
  const copilot = useCopilot();
  const runtime = useGuideRuntime();
  const { guidePreferences } = useAppServices();
  const [error, setError] = useState('');
  const checked = useRef(false);
  const mounted = useRef(true);
  const session = useRef({ active: false, busy: false, internalStop: false, token: 0, index: 0, initial: null as Snapshot | null });
  const latest = useRef({ tab, navigate, model, copilot });
  useLayoutEffect(() => { latest.current = { tab, navigate, model, copilot }; }, [copilot, model, navigate, tab]);
  const controls = useMemo(() => {
    const state = session.current;
    const screen = (): Snapshot => ({ tab: latest.current.tab, modal: latest.current.model.modal, step: latest.current.model.step, help: latest.current.model.help });
    const hide = async () => {
      if (!latest.current.copilot.visible) return;
      state.internalStop = true;
      try { await bounded(latest.current.copilot.stop()); }
      finally { state.internalStop = false; }
    };
    const restore = () => {
      if (!mounted.current || !state.initial) return;
      const { model: current, navigate: go } = latest.current;
      current.setModal(state.initial.modal); current.setHelp(state.initial.help);
      current.setStep(state.initial.step); go(state.initial.tab);
    };
    const finish = async (remember = true) => {
      state.active = false; state.token++; state.busy = false;
      runtime.setBusy(false); runtime.setActive(false);
      try { await hide(); } catch {}
      restore();
      if (remember) void guidePreferences.markSeen('tour').catch(() => {});
    };
    const show = async (index: number) => {
      if (state.busy || !state.active) return;
      const token = ++state.token;
      state.busy = true; runtime.setBusy(true);
      const valid = () => mounted.current && state.active && state.token === token;
      try {
        await hide();
        if (!valid()) return;
        const step: GuideStep = GUIDE_STEPS[index];
        const { model: current, navigate: go } = latest.current;
        Keyboard.dismiss();
        current.setHelp(!!step.help); current.setModal(step.bookingStep != null);
        if (step.bookingStep != null) current.setStep(step.bookingStep);
        go(step.tab);
        const deadline = Date.now() + 8000;
        while (valid()) {
          if (Date.now() > deadline) throw new Error('Guide target not ready: ' + step.name);
          if (matchesGuideStep(step, screen()) && runtime.targets.get(step.name)?.ready()) break;
          await pause(50);
        }
        if (!valid()) return;
        // Allow native modal animation and Copilot registration to settle.
        await pause(step.bookingStep != null || step.help ? 450 : 120);
        if (!valid()) return;
        const target = runtime.targets.get(step.name);
        if (!target) throw new Error('Missing guide target');
        const size = await bounded(target.measure());
        if (!valid()) return;
        if (size.width <= 0 || size.height <= 0) throw new Error('Invisible guide target');
        state.index = index;
        await bounded(latest.current.copilot.start(step.name, null));
      } catch {
        if (valid()) {
          await finish(false);
          if (mounted.current) setError('Le guide a été interrompu. Touchez « Revoir le guide » pour réessayer.');
        }
      } finally {
        if (state.token === token && mounted.current) { state.busy = false; runtime.setBusy(false); }
      }
    };
    return {
      next: () => { if (!state.busy) void (state.index === GUIDE_STEPS.length - 1 ? finish() : show(state.index + 1)); },
      previous: () => { if (!state.busy && state.index > 0) void show(state.index - 1); },
      skip: () => { if (state.active) void finish(); },
      restart: () => {
        if (state.active || !mounted.current) return;
        checked.current = true;
        state.initial = screen(); state.active = true; state.index = 0;
        runtime.setActive(true); setError('');
        void show(0);
      },
    };
  }, [guidePreferences, runtime]);
  useImperativeHandle(runtime.controls, () => controls, [controls]);
  useEffect(() => {
    mounted.current = true;
    const state = session.current;
    return () => {
      mounted.current = false; state.active = false; state.token++;
      if (latest.current.copilot.visible) void latest.current.copilot.stop();
    };
  }, []);
  useEffect(() => {
    if (!ready || checked.current) return;
    let active = true;
    void guidePreferences.hasSeen('tour').catch(() => false).then(seen => {
      if (!active || checked.current) return;
      checked.current = true;
      if (!seen) controls.restart();
    });
    return () => { active = false; };
  }, [controls, guidePreferences, ready]);
  return <>
    <Pressable onPress={() => controls.restart()} disabled={!ready || runtime.active} style={s.link} accessibilityRole="button"><Text style={s.linkText}>ⓘ Revoir le guide</Text></Pressable>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </>;
}
const s = StyleSheet.create({
  link: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 5 },
  linkText: { fontSize: 11, color: '#e65b00', fontWeight: '600' },
  error: { fontSize: 12, color: '#a34000', marginBottom: 12 },
});
