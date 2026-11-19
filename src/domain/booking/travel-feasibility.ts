/** A conservative buffer, in addition to the estimated driving time. */
export const ARRIVAL_BUFFER_SECONDS = 15 * 60;
export const TRAVEL_ESTIMATE_MAX_AGE_MS = 15 * 60 * 1000;

export type TravelAssessment = { isTight: boolean; latestDeparture: Date; earliestArrival: Date };

export function assessTravel(appointment: Date, now: Date, travelSeconds: number): TravelAssessment {
  if (!Number.isFinite(appointment.getTime()) || !Number.isFinite(now.getTime()) || !Number.isFinite(travelSeconds) || travelSeconds < 0) {
    throw new Error('Invalid travel assessment');
  }
  const requiredMs = (travelSeconds + ARRIVAL_BUFFER_SECONDS) * 1000;
  return {
    isTight: now.getTime() + requiredMs > appointment.getTime(),
    latestDeparture: new Date(appointment.getTime() - requiredMs),
    earliestArrival: new Date(now.getTime() + requiredMs),
  };
}
