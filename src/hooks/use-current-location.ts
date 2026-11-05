import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { isValidCoordinates } from '@/utils/google-maps';

type LocationState = {
  status: 'idle' | 'locating' | 'ready' | 'denied' | 'disabled' | 'error';
  location: Location.LocationObject | null;
  message: string;
  canAskAgain: boolean;
};

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({
    status: 'idle', location: null, message: '', canAskAgain: true,
  });
  const requestId = useRef(0);
  const mounted = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; requestId.current++; };
  }, []);

  const locate = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    const id = ++requestId.current;
    const update = (next: LocationState) => {
      if (mounted.current && id === requestId.current) setState(next);
    };
    // Clear any previous position rather than presenting it as a fresh GPS reading.
    update({ status: 'locating', location: null, message: '', canAskAgain: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        update({ status: 'denied', location: null, canAskAgain: permission.canAskAgain,
          message: 'La localisation est refusée. Vous pouvez rechercher une ville ou continuer dans Google Maps.' });
        return;
      }
      if (!await Location.hasServicesEnabledAsync()) {
        update({ status: 'disabled', location: null, canAskAgain: true,
          message: 'Activez la localisation de votre appareil, puis réessayez.' });
        return;
      }
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('timeout')), 20_000);
        }),
      ]);
      if (!isValidCoordinates(location.coords)) throw new Error('invalid');
      update({ status: 'ready', location, message: '', canAskAgain: true });
    } catch {
      update({ status: 'error', location: null, canAskAgain: true,
        message: 'Position indisponible. Réessayez à l’extérieur ou recherchez une ville.' });
    } finally {
      if (timer) clearTimeout(timer);
      pending.current = false;
    }
  }, []);

  return { ...state, locate };
}
