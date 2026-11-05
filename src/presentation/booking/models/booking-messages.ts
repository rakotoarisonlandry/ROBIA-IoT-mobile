import { BookingError } from '../../../domain/booking/entities';

export function bookingErrorMessage(error: unknown): string {
  if (!(error instanceof BookingError)) return 'La réservation a échoué. Veuillez réessayer.';
  const messages = {
    'invalid-customer': 'Indiquez votre nom et un numéro de CIN à 12 chiffres.',
    'invalid-phone': 'Veuillez vérifier votre numéro de téléphone.',
    'invalid-services': 'Sélectionnez au moins un service valide.',
    'invalid-shop': 'Veuillez choisir une boutique.',
    'invalid-date': 'Veuillez choisir une date valide.',
    'invalid-time': 'Choisissez un créneau entre 08 h et 16 h, par tranches de 30 minutes.',
    'past-appointment': 'Ce créneau est passé. Choisissez une autre date.',
    'ticket-not-found': 'Ce ticket n’est plus disponible.',
  };
  return messages[error.code];
}
