import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppServices } from '../../../composition/app-services-provider';
import type { UserLocation } from '../../../domain/location/entities';

type LocationState = {
  status: 'idle' | 'locating' | 'ready' | 'denied' | 'disabled' | 'error';
  location: UserLocation | null;
  message: string;
  canAskAgain: boolean;
};
export function useCurrentLocation() {
  const app = useAppServices();
  const [state, setState] = useState<LocationState>({ status: 'idle', location: null, message: '', canAskAgain: true });
  const lifecycle = useRef({ mounted: true, requestId: 0, pending: false });
  useEffect(() => {
    const current = lifecycle.current;
    current.mounted = true;
    return () => { current.mounted = false; current.requestId++; };
  }, []);
  const locate = useCallback(async () => {
    const current = lifecycle.current;
    if (current.pending) return;
    current.pending = true;
    const id = ++current.requestId;
    setState({ status: 'locating', location: null, message: '', canAskAgain: true });
    try {
      const result = await app.locateUser();
      if (!current.mounted || id !== current.requestId) return;
      if (result.status === 'ready') {
        setState({ status: 'ready', location: result.location, message: '', canAskAgain: true });
      } else {
        const messages = {
          denied: 'La localisation est refusée. Vous pouvez rechercher une ville ou continuer dans Google Maps.',
          disabled: 'Activez la localisation de votre appareil, puis réessayez.',
          error: 'Position indisponible. Réessayez à l’extérieur ou recherchez une ville.',
        };
        setState({
          status: result.status, location: null, message: messages[result.status],
          canAskAgain: result.status === 'denied' ? result.canAskAgain : true
        });
      }
    } finally { current.pending = false; }
  }, [app]);
  return { ...state, locate };
}
