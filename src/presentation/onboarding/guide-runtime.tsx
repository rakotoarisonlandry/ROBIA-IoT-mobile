import { createContext, useContext, type RefObject } from 'react';

export type GuideControls = { next(): void; previous(): void; skip(): void; restart(): void };
export type GuideTargetHandle = { ready(): boolean; measure(): Promise<{ width: number; height: number }> };
export type GuideRuntime = {
  controls: RefObject<GuideControls | null>;
  targets: Map<string, GuideTargetHandle>;
  busy: boolean;
  setBusy(busy: boolean): void;
  active: boolean;
  setActive(active: boolean): void;
};
export const GuideRuntimeContext = createContext<GuideRuntime | null>(null);
export function useGuideRuntime() {
  const runtime = useContext(GuideRuntimeContext);
  if (!runtime) throw new Error('GuideProvider is required');
  return runtime;
}
