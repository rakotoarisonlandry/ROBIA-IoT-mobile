import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { GuideSpot, GuideViewport, type GuideScrollHandle } from '../../onboarding/guide-spot';
import { useGuideRuntime } from '../../onboarding/guide-runtime';
import { BRAND_ORANGE as orange } from '../../shared/brand';
import { Icon } from './booking-icon';
import { QR } from './ticket-qr';
import { Button } from './booking-button';
import { bookingStyles as s } from '../screens/booking-screen.styles';
import type { BookingWorkflow } from '../hooks/use-booking-workflow';
export function BookingDialog({ model, wide }: { model: BookingWorkflow; wide: boolean }) {
  const scrollRef = useRef<GuideScrollHandle>(null);
  const { active: guideActive } = useGuideRuntime();
  const { modal, setModal, step, name, cin, phone, validate, setStep, services, setSelected, selected, shops, setShop, shop, setError, dates, setDay, day, appointmentTimes, setTime, time, confirm, ticket, busy, pdf, error } = model;
  const { checkTravel, cancelTravelCheck } = model;
  useEffect(() => {
    if (!modal || step !== 2 || guideActive) return;
    void checkTravel();
    return cancelTravelCheck;
  }, [modal, step, guideActive, shop, checkTravel, cancelTravelCheck]);
  return (<GuideViewport scrollRef={scrollRef}><Modal
    visible={modal}
    transparent
    animationType="fade"
    onRequestClose={() => setModal(false)}
  >
    <View style={s.modalBackdrop}>
      <View style={s.modalCard}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: wide ? 30 : 22 }}
          keyboardShouldPersistTaps="handled"
        >
          <GuideSpot key={step} name={['booking-customer', 'booking-services', 'booking-time', 'booking-ticket'][step]} order={1}
            text={[
              'Retrouvez vos informations enregistrées et modifiez-les si nécessaire.',
              'Choisissez un ou plusieurs services, puis votre boutique. Vous retrouverez ces choix dans votre ticket après confirmation.',
              'Choisissez le jour et un horaire entre 08 h et 16 h. La confirmation crée votre rendez-vous et son ticket. Pendant le guide, aucune réservation n’est effectuée.',
              'Retrouvez ici votre QR code, votre identifiant et le bouton pour enregistrer ou partager le ticket PDF.',
            ][step]} style={s.modalHeading}>
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
                    "Votre ticket est prêt",
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
          </GuideSpot>
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
              <Text style={s.input}>{name}</Text>
              <Text style={s.label}>Numéro de CIN *</Text>
              <Text style={s.input}>{cin}</Text>
              <Text style={s.label}>
                Téléphone <Text style={s.small}>(facultatif)</Text>
              </Text>
              <Text style={s.input}>{phone || 'Non renseigné'}</Text>
              <Pressable accessibilityRole="button" onPress={model.editProfile} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: orange, fontWeight: '700' }}>Modifier mes informations</Text></Pressable>
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
              <Text style={s.small}>À l’étape suivante, Robia vérifiera automatiquement le trajet avec votre position si vous l’autorisez. La position sera transmise à Geoapify pour ce calcul.</Text>
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
              <View style={{ backgroundColor: '#fff5ed', borderRadius: 16, padding: 16, gap: 4 }}>
                <Text style={{ fontSize: 12, color: '#d65a00', fontWeight: '700' }}>VOTRE VISITE</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#252525' }}>{dates[day].toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {time}</Text>
                <Text style={s.small}>Choisissez un jour puis un horaire.</Text>
              </View>
              <Text style={s.label}>Le jour qui vous convient</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {dates.map((d, i) => (
                  <Pressable
                    key={d.toISOString()}
                    onPress={() => setDay(i)}
                    accessibilityRole="button"
                    accessibilityLabel={d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    accessibilityState={{ selected: day === i }}
                    style={{ width: 67, minHeight: 90, borderRadius: 16, borderWidth: 1, borderColor: day === i ? orange : '#ececef', backgroundColor: day === i ? '#fff0e5' : 'white', alignItems: 'center', justifyContent: 'center', gap: 3 }}
                  >
                    <Text style={[s.small, day === i && { color: orange }]}>
                      {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </Text>
                    <Text
                      style={[s.dayNumber, day === i && { color: orange }]}
                    >
                      {d.getDate()}
                    </Text>
                    <Text style={[s.small, day === i && { color: orange }]}>{d.toLocaleDateString('fr-FR', { month: 'short' })}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={s.label}>Votre heure de rendez-vous</Text>
              <Text style={s.small}>{model.isRemote ? 'Places disponibles communiquées par la boutique.' : 'Places simulées, non synchronisées avec la boutique. Elles ne reflètent pas les disponibilités réelles.'}</Text>
              {!!model.slotError && <View style={{ gap: 6 }}><Text accessibilityRole="alert" style={s.error}>{model.slotError}</Text><Pressable accessibilityRole="button" onPress={() => void model.reloadSlots()} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: orange, fontWeight: '700' }}>Réessayer</Text></Pressable></View>}
              {!model.slotError && model.availableFor(time) === null && <Text style={s.small}>Chargement des créneaux…</Text>}
              <View style={s.times}>
                {appointmentTimes.map((t) => {
                  const available = model.availableFor(t);
                  const disabled = available === null || available === 0;
                  return (
                  <Pressable
                    key={t}
                    onPress={() => setTime(t)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={`${t}, ${available === null ? 'chargement' : available === 0 ? 'complet ou indisponible' : `${available} place${available > 1 ? 's' : ''}${model.isRemote ? '' : ' simulée'}`}`}
                    accessibilityState={{ selected: time === t && !disabled, disabled }}
                    style={[s.time, { minHeight: 58, borderRadius: 12, justifyContent: 'center', gap: 4 }, disabled && { backgroundColor: '#f4f4f4' }, time === t && !disabled && s.optionSelected]}
                  >
                    <Text
                      style={{
                        fontWeight: "600",
                        color: disabled ? '#aaa' : time === t ? orange : "#555",
                      }}
                    >
                      {t}
                    </Text>
                    <Text style={{ fontSize: 10, color: disabled ? '#999' : available !== null && available <= 2 ? '#b65920' : '#62846b', fontWeight: '600' }}>{available === null ? '…' : available === 0 ? 'Complet' : `${available} place${available > 1 ? 's' : ''}`}</Text>
                  </Pressable>
                ); })}
              </View>
              {model.availableFor(time) === 0 && <Text accessibilityRole="alert" style={s.error}>Cet horaire est complet. Choisissez un autre créneau.</Text>}
              <View style={s.summary}>
                <Text style={s.shopName}>{shops[shop].name}</Text>
                <Text style={s.small}>
                  {selected.map((i) => services[i].name).join(" · ")}
                </Text>
                <Text style={s.small}>
                  Conseiller : {shops[shop].agent}
                </Text>
              </View>
              <View style={{ backgroundColor: '#fff8f2', borderRadius: 14, padding: 16, gap: 10 }}>
                <Text style={s.shopName}>Votre trajet</Text>
                <Text style={s.small}>Le temps en voiture est vérifié automatiquement depuis votre position actuelle, avec 15 minutes de marge. La position est transmise à Geoapify pour ce calcul.</Text>
                {model.currentTravel && model.travelAssessment ? <>
                  <Text style={{ color: model.travelAssessment.isTight ? '#a54422' : '#427257', fontWeight: '700', lineHeight: 20 }}>
                    {model.travelAssessment.isTight ? 'Ce créneau semble trop proche si vous partez maintenant.' : 'Le trajet semble possible si vous partez à temps.'}
                  </Text>
                  <Text style={s.small}>Trajet estimé : {Math.ceil(model.currentTravel.seconds / 60)} min · {(model.currentTravel.meters / 1000).toFixed(1)} km. {model.travelAssessment.isTight ? 'Arrivée estimée avec marge : ' : 'Départ conseillé au plus tard : '}{(model.travelAssessment.isTight ? model.travelAssessment.earliestArrival : model.travelAssessment.latestDeparture).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.</Text>
                  <Text style={s.small}>Estimation indicative, sans garantie sur le trafic ou l’état des routes.</Text>
                  {model.travelAssessment.isTight && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: model.riskAccepted }} onPress={() => model.setRiskAccepted(!model.riskAccepted)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}><View style={{ width: 22, height: 22, borderWidth: 1, borderColor: orange, borderRadius: 5, backgroundColor: model.riskAccepted ? orange : 'white', alignItems: 'center', justifyContent: 'center' }}>{model.riskAccepted && <Icon name="check" size={15} color="white" />}</View><Text style={[s.small, { flex: 1, color: '#555' }]}>J’ai prévu mon déplacement et souhaite garder ce créneau.</Text></Pressable>}
                </> : <>{!model.checkingTravel && <><Text style={s.small}>Trajet non vérifié pour cette boutique.</Text><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: model.unverifiedAccepted }} onPress={() => model.setUnverifiedAccepted(!model.unverifiedAccepted)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}><View style={{ width: 22, height: 22, borderWidth: 1, borderColor: orange, borderRadius: 5, backgroundColor: model.unverifiedAccepted ? orange : 'white', alignItems: 'center', justifyContent: 'center' }}>{model.unverifiedAccepted && <Icon name="check" size={15} color="white" />}</View><Text style={[s.small, { flex: 1, color: '#555' }]}>Je poursuis sans vérifier le trajet.</Text></Pressable></>}</>}
                {!!model.travelError && <Text accessibilityRole="alert" style={s.error}>{model.travelError}</Text>}
                <Pressable accessibilityRole="button" disabled={model.checkingTravel} onPress={() => void model.checkTravel()} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {model.checkingTravel ? <ActivityIndicator size="small" color={orange} /> : <Icon name="pin" size={17} color={orange} />}
                  <Text style={{ color: orange, fontWeight: '700' }}>{model.checkingTravel ? 'Vérification du trajet…' : model.currentTravel ? 'Actualiser l’estimation' : 'Réessayer la vérification'}</Text>
                </Pressable>
              </View>
              <View style={{ backgroundColor: '#fff5ed', borderRadius: 14, padding: 16, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><Text style={[s.shopName, { flex: 1 }]}>Vérifiez vos informations</Text><Pressable accessibilityRole="button" onPress={model.editProfile} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: orange, fontWeight: '700' }}>Modifier</Text></Pressable></View>
                <Text style={s.small}>Nom : {name}</Text>
                <Text style={s.small}>CIN : {cin}</Text>
                <Text style={s.small}>Téléphone : {phone || 'Non renseigné'}</Text>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: model.profileConfirmed }} onPress={() => model.setProfileConfirmed(!model.profileConfirmed)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}><View style={{ width: 22, height: 22, borderWidth: 1, borderColor: orange, borderRadius: 5, backgroundColor: model.profileConfirmed ? orange : 'white', alignItems: 'center', justifyContent: 'center' }}>{model.profileConfirmed && <Icon name="check" size={15} color="white" />}</View><Text style={[s.small, { flex: 1, color: '#555' }]}>Je confirme que ces informations sont exactes.</Text></Pressable>
              </View>
              {!model.isRemote && <Text style={s.small}>
                Les horaires ne sont pas synchronisés avec la boutique.
                Vérifiez les disponibilités auprès de celle-ci.
              </Text>}
              <Button label="Enregistrer mon rendez-vous" disabled={guideActive || model.checkingTravel || model.availableFor(time) === null || model.availableFor(time) === 0} onPress={confirm} />
            </View>
          )}
          {step === 3 && ticket && (
            <View style={s.form}>
              <View style={s.finalTicket}>
                <View style={s.confirmed}>
                  <Text style={s.available}>{model.isRemote ? ({ pending: 'En attente de confirmation', confirmed: 'Confirmé par la boutique', rejected: 'Refusé par la boutique', cancelled: 'Annulé' }[ticket.status ?? 'pending']) : '✓ Enregistré sur cet appareil'}</Text>
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
              <Text style={[s.small, { textAlign: 'center' }]}>{model.isRemote ? 'La demande est transmise à la boutique. Le QR code ne constitue pas une validation de votre visite.' : 'Ce ticket n’a pas été transmis à la boutique. Confirmez votre rendez-vous auprès de celle-ci.'}</Text>
              <Text style={[s.small, { textAlign: "center" }]}>
                Présentez ce QR code et votre CIN originale.{"\n"}Pensez à
                arriver 10 minutes à l’avance.
              </Text>
              {!!model.reminderMessage && <Text accessibilityRole="alert" style={[s.small, { textAlign: 'center' }]}>{model.reminderMessage}</Text>}
              {shops[ticket.shop] && <Pressable accessibilityRole="button" onPress={() => {
                setModal(false);
                router.push({ pathname: '/localisation', params: { shopId: shops[ticket.shop].id, itineraire: '1' } });
              }} style={[s.option, { justifyContent: 'center', gap: 10 }]}>
                <Icon name="pin" color={orange} size={18} />
                <Text style={{ color: orange, fontWeight: '700' }}>Voir l’itinéraire vers la boutique</Text>
              </Pressable>}
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
  </Modal></GuideViewport>);
}
