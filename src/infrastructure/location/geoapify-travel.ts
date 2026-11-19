import { isValidCoordinates, type Coordinates } from '../../domain/location/entities';

export async function estimateDrivingTime(from: Coordinates, to: Coordinates): Promise<{ seconds: number; meters: number }> {
  const key = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!key || !isValidCoordinates(from) || !isValidCoordinates(to)) throw new Error('Travel unavailable');
  const params = new URLSearchParams({ waypoints: `${from.latitude},${from.longitude}|${to.latitude},${to.longitude}`, mode: 'drive', apiKey: key });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://api.geoapify.com/v1/routing?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error('Travel unavailable');
    const data = await response.json();
    const route = data.features?.[0]?.properties;
    if (!Number.isFinite(route?.time) || route.time < 0 || !Number.isFinite(route?.distance) || route.distance < 0) throw new Error('Travel unavailable');
    return { seconds: route.time, meters: route.distance };
  } finally { clearTimeout(timeout); }
}
