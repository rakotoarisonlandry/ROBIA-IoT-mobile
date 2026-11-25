import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useAppServices } from '../../../composition/app-services-provider';
import type { LiveEvent } from '../../../application/booking/remote-appointments';

type Api = { configured: boolean; subscribe(onEvent: (event: LiveEvent) => void, onStatus?: (live: boolean) => void): () => void };

/**
 * One shared connection for the whole app: screens add listeners, the stream
 * is open only while someone listens and the app is in the foreground.
 */
function createHub(api: Api) {
  const listeners = new Set<(event: LiveEvent) => void>();
  const watchers = new Set<() => void>();
  let live = false;
  let stop: (() => void) | null = null;
  let appState = AppState.currentState;
  const setLive = (value: boolean) => { if (live !== value) { live = value; watchers.forEach(notify => notify()); } };
  const sync = () => {
    const wanted = api.configured && listeners.size > 0 && appState === 'active';
    if (wanted && !stop) stop = api.subscribe(event => listeners.forEach(listener => listener(event)), setLive);
    if (!wanted && stop) { stop(); stop = null; setLive(false); }
  };
  AppState.addEventListener('change', state => { appState = state; sync(); });
  return {
    listen(listener: (event: LiveEvent) => void) { listeners.add(listener); sync(); return () => { listeners.delete(listener); sync(); }; },
    watch(notify: () => void) { watchers.add(notify); return () => { watchers.delete(notify); }; },
    isLive: () => live,
  };
}
const hubs = new WeakMap<Api, ReturnType<typeof createHub>>();
function hubFor(api: Api) {
  let hub = hubs.get(api);
  if (!hub) { hub = createHub(api); hubs.set(api, hub); }
  return hub;
}

/** Calls `handler` for each live event; returns whether the stream is connected. */
export function useLiveEvents(handler: (event: LiveEvent) => void) {
  const { appointmentsApi } = useAppServices();
  const hub = hubFor(appointmentsApi);
  const latest = useRef(handler);
  useEffect(() => { latest.current = handler; });
  useEffect(() => hub.listen(event => latest.current(event)), [hub]);
  return useSyncExternalStore(hub.watch, hub.isLive, hub.isLive);
}
