import { Modal, Pressable, Text, View } from 'react-native';
import { Icon } from './booking-icon';
import { Button } from './booking-button';
import { bookingStyles as s } from '../screens/booking-screen.styles';
export function HelpDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (<Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={s.modalBackdrop}>
      <View style={[s.modalCard, { padding: 28, gap: 18 }]}>
        <View style={s.modalHeading}>
          <Text style={s.modalTitle}>Comment ça marche ?</Text>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Fermer"
          >
            <Icon name="close" />
          </Pressable>
        </View>
        <Text style={s.subtitle}>
          1. Renseignez votre nom et votre CIN.{"\n\n"}2. Choisissez vos
          services, votre boutique et votre horaire entre 08 h et 16 h.
          {"\n\n"}3. Téléchargez votre ticket PDF et présentez son QR code
          avec votre CIN.
        </Text>
        <Text style={s.small}>
          Cette version utilise des données de démonstration. Les
          réservations sont conservées pendant cette session uniquement. La
          connexion au système des agents commerciaux sera nécessaire pour
          confirmer les disponibilités et attribuer les numéros de file.
        </Text>
        <Button label="C’est compris" onPress={onClose} />
      </View>
    </View>
  </Modal>);
}
