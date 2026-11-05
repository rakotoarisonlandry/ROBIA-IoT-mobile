import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BRAND_ORANGE as orange } from '../../shared/brand';
import { Icon } from './booking-icon';
import { QR } from './ticket-qr';
import { Button } from './booking-button';
import { bookingStyles as s } from '../screens/booking-screen.styles';
import type { BookingWorkflow } from '../hooks/use-booking-workflow';
export function BookingDialog({ model, wide }: { model: BookingWorkflow; wide: boolean }) {
  const { modal, setModal, step, name, setName, cin, setCin, phone, setPhone, validate, setStep, services, setSelected, selected, shops, setShop, shop, setError, dates, setDay, day, appointmentTimes, setTime, time, confirm, ticket, busy, pdf, error } = model;
  return (<Modal
    visible={modal}
    transparent
    animationType="fade"
    onRequestClose={() => setModal(false)}
  >
    <View style={s.modalBackdrop}>
      <View style={s.modalCard}>
        <ScrollView
          contentContainerStyle={{ padding: wide ? 30 : 22 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.modalHeading}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>
                {step === 3 ? "VOTRE TICKET" : `ÉTAPE ${step + 1} SUR 3`}
              </Text>
              <Text style={s.modalTitle}>
                {
                  [
                    "Faisons connaissance",
                    "Votre visite en boutique",
                    "Choisissez votre créneau",
                    "Vous avez votre place !",
                  ][step]
                }
              </Text>
            </View>
            <Pressable
              onPress={() => setModal(false)}
              accessibilityLabel="Fermer"
              style={s.close}
            >
              <Icon name="close" />
            </Pressable>
          </View>
          {step < 3 && (
            <View style={s.progress}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    s.progressSegment,
                    i <= step && { backgroundColor: orange },
                  ]}
                />
              ))}
            </View>
          )}
          {step === 0 && (
            <View style={s.form}>
              <Text style={s.subtitle}>
                Quelques informations pour préparer votre accueil.
              </Text>
              <Text style={s.label}>Nom complet *</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Votre nom et prénom"
                autoComplete="name"
              />
              <Text style={s.label}>Numéro de CIN *</Text>
              <TextInput
                style={s.input}
                value={cin}
                onChangeText={setCin}
                placeholder="12 chiffres"
                keyboardType="number-pad"
                maxLength={12}
              />
              <Text style={s.label}>
                Téléphone <Text style={s.small}>(facultatif)</Text>
              </Text>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="034 00 000 00"
                keyboardType="phone-pad"
              />
              <Text style={s.small}>
                Votre CIN originale sera demandée lors de votre visite.
              </Text>
              <Button
                label="Continuer"
                onPress={() => {
                  if (validate()) setStep(1);
                }}
              />
            </View>
          )}
          {step === 1 && (
            <View style={s.form}>
              <Text style={s.label}>
                Quel(s) service(s) souhaitez-vous ?
              </Text>
              {services.map((v, i) => (
                <Pressable
                  key={v.name}
                  onPress={() =>
                    setSelected(
                      selected.includes(i)
                        ? selected.filter((v) => v !== i)
                        : [...selected, i],
                    )
                  }
                  style={[
                    s.option,
                    selected.includes(i) && s.optionSelected,
                  ]}
                >
                  <Icon
                    name={v.icon}
                    color={selected.includes(i) ? orange : "#999"}
                  />
                  <Text style={{ flex: 1, fontWeight: "600" }}>
                    {v.name}
                  </Text>
                  {selected.includes(i) && (
                    <Icon name="check" color={orange} size={18} />
                  )}
                </Pressable>
              ))}
              <Text style={s.label}>Votre boutique</Text>
              {shops.map((v, i) => (
                <Pressable
                  key={v.name}
                  onPress={() => setShop(i)}
                  style={[s.option, shop === i && s.optionSelected]}
                >
                  <Icon name="shop" color={shop === i ? orange : "#999"} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.profileName}>{v.name}</Text>
                    <Text style={s.small}>{v.address}</Text>
                  </View>
                  {shop === i && (
                    <Icon name="check" color={orange} size={18} />
                  )}
                </Pressable>
              ))}
              <Button
                label="Choisir mon horaire"
                onPress={() => {
                  if (!selected.length) {
                    setError("Sélectionnez au moins un service.");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
              />
            </View>
          )}
          {step === 2 && (
            <View style={s.form}>
              <Text style={s.label}>Le jour qui vous convient</Text>
              <View style={s.days}>
                {dates.map((d, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setDay(i)}
                    style={[s.day, day === i && s.optionSelected]}
                  >
                    <Text style={[s.small, day === i && { color: orange }]}>
                      {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </Text>
                    <Text
                      style={[s.dayNumber, day === i && { color: orange }]}
                    >
                      {d.getDate()}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.label}>Votre heure de rendez-vous</Text>
              <View style={s.times}>
                {appointmentTimes.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTime(t)}
                    style={[s.time, time === t && s.optionSelected]}
                  >
                    <Text
                      style={{
                        fontWeight: "600",
                        color: time === t ? orange : "#555",
                      }}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={s.summary}>
                <Text style={s.shopName}>{shops[shop].name}</Text>
                <Text style={s.small}>
                  {selected.map((i) => services[i].name).join(" · ")}
                </Text>
                <Text style={s.small}>
                  Conseiller : {shops[shop].agent}
                </Text>
              </View>
              <Text style={s.small}>
                Mode démonstration : ces horaires ne sont pas synchronisés
                avec la boutique.
              </Text>
              <Button label="Confirmer mon rendez-vous" onPress={confirm} />
            </View>
          )}
          {step === 3 && ticket && (
            <View style={s.form}>
              <View style={s.finalTicket}>
                <View style={s.confirmed}>
                  <Text style={s.available}>✓ Ticket de démonstration</Text>
                </View>
                <Text style={s.ticketId}>{ticket.id}</Text>
                <Text style={s.shopName}>{shops[ticket.shop].name}</Text>
                <Text style={s.small}>
                  {ticket.date} · {ticket.time}
                </Text>
                <View style={s.ticketDash} />
                <QR value={ticket.reference} />
                <Text style={s.profileName}>{ticket.name}</Text>
                <Text style={s.small}>
                  {ticket.services.map((i) => services[i].name).join(" · ")}
                </Text>
                <Text style={s.small}>
                  Conseiller : {shops[ticket.shop].agent}
                </Text>
              </View>
              <Text style={[s.small, { textAlign: "center" }]}>
                Présentez ce QR code et votre CIN originale.{"\n"}Pensez à
                arriver 10 minutes à l’avance.
              </Text>
              <Button
                label={busy ? "Préparation…" : "Télécharger le ticket PDF"}
                secondary
                onPress={() => {
                  if (!busy) void pdf(ticket);
                }}
              />
              <Text style={s.small}>
                {Platform.OS === "web"
                  ? "Votre ticket PDF sera enregistré dans les téléchargements de votre navigateur."
                  : "Enregistrez ou partagez votre PDF depuis le menu de votre téléphone."}
              </Text>
            </View>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          {step > 0 && step < 3 && (
            <Pressable
              onPress={() => {
                setStep(step - 1);
                setError("");
              }}
              style={{ paddingTop: 18 }}
            >
              <Text style={s.small}>← Étape précédente</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>);
}
