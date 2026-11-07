export const GUIDE_STEPS = [
  { name: 'home-reserve', tab: 'Accueil' },
  { name: 'home-services', tab: 'Accueil' },
  { name: 'home-shops', tab: 'Accueil' },
  { name: 'booking-customer', tab: 'Accueil', bookingStep: 0 },
  { name: 'booking-services', tab: 'Accueil', bookingStep: 1 },
  { name: 'booking-time', tab: 'Accueil', bookingStep: 2 },
  { name: 'shops-position', tab: 'Les boutiques' },
  { name: 'shops-search', tab: 'Les boutiques' },
  { name: 'shops-map', tab: 'Les boutiques' },
  { name: 'appointments-list', tab: 'Mes rendez-vous' },
  { name: 'tickets-list', tab: 'Mes tickets' },
  { name: 'help-content', tab: 'Mes tickets', help: true },
] as const;
export type GuideStep = { name: string; tab: string; bookingStep?: number; help?: boolean };

/** Match the rendered screen before asking Copilot to measure a target. */
export function matchesGuideStep(step: GuideStep, screen: { tab: string; modal: boolean; step: number; help: boolean }) {
  return screen.tab === step.tab && screen.help === !!step.help
    && screen.modal === (step.bookingStep != null)
    && (step.bookingStep == null || screen.step === step.bookingStep);
}
