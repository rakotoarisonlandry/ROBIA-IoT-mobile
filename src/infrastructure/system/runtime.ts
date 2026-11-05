import type { Clock, ReferenceGenerator } from '../../application/booking/ports';

export const systemClock: Clock = { now: () => new Date() };
// Demo-only IDs. A production backend must allocate globally unique references.
export const demoReferences: ReferenceGenerator = {
  generate: () => `ROBIA-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
};
