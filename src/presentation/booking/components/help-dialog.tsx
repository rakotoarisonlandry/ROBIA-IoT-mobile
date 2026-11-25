import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Brand } from '../../shared/brand';
import { Text } from '../../shared/components/text';
import { Icon } from './booking-icon';
import { Button } from './booking-button';
import { bookingStyles as s } from '../screens/booking-screen.styles';
import { GuideSpot } from '../../onboarding/guide-spot';

const STEPS = [
  { icon: 'user', title: 'Vos informations', text: 'Renseignez votre nom et votre CIN une seule fois.' },
  { icon: 'calendar', title: 'Service, boutique, horaire', text: 'Choisissez ce dont vous avez besoin et un créneau entre 08 h et 16 h.' },
  { icon: 'ticket', title: 'Votre ticket', text: 'Présentez le QR code et votre CIN originale au guichet.' },
];

export function HelpDialog({ visible, onClose, isRemote = false }: { visible: boolean; onClose: () => void; isRemote?: boolean }) {
  return (<Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={s.modalBackdrop}>
      <View style={s.modalCard}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          <GuideSpot name="help-content" order={1} text="L’aide récapitule la réservation et les documents à présenter. Le guide est terminé : vous pouvez le relancer avec « Revoir le guide »." style={s.modalHeading}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalEyebrow}>AIDE</Text>
              <Text accessibilityRole="header" style={s.modalTitle}>Comment ça marche ?</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" style={s.close}>
              <Icon name="close" color={Brand.ink} size={20} />
            </Pressable>
          </GuideSpot>
          <View style={{ gap: 4 }}>
            {STEPS.map((step, index) => (
              <View key={step.title} style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: index === 0 ? Brand.orange : Brand.orangeLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={step.icon} color={index === 0 ? Brand.white : Brand.orangeDark} size={20} />
                  </View>
                  {index < STEPS.length - 1 && <View style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: Brand.orangeLight, marginVertical: 4 }} />}
                </View>
                <View style={{ flex: 1, gap: 2, paddingTop: 2, paddingBottom: 14 }}>
                  <Text style={s.panelTitle}>{step.title}</Text>
                  <Text style={s.small}>{step.text}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={s.infoCard}>
            <Text style={s.small}>
              {isRemote
                ? 'Votre demande est transmise à la boutique, qui la confirme ou la refuse. Vous êtes notifié à chaque changement.'
                : 'Les rendez-vous sont conservés sur cet appareil et ne sont pas encore transmis à la boutique. Confirmez votre visite auprès de celle-ci.'}
            </Text>
          </View>
          <Button label="C’est compris" icon="check" onPress={onClose} />
        </ScrollView>
      </View>
    </View>
  </Modal>);
}
