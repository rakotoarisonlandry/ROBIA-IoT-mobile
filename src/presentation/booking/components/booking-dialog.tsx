import { Fragment, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GuideSpot, GuideViewport, type GuideScrollHandle } from '../../onboarding/guide-spot';
import { useGuideRuntime } from '../../onboarding/guide-runtime';
import { Brand } from '../../shared/brand';
import { PressableScale } from '../../shared/components/pressable-scale';
import { Text } from '../../shared/components/text';
import { Fonts } from '../../shared/theme';
import { Icon } from './booking-icon';
import { QR } from './ticket-qr';
import { Button } from './booking-button';
import { CheckRow } from './check-row';
import { StatusBadge } from './status-badge';
import { bookingStyles as s } from '../screens/booking-screen.styles';
import type { BookingWorkflow } from '../hooks/use-booking-workflow';

const orange = Brand.orange;
const STEP_LABELS = ['Vos infos', 'Services', 'Créneau'];
const TITLES = ['Faisons connaissance', 'Votre visite', 'Choisissez votre créneau', 'Votre ticket est prêt'];
const GUIDE_TEXT = [
  'Retrouvez vos informations enregistrées et modifiez-les si nécessaire.',
  'Choisissez un ou plusieurs services, puis votre boutique. Vous retrouverez ces choix dans votre ticket après confirmation.',
  'Choisissez le jour et un horaire entre 08 h et 16 h. La confirmation crée votre rendez-vous et son ticket. Pendant le guide, aucune réservation n’est effectuée.',
  'Retrouvez ici votre QR code, votre identifiant et le bouton pour enregistrer ou partager le ticket PDF.',
];
const longDate = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoKey}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <View style={s.stepper} accessibilityLabel={`Étape ${step + 1} sur 3 : ${STEP_LABELS[step]}`}>
      {STEP_LABELS.map((label, i) => (
        <Fragment key={label}>
          {i > 0 && <View style={[s.stepLine, i <= step && { backgroundColor: orange }]} />}
          <View style={[s.stepDot, i < step && s.stepDotDone, i === step && s.stepDotCurrent]}>
            {i < step ? <Icon name="check" size={15} color="white" /> : <Text style={[s.stepNumber, i === step && { color: Brand.white }]}>{i + 1}</Text>}
          </View>
          {i === step && <Text style={[s.stepLabel, { color: Brand.ink }]}>{label}</Text>}
        </Fragment>
      ))}
    </View>
  );
}

export function BookingDialog({ model, wide }: { model: BookingWorkflow; wide: boolean }) {
  const scrollRef = useRef<GuideScrollHandle>(null);
  const insets = useSafeAreaInsets();
  const { active: guideActive } = useGuideRuntime();
  const [submitting, setSubmitting] = useState(false);
  const { modal, setModal, step, name, cin, phone, validate, setStep, services, setSelected, selected, shops, bookableShops, setShop, shop, setError, dates, setDay, day, appointmentTimes, setTime, time, confirm, ticket, busy, pdf, error } = model;
  const { checkTravel, cancelTravelCheck } = model;
  useEffect(() => {
    if (!modal || step !== 2 || guideActive) return;
    void checkTravel();
    return cancelTravelCheck;
  }, [modal, step, guideActive, shop, checkTravel, cancelTravelCheck]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const selectedShop = shops[shop];
  const currentAvailability = model.availableFor(time);
  const slotsLoading = step === 2 && !model.slotError && (!model.slotsLoaded || currentAvailability === null);
  const noSlots = step === 2 && !slotsLoading && !model.slotError && dates.length === 0;
  const allFull = step === 2 && !slotsLoading && !noSlots && !model.slotError && appointmentTimes.every(t => model.availableFor(t) === 0);
  const travelAckMissing = model.currentTravel
    ? !!model.travelAssessment?.isTight && !model.riskAccepted
    : !model.checkingTravel && !model.unverifiedAccepted;

  const blocker =
    guideActive ? 'Le guide est en cours : aucune réservation n’est effectuée.'
      : slotsLoading ? 'Chargement des créneaux…'
        : noSlots ? 'Aucun créneau ouvert dans cette boutique pour le moment.'
        : model.slotError ? 'Les créneaux n’ont pas pu être chargés.'
          : currentAvailability === 0 ? 'Cet horaire est complet. Choisissez un autre créneau.'
            : model.checkingTravel ? 'Vérification du trajet en cours…'
              : travelAckMissing ? (model.currentTravel ? 'Confirmez que vous avez prévu votre déplacement.' : 'Vérifiez le trajet ou cochez « Je poursuis sans vérifier le trajet ».')
                : !model.profileConfirmed ? 'Cochez « Je confirme que ces informations sont exactes ».'
                  : '';

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try { await confirm(); } finally { setSubmitting(false); }
  };
  const close = () => setModal(false);
  const goBack = () => { setStep(step - 1); setError(''); };

  const footer = (
    <View style={[s.dialogFooter, { paddingBottom: wide ? 20 : Math.max(insets.bottom, 12) + 4 }]}>
      {!!error && (
        <View style={s.errorBox}>
          <Text accessibilityRole="alert" style={s.error}>{error}</Text>
        </View>
      )}
      {step === 0 && <Button label="Continuer" onPress={() => { if (validate()) setStep(1); }} />}
      {step === 1 && (
        <Button
          label={selected.length > 1 ? `Choisir mon horaire · ${selected.length} services` : 'Choisir mon horaire'}
          onPress={() => {
            if (!selected.length) { setError('Sélectionnez au moins un service.'); return; }
            setError('');
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <>
          {!!blocker && !error && <Text style={s.footerHint}>{blocker}</Text>}
          <Button
            label={submitting ? 'Enregistrement…' : 'Confirmer le rendez-vous'}
            loading={submitting}
            icon="check"
            disabled={!!blocker}
            onPress={() => void submit()}
          />
        </>
      )}
      {step === 3 && !!model.pdfMessage && !error && <Text accessibilityRole="alert" style={s.footerHint}>✓ {model.pdfMessage}</Text>}
      {step === 3 && ticket && (
        <Button
          label={busy ? 'Préparation du PDF…' : 'Télécharger le ticket PDF'}
          icon="download"
          loading={busy}
          onPress={() => { if (!busy) void pdf(ticket); }}
        />
      )}
      {step > 0 && step < 3 && (
        <Pressable accessibilityRole="button" onPress={goBack} style={s.backButton}>
          <View style={{ transform: [{ scaleX: -1 }] }}>
            <Icon name="arrow" size={16} color={Brand.textSecondary} />
          </View>
          <Text style={s.quietButtonText}>Étape précédente</Text>
        </Pressable>
      )}
    </View>
  );

  return (<GuideViewport scrollRef={scrollRef}><Modal
    visible={modal}
    transparent
    animationType={wide ? 'fade' : 'slide'}
    statusBarTranslucent
    onRequestClose={close}
  >
    <View style={wide ? s.modalBackdrop : s.sheetBackdrop}>
      {!wide && <Pressable accessibilityLabel="Fermer" onPress={close} style={{ flex: 1 }} />}
      <View style={wide ? s.modalCard : s.sheetCard}>
        {!wide && <View style={s.grabber} />}
        <ScrollView
          ref={scrollRef}
          style={step === 3 && { backgroundColor: Brand.canvas }}
          contentContainerStyle={{ padding: wide ? 28 : 20, paddingTop: wide ? 28 : 16, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GuideSpot key={step} name={['booking-customer', 'booking-services', 'booking-time', 'booking-ticket'][step]} order={1} text={GUIDE_TEXT[step]} style={s.modalHeading}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalEyebrow}>{step === 3 ? 'C’EST RÉSERVÉ' : 'NOUVEAU RENDEZ-VOUS'}</Text>
              <Text accessibilityRole="header" style={s.modalTitle}>{TITLES[step]}</Text>
            </View>
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Fermer" style={s.close}>
              <Icon name="close" color={Brand.ink} size={20} />
            </Pressable>
          </GuideSpot>
          {step < 3 ? <Stepper step={step} /> : <View style={{ height: 18 }} />}

          {step === 0 && (
            <Animated.View entering={FadeInDown.duration(300)} style={s.form}>
              <Text style={[s.small, { fontSize: 15, lineHeight: 22 }]}>Quelques informations pour préparer votre accueil.</Text>
              <View style={s.infoCard}>
                <InfoRow label="Nom complet" value={name || 'À renseigner'} />
                <InfoRow label="Numéro de CIN" value={cin || 'À renseigner'} />
                <InfoRow label="Téléphone" value={phone || 'Non renseigné'} />
              </View>
              <Pressable accessibilityRole="button" onPress={model.editProfile} style={[s.chipButton, { alignSelf: 'flex-start' }]}>
                <Icon name="user" size={18} color={Brand.orangeDark} />
                <Text style={s.chipButtonText}>Modifier mes informations</Text>
              </Pressable>
              <Text style={s.small}>Votre CIN originale sera demandée lors de votre visite.</Text>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(300)} style={s.form}>
              <Text style={[s.label, { marginTop: 0 }]}>Quel(s) service(s) ?</Text>
              <Text style={[s.small, { marginTop: -6 }]}>Vous pouvez en choisir plusieurs.</Text>
              {services.map((v, i) => {
                const checked = selected.includes(i);
                return (
                  <PressableScale
                    key={v.name}
                    scaleTo={0.98}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() => { setError(''); setSelected(checked ? selected.filter(x => x !== i) : [...selected, i]); }}
                    style={[s.option, checked && s.optionSelected]}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: v.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={v.icon} color={v.color} size={21} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.optionText}>{v.name}</Text>
                      <Text style={s.small} numberOfLines={1}>{v.sub}</Text>
                    </View>
                    <View style={{ width: 26, height: 26, borderRadius: 9, borderWidth: 2, borderColor: checked ? orange : '#CFD1D6', backgroundColor: checked ? orange : Brand.white, alignItems: 'center', justifyContent: 'center' }}>
                      {checked && <Icon name="check" color="white" size={16} />}
                    </View>
                  </PressableScale>
                );
              })}
              <Text style={[s.label, { marginTop: 16 }]}>Votre boutique</Text>
              {bookableShops.map((v, i) => {
                const chosen = shop === i;
                return (
                  <PressableScale
                    key={v.id ?? v.name}
                    scaleTo={0.98}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: chosen }}
                    onPress={() => setShop(i)}
                    style={[s.option, chosen && s.optionSelected]}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: chosen ? orange : Brand.surface, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="shop" size={20} color={chosen ? Brand.white : Brand.textTertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.optionText}>{v.name}</Text>
                      <Text style={s.small} numberOfLines={2}>{v.address}</Text>
                    </View>
                    <View style={[s.radio, chosen && s.radioOn]}>{chosen && <View style={s.radioDot} />}</View>
                  </PressableScale>
                );
              })}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 6 }}>
                <Icon name="pin" size={16} color={Brand.textTertiary} />
                <Text style={[s.small, { flex: 1, fontSize: 12 }]}>
                  À l’étape suivante, Robia estime le trajet depuis votre position si vous l’autorisez (calcul effectué par Geoapify).
                </Text>
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInDown.duration(300)} style={s.form}>
              {noSlots && (
                <View style={[s.panel, { alignItems: 'center', paddingVertical: 24 }]}>
                  <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: Brand.white, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="calendar" size={26} color={orange} />
                  </View>
                  <Text style={[s.panelTitle, { textAlign: 'center' }]}>Aucun créneau ouvert pour le moment</Text>
                  <Text style={[s.small, { textAlign: 'center' }]}>{selectedShop?.name} n’a pas encore publié de disponibilités. Essayez une autre boutique.</Text>
                  <Pressable accessibilityRole="button" onPress={goBack} style={[s.chipButton, { marginTop: 4 }]}>
                    <Icon name="shop" size={18} color={Brand.orangeDark} />
                    <Text style={s.chipButtonText}>Choisir une autre boutique</Text>
                  </Pressable>
                </View>
              )}
              {!noSlots && <Text style={[s.label, { marginTop: 0 }]}>Quel jour ?</Text>}
              {slotsLoading && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[0, 1, 2, 3].map(i => <View key={i} style={[s.day, s.skeleton]} />)}
                </View>
              )}
              {!noSlots && !slotsLoading && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: wide ? -28 : -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: wide ? 28 : 20, paddingVertical: 6 }}>
                {dates.map((d, i) => {
                  const on = day === i;
                  const c = on ? Brand.white : undefined;
                  return (
                    <PressableScale
                      key={d.toISOString()}
                      onPress={() => setDay(i)}
                      accessibilityRole="button"
                      accessibilityLabel={longDate(d)}
                      accessibilityState={{ selected: on }}
                      style={[s.day, on && s.daySelected]}
                    >
                      <Text style={[s.dayCaption, c && { color: c }]}>
                        {i === 0 ? 'Auj.' : d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                      </Text>
                      <Text style={[s.dayNumber, c && { color: c }]}>{d.getDate()}</Text>
                      <Text style={[s.dayCaption, c && { color: c }]}>{d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>}

              {!noSlots && <Text style={s.label}>À quelle heure ?</Text>}
              {!noSlots && <Text style={[s.small, { marginTop: -6 }]}>
                {model.isRemote ? 'Places en temps réel, communiquées par la boutique.' : 'Places simulées, non synchronisées avec la boutique.'}
              </Text>}
              {!!model.slotError && (
                <View style={s.errorBox}>
                  <Text accessibilityRole="alert" style={s.error}>{model.slotError}</Text>
                  <Pressable accessibilityRole="button" onPress={() => void model.reloadSlots()} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
                    <Text style={s.orangeLink}>Réessayer</Text>
                  </Pressable>
                </View>
              )}
              {slotsLoading ? (
                <View style={s.times} accessibilityLabel="Chargement des créneaux">
                  {Array.from({ length: 8 }, (_, i) => <View key={i} style={[s.time, s.skeleton]} />)}
                </View>
              ) : (
                <View style={s.times}>
                  {appointmentTimes.map(t => {
                    const available = model.availableFor(t);
                    const disabled = available === null || available === 0;
                    const on = time === t && !disabled;
                    const few = available !== null && available > 0 && available <= 2;
                    return (
                      <PressableScale
                        key={t}
                        onPress={() => setTime(t)}
                        disabled={disabled}
                        scaleTo={0.94}
                        accessibilityRole="button"
                        accessibilityLabel={`${t}, ${available === null ? 'indisponible' : available === 0 ? 'complet' : `${available} place${available > 1 ? 's' : ''}${model.isRemote ? '' : ' simulée'}`}`}
                        accessibilityState={{ selected: on, disabled }}
                        style={[s.time, disabled && s.timeDisabled, on && s.timeSelected]}
                      >
                        <Text style={[s.timeText, disabled && { color: '#B4B6BB', textDecorationLine: 'line-through' }, on && { color: Brand.white }]}>{t}</Text>
                        <Text style={[s.timeMeta, { color: on ? 'rgba(255,255,255,0.9)' : disabled ? Brand.textTertiary : few ? '#A96707' : '#278251' }]}>
                          {available === null ? '—' : available === 0 ? 'Complet' : few ? `Plus que ${available}` : `${available} places`}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              )}
              {allFull && (
                <View style={[s.panel, { backgroundColor: '#FFF2DF' }]}>
                  <Text style={[s.small, { color: '#A96707', fontWeight: '700' }]}>Aucun créneau libre ce jour-là. Essayez un autre jour.</Text>
                </View>
              )}

              <View style={[s.summary, { marginTop: 10 }]}>
                <Text style={s.mutedTag}>RÉCAPITULATIF</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', letterSpacing: -0.4, textTransform: 'capitalize' }}>{dates[day] ? `${longDate(dates[day])} · ${time}` : 'Créneau à choisir'}</Text>
                <Text style={[s.small, { color: Brand.ink, fontWeight: '600' }]}>{selectedShop?.name}</Text>
                <Text style={s.small}>{selected.map(i => services[i]?.name).filter(Boolean).join(' · ')}</Text>
                <Text style={s.small}>Conseiller : {selectedShop?.agent}</Text>
              </View>

              <View style={s.panel}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: Brand.white, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="map" size={18} color={orange} />
                  </View>
                  <Text style={[s.panelTitle, { flex: 1 }]}>Votre trajet</Text>
                </View>
                {model.checkingTravel && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
                    <ActivityIndicator size="small" color={orange} />
                    <Text style={s.small}>Calcul depuis votre position…</Text>
                  </View>
                )}
                {model.currentTravel && model.travelAssessment ? (
                  <>
                    <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.8 }}>
                        {Math.ceil(model.currentTravel.seconds / 60)}<Text style={{ fontSize: 14, fontWeight: '600', color: Brand.textSecondary }}> min</Text>
                      </Text>
                      <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.8 }}>
                        {(model.currentTravel.meters / 1000).toFixed(1)}<Text style={{ fontSize: 14, fontWeight: '600', color: Brand.textSecondary }}> km</Text>
                      </Text>
                    </View>
                    <Text style={{ color: model.travelAssessment.isTight ? '#BE554E' : '#278251', fontWeight: '700', fontSize: 14, lineHeight: 20 }}>
                      {model.travelAssessment.isTight ? 'Ce créneau semble trop proche si vous partez maintenant.' : 'Le trajet semble possible si vous partez à temps.'}
                    </Text>
                    <Text style={s.small}>
                      {model.travelAssessment.isTight ? 'Arrivée estimée avec marge : ' : 'Départ conseillé au plus tard : '}
                      <Text style={{ fontWeight: '700' }}>
                        {(model.travelAssessment.isTight ? model.travelAssessment.earliestArrival : model.travelAssessment.latestDeparture).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Text>
                    <Text style={[s.small, { fontSize: 12 }]}>Estimation en voiture avec 15 min de marge, sans garantie sur le trafic.</Text>
                    {model.travelAssessment.isTight && (
                      <CheckRow checked={model.riskAccepted} onToggle={model.setRiskAccepted} label="J’ai prévu mon déplacement et souhaite garder ce créneau." />
                    )}
                  </>
                ) : !model.checkingTravel && (
                  <>
                    <Text style={s.small}>Trajet non vérifié pour cette boutique.</Text>
                    <CheckRow checked={model.unverifiedAccepted} onToggle={model.setUnverifiedAccepted} label="Je poursuis sans vérifier le trajet." />
                  </>
                )}
                {!!model.travelError && <Text accessibilityRole="alert" style={s.error}>{model.travelError}</Text>}
                {!model.checkingTravel && (
                  <Pressable accessibilityRole="button" onPress={() => void model.checkTravel()} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
                    <Icon name="pin" size={17} color={Brand.orangeDark} />
                    <Text style={s.orangeLink}>{model.currentTravel ? 'Actualiser l’estimation' : 'Vérifier mon trajet'}</Text>
                  </Pressable>
                )}
              </View>

              <View style={s.infoCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text style={[s.panelTitle, { flex: 1 }]}>Vos informations</Text>
                  <Pressable accessibilityRole="button" onPress={model.editProfile} style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 8 }}>
                    <Text style={s.orangeLink}>Modifier</Text>
                  </Pressable>
                </View>
                <InfoRow label="Nom" value={name} />
                <InfoRow label="CIN" value={cin} />
                <InfoRow label="Téléphone" value={phone || 'Non renseigné'} />
                <CheckRow checked={model.profileConfirmed} onToggle={model.setProfileConfirmed} label="Je confirme que ces informations sont exactes." />
              </View>
              {!model.isRemote && (
                <Text style={[s.small, { fontSize: 12 }]}>Les horaires ne sont pas synchronisés avec la boutique. Vérifiez les disponibilités auprès de celle-ci.</Text>
              )}
            </Animated.View>
          )}

          {step === 3 && ticket && (
            <Animated.View entering={FadeInDown.duration(450)} style={s.form}>
              <View style={s.ticketCard}>
                <View style={s.ticketHead}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.ticketHeadLabel}>TICKET ROBIA</Text>
                    <View style={{ backgroundColor: Brand.white, borderRadius: 999 }}>
                      <StatusBadge status={ticket.status} isRemote={model.isRemote} compact />
                    </View>
                  </View>
                  <Text style={s.ticketId} accessibilityLabel={`Ticket numéro ${ticket.code.split('').join(' ')}`}><Text style={s.ticketIdHash}>#</Text>{ticket.code}</Text>
                  <Text style={s.ticketShop}>{shops[ticket.shop]?.name}</Text>
                  <Text style={s.ticketWhen}>{ticket.date} · {ticket.time}</Text>
                </View>
                <View style={s.ticketCut}>
                  <View style={s.ticketCutLine} />
                  <View style={[s.ticketNotch, { left: -14, backgroundColor: Brand.canvas }]} />
                  <View style={[s.ticketNotch, { right: -14, backgroundColor: Brand.canvas }]} />
                </View>
                <View style={s.ticketBody}>
                  <View style={s.qrFrame} accessibilityLabel="QR code du ticket à présenter en boutique">
                    <QR value={ticket.reference} size={wide ? 190 : 196} />
                  </View>
                  <Text selectable numberOfLines={1} ellipsizeMode="middle" style={[s.ticketRef, { fontFamily: Fonts?.mono }]}>Réf. {ticket.reference}</Text>
                  <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 6 }}>
                    <InfoRow label="Titulaire" value={ticket.name} />
                    <InfoRow label="Services" value={ticket.services.map(i => services[i]?.name).filter(Boolean).join(', ')} />
                    <InfoRow label="Conseiller" value={shops[ticket.shop]?.agent ?? '—'} />
                  </View>
                </View>
              </View>

              <View style={[s.infoCard, { gap: 12 }]}>
                <Text style={s.panelTitle}>Le jour J</Text>
                {[
                  ['ticket', 'Présentez ce QR code au guichet.'],
                  ['user', 'Munissez-vous de votre CIN originale.'],
                  ['clock', 'Arrivez 10 minutes à l’avance.'],
                ].map(([icon, text]) => (
                  <View key={text} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: Brand.white, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={icon} size={17} color={orange} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '500' }}>{text}</Text>
                  </View>
                ))}
              </View>
              <Text style={[s.small, { textAlign: 'center', fontSize: 12 }]}>
                {model.isRemote
                  ? 'Votre demande est transmise à la boutique. Le QR code ne vaut pas validation de la visite.'
                  : 'Ce ticket n’a pas été transmis à la boutique. Confirmez votre rendez-vous auprès de celle-ci.'}
              </Text>
              {!!model.reminderMessage && (
                <View style={[s.panel, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Icon name="bell" size={18} color={Brand.orangeDark} />
                  <Text accessibilityRole="alert" style={[s.small, { flex: 1, color: Brand.ink }]}>{model.reminderMessage}</Text>
                </View>
              )}
              {shops[ticket.shop] && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setModal(false);
                    router.push({ pathname: '/localisation', params: { shopId: shops[ticket.shop].id, itineraire: '1' } });
                  }}
                  style={[s.chipButton, { justifyContent: 'center', minHeight: 52 }]}
                >
                  <Icon name="pin" color={Brand.orangeDark} size={18} />
                  <Text style={s.chipButtonText}>Itinéraire vers la boutique</Text>
                </Pressable>
              )}
              <Text style={[s.small, { textAlign: 'center', fontSize: 12 }]}>
                {Platform.OS === 'web'
                  ? 'Le PDF sera enregistré dans les téléchargements de votre navigateur.'
                  : 'Enregistrez ou partagez le PDF depuis le menu de votre téléphone.'}
              </Text>
            </Animated.View>
          )}
        </ScrollView>
        {footer}
      </View>
    </View>
  </Modal></GuideViewport>);
}
