import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ShopLocator from '../../location/components/shop-locator';
import { GuideEntry } from '../../onboarding/guide-entry';
import { GuideSpot, GuideViewport, type GuideScrollHandle } from '../../onboarding/guide-spot';
import { Brand } from '../../shared/brand';
import { PressableScale } from '../../shared/components/pressable-scale';
import { Text } from '../../shared/components/text';
import { Button } from '../components/booking-button';
import { BookingDialog } from '../components/booking-dialog';
import { Icon } from '../components/booking-icon';
import { HelpDialog } from '../components/help-dialog';
import { QR } from '../components/ticket-qr';
import { ShopVisual } from '../components/shop-visual';
import { StatusBadge } from '../components/status-badge';
import { TicketStub } from '../components/ticket-stub';
import { useBookingWorkflow } from '../hooks/use-booking-workflow';
import { slotLabel, useNextSlots } from '../hooks/use-next-slots';
import type { TicketViewModel } from '../models/booking-view-models';
import { bookingStyles as s } from './booking-screen.styles';

const orange = Brand.orange;
const navigation = [
  { label: 'Accueil', short: 'Accueil', icon: 'home' },
  { label: 'Mes rendez-vous', short: 'Rendez-vous', icon: 'calendar' },
  { label: 'Les boutiques', short: 'Boutiques', icon: 'shop' },
  { label: 'Mes tickets', short: 'Tickets', icon: 'ticket' },
];
const logo = require('../../../../assets/images/robia-iot-logo-transparent.png');
const GRACE_MS = 30 * 60 * 1000;
const TAB_BAR = 68;

const isActive = (t: TicketViewModel) => t.status !== 'rejected' && t.status !== 'cancelled';
const timeOf = (t: TicketViewModel) => Date.parse(t.appointmentAt);
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const enter = (index: number) => FadeInDown.duration(420).delay(70 * index);

export default function BookingScreen() {
  const scrollRef = useRef<GuideScrollHandle>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const desktop = width >= 1050;
  const wide = width >= 730;
  const pad = wide ? 36 : 20;
  const { view } = useLocalSearchParams<{ view?: string }>();
  const tab = navigation.some(n => n.label === view) ? view! : 'Accueil';
  const setTab = (next: string) => router.setParams({ view: next });
  const model = useBookingWorkflow();
  const { setHelp, open, name, services, shops, bookableShops, tickets, setTicket, setStep, setError, setModal, help, modal } = model;
  const firstName = name.trim().split(/\s+/)[0] ?? '';

  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const { upcoming, past } = useMemo(() => {
    const limit = now - GRACE_MS;
    const next = tickets.filter(t => isActive(t) && timeOf(t) >= limit).sort((a, b) => timeOf(a) - timeOf(b));
    const rest = tickets.filter(t => !next.includes(t)).sort((a, b) => timeOf(b) - timeOf(a));
    return { upcoming: next, past: rest };
  }, [tickets, now]);
  const nextTicket = upcoming[0];

  const openTicket = (t: TicketViewModel) => {
    setTicket(t);
    setStep(3);
    setError('');
    setModal(true);
  };
  const serviceNames = (t: TicketViewModel) => t.services.map(i => services[i]?.name).filter(Boolean).join(' · ');
  const unread = model.unreadNotifications;
  const today = new Date(now).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const shopCardWidth = wide ? undefined : Math.min(width * 0.8, 340);
  const featuredShops = bookableShops.slice(0, wide ? 4 : 6);
  const nextSlots = useNextSlots(featuredShops.map(item => item.id));
  // The hero ticket shows the customer's real next visit, or a clearly labelled example.
  const heroTicket = nextTicket
    ? { caption: 'MON TICKET', id: nextTicket.code, qr: nextTicket.reference, shop: shops[nextTicket.shop]?.name ?? 'Boutique', when: `${nextTicket.date.split(' ').slice(0, 3).join(' ')} · ${nextTicket.time}` }
    : { caption: 'EXEMPLE', id: 'A01', qr: 'ROBIA-EXEMPLE', shop: 'Votre boutique', when: 'Votre créneau' };

  const renderRecord = (t: TicketViewModel, index: number) => {
    const canCancel = model.isRemote && (t.status === 'pending' || t.status === 'confirmed');
    const confirming = model.cancelTarget === t.reference;
    return (
      <Animated.View key={t.reference} entering={enter(index)}>
        <TicketStub ticket={t} shopName={shops[t.shop]?.name ?? 'Boutique'} services={serviceNames(t)} isRemote={model.isRemote} onPress={() => openTicket(t)}>
          {!!t.serviceResult && (
            <View style={{ flexBasis: '100%', backgroundColor: t.serviceResult === 'treated' ? '#E8F7EE' : '#FFF0EF', borderRadius: 14, padding: 12, gap: 2 }}>
              <Text style={{ fontWeight: '800', fontSize: 14, color: t.serviceResult === 'treated' ? '#278251' : '#BE554E' }}>
                {t.serviceResult === 'treated' ? '✓ Demande traitée en boutique' : 'Demande non traitée'}
              </Text>
              {!!t.serviceMessage && <Text style={{ fontSize: 13, lineHeight: 19, color: Brand.ink }}>{t.serviceMessage}</Text>}
            </View>
          )}
          {confirming ? (
            <>
              <Text style={[s.small, { flexBasis: '100%', paddingHorizontal: 4, color: Brand.ink }]}>Annuler ce rendez-vous ?</Text>
              <Pressable accessibilityRole="button" disabled={model.busy} onPress={() => void model.cancelBooking(t.reference)} style={[s.chipButton, { backgroundColor: '#FFF0EF' }]}>
                <Text style={[s.chipButtonText, { color: '#BE554E' }]}>{model.busy ? 'Annulation…' : 'Oui, annuler'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => model.setCancelTarget('')} style={s.quietButton}>
                <Text style={s.quietButtonText}>Garder</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable accessibilityRole="button" onPress={() => openTicket(t)} style={s.chipButton}>
                <Icon name="ticket" size={18} color={Brand.orangeDark} />
                <Text style={s.chipButtonText}>Voir le ticket</Text>
              </Pressable>
              {canCancel && (
                <Pressable accessibilityRole="button" onPress={() => model.setCancelTarget(t.reference)} style={s.quietButton}>
                  <Text style={s.quietButtonText}>Annuler</Text>
                </Pressable>
              )}
            </>
          )}
        </TicketStub>
      </Animated.View>
    );
  };

  const avatar = (
    <PressableScale style={s.avatar} accessibilityRole="button" accessibilityLabel="Mes informations" onPress={() => router.push('/profil')}>
      {name ? <Text style={s.avatarText}>{initials(name)}</Text> : <Icon name="user" size={19} color={Brand.white} />}
    </PressableScale>
  );

  return (
    <GuideViewport scrollRef={scrollRef}><SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.shell}>
        {desktop && (
          <View style={s.sidebar}>
            <View style={s.brand}>
              <Image source={logo} style={{ width: 40, height: 40 }} resizeMode="contain" />
              <Text style={s.logo}>robia<Text style={{ color: orange }}>.</Text></Text>
            </View>
            <Text style={s.brandSub}>Votre temps est précieux.</Text>
            <Text style={s.navCaption}>VOTRE ESPACE</Text>
            {navigation.map(n => {
              const active = tab === n.label;
              return (
                <PressableScale
                  key={n.label}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTab(n.label)}
                  style={[s.navItem, active && s.navActive]}
                  pressedStyle={!active && { backgroundColor: Brand.canvas }}
                >
                  <Icon name={n.icon} size={20} color={active ? Brand.white : Brand.textTertiary} />
                  <Text style={[s.navText, active && s.navTextActive]}>{n.label}</Text>
                </PressableScale>
              );
            })}
            <View style={{ flex: 1 }} />
            <View style={s.helpBox}>
              <Icon name="help" color={orange} />
              <Text style={s.helpTitle}>Un petit coup de main ?</Text>
              <Text style={s.small}>Nous sommes là pour vous accompagner à chaque étape.</Text>
              <Pressable accessibilityRole="button" onPress={() => setHelp(true)} style={{ minHeight: 36, justifyContent: 'center' }}>
                <Text style={s.helpLink}>Besoin d’aide ↗</Text>
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Mes informations" style={s.profile} onPress={() => router.push('/profil')}>
              <View style={s.avatar}>
                {name ? <Text style={s.avatarText}>{initials(name)}</Text> : <Icon name="user" size={18} color={Brand.white} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.profileName} numberOfLines={1}>{name || 'Mon espace'}</Text>
                <Text style={s.small}>Compte personnel</Text>
              </View>
              <Icon name="arrow" size={16} color={Brand.textTertiary} />
            </Pressable>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={[s.header, { paddingHorizontal: pad }]}>
            {desktop ? (
              <Text style={s.breadcrumb}>{tab}</Text>
            ) : (
              <View style={s.headerBrand} accessibilityRole="header" accessibilityLabel="Robia">
                <Image source={logo} style={{ width: 32, height: 32 }} resizeMode="contain" />
                <Text style={s.headerWordmark}>robia<Text style={{ color: orange }}>.</Text></Text>
              </View>
            )}
            <View style={s.headerRight}>
              {width > 450 && (
                <PressableScale accessibilityRole="button" style={s.location} onPress={() => setTab('Les boutiques')}>
                  <Icon name="pin" color={orange} size={16} />
                  <Text style={s.locationText}>Boutiques autour de moi</Text>
                </PressableScale>
              )}
              <PressableScale
                onPress={() => router.push('/notifications')}
                accessibilityRole="button"
                accessibilityLabel={unread > 0 ? `Notifications, ${unread} non lue${unread > 1 ? 's' : ''}` : 'Notifications'}
                style={s.iconButton}
              >
                <Icon name="bell" size={21} color={Brand.ink} />
                {unread > 0 && (
                  <View style={s.dot}><Text style={s.dotText}>{unread > 9 ? '9+' : unread}</Text></View>
                )}
              </PressableScale>
              {!desktop && avatar}
            </View>
          </View>
          <ScrollView
            ref={scrollRef}
            onLayout={() => setLayoutReady(true)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[s.content, { paddingHorizontal: pad }, !desktop && { paddingBottom: TAB_BAR + Math.max(insets.bottom, 12) + 32 }]}
          >
            <GuideSpot name={tab === 'Mes rendez-vous' ? 'appointments-list' : tab === 'Mes tickets' ? 'tickets-list' : 'page-heading'} order={0}
              text={tab === 'Mes rendez-vous' ? 'Retrouvez ici vos rendez-vous enregistrés sur cet appareil : boutique, date, horaire et services.' : 'Vos tickets sont accessibles ici après enregistrement. Ouvrez un ticket pour voir son QR code et télécharger ou partager le PDF.'} style={s.greeting}>
              <View style={{ flex: 1 }}>
                <Text style={s.eyebrow}>{today}</Text>
                <Text accessibilityRole="header" style={[s.pageTitle, !wide && { fontSize: 30, lineHeight: 36 }]}>
                  {tab === 'Accueil'
                    ? <>{firstName ? `Bonjour ${firstName}` : 'Bonjour'}<Text style={{ color: orange }}>.</Text></>
                    : tab}
                </Text>
                <Text style={s.subtitle}>
                  {tab === 'Accueil' ? 'Où et quand souhaitez-vous être reçu ?'
                    : tab === 'Les boutiques' ? 'Trouvez une boutique et réservez votre visite.'
                      : tab === 'Mes tickets' ? 'Présentez le QR code et votre CIN au guichet.'
                        : 'Suivez vos demandes et gérez vos visites.'}
                </Text>
              </View>
            </GuideSpot>
            <GuideEntry tab={tab} navigate={setTab} model={model} ready={layoutReady && !modal && !help} />
            {!!model.catalogError && (
              <View style={[s.errorBox, { marginBottom: 16 }]}>
                <Text accessibilityRole="alert" style={s.error}>{model.catalogError}</Text>
                <Pressable accessibilityRole="button" onPress={() => void model.refreshBookings()} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
                  <Text style={s.orangeLink}>Réessayer</Text>
                </Pressable>
              </View>
            )}

            {tab === 'Accueil' && (
              <>
                {nextTicket && (
                  <Animated.View entering={enter(0)} style={{ marginBottom: 18 }}>
                    <TicketStub
                      ticket={nextTicket}
                      eyebrow="PROCHAIN RENDEZ-VOUS"
                      shopName={shops[nextTicket.shop]?.name ?? 'Boutique'}
                      services={serviceNames(nextTicket)}
                      isRemote={model.isRemote}
                      onPress={() => openTicket(nextTicket)}
                    />
                  </Animated.View>
                )}
                <Animated.View entering={FadeIn.duration(500)} style={[s.hero, wide && { padding: 36, minHeight: 300, justifyContent: 'center' }]}>
                  {!wide && (
                    <View style={s.miniTicket} accessible={false} importantForAccessibility="no-hide-descendants">
                      <Text style={{ fontSize: 9, fontWeight: '800', color: Brand.textTertiary, letterSpacing: 1 }}>{heroTicket.caption}</Text>
                      <Text style={{ fontSize: heroTicket.id.length > 4 ? 16 : 28, fontWeight: '800', color: orange, letterSpacing: -1 }} numberOfLines={1}>{heroTicket.id}</Text>
                      <QR value={heroTicket.qr} size={64} />
                    </View>
                  )}
                  <View style={{ zIndex: 2, maxWidth: wide ? '56%' : '100%' }}>
                    <View style={s.heroPill}>
                      <View style={s.whiteDot} />
                      <Text style={s.heroPillText}>Sans file d’attente</Text>
                    </View>
                    <Text style={[s.heroTitle, !wide && { maxWidth: '68%', fontSize: 28, lineHeight: 33 }, wide && { fontSize: 40, lineHeight: 45 }]}>
                      Réservez votre passage en boutique.
                    </Text>
                    <Text style={[s.heroDescription, !wide && { maxWidth: '78%' }]}>
                      Choisissez un service, un créneau, et présentez simplement votre ticket.
                    </Text>
                    <GuideSpot name="home-reserve" order={1} text="Commencez ici pour choisir votre service, votre boutique et un horaire. Votre ticket QR et PDF sera disponible après enregistrement." style={{ alignSelf: wide ? 'flex-start' : 'stretch' }}>
                      <PressableScale accessibilityRole="button" onPress={() => open()} style={s.heroButton} pressedStyle={{ backgroundColor: Brand.orangeLight }}>
                        <Icon name="calendar" size={19} color={orange} />
                        <Text style={s.heroButtonText}>Prendre un rendez-vous</Text>
                      </PressableScale>
                    </GuideSpot>
                    <View style={s.heroFoot}>
                      <Icon name="check" size={14} color="white" />
                      <Text style={s.heroFootText}>Gratuit</Text>
                      <View style={[s.whiteDot, { opacity: 0.6 }]} />
                      <Text style={s.heroFootText}>Lun.–sam. 08 h–16 h</Text>
                      <View style={[s.whiteDot, { opacity: 0.6 }]} />
                      <Text style={s.heroFootText}>Ticket QR</Text>
                    </View>
                  </View>
                  {wide && (
                    <View style={s.heroArt} accessible={false} importantForAccessibility="no-hide-descendants">
                      <View style={s.artTicket}>
                        <View style={s.artTicketHeader}>
                          <Text style={{ fontWeight: '800', fontSize: 18 }}>robia<Text style={{ color: orange }}>.</Text></Text>
                          {nextTicket ? <StatusBadge status={nextTicket.status} isRemote={model.isRemote} compact /> : <View style={s.confirmed}><Text style={{ fontSize: 11, color: '#278251', fontWeight: '700' }}>Exemple</Text></View>}
                        </View>
                        <Text style={s.artTicketCaption}>{nextTicket ? 'VOTRE PROCHAIN RENDEZ-VOUS' : 'VOTRE TICKET RESSEMBLERA À ÇA'}</Text>
                        <View style={s.artTicketBody}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={[s.artId, heroTicket.id.length > 4 && { fontSize: 22, letterSpacing: -0.5 }]} numberOfLines={1}>{heroTicket.id}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{heroTicket.shop}</Text>
                            <Text style={{ fontSize: 12, color: Brand.textTertiary, marginTop: 4 }}>{heroTicket.when}</Text>
                          </View>
                          <QR value={heroTicket.qr} size={78} />
                        </View>
                        <View style={s.ticketDash} />
                        <Text style={s.artTicketBottom}>Un scan, et vous voilà pris en charge.</Text>
                      </View>
                      <View style={s.floatingCheck}><Icon name="check" color={orange} size={26} /></View>
                      <View style={s.artStar}><Icon name="spark" color="#FFD4B6" size={34} /></View>
                    </View>
                  )}
                </Animated.View>

                <View style={s.sectionHead}>
                  <View style={{ flex: 1 }}>
                    <Text accessibilityRole="header" style={s.sectionTitle}>De quoi avez-vous besoin ?</Text>
                    <Text style={s.sectionSub}>Touchez un service pour réserver.</Text>
                  </View>
                </View>
                <GuideSpot name="home-services" order={2} text="Sélectionnez le service souhaité : Orange Money, récupération de numéro, abonnement ou achat." style={s.serviceGrid}>
                  {services.map((v, i) => (
                    <Animated.View key={v.name} entering={enter(i + 1)} style={[{ flexGrow: 1, flexBasis: wide ? '22%' : '46%' }]}>
                      <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel={`${v.name}. ${v.sub}. Prendre rendez-vous`}
                        onPress={() => open(i)}
                        style={[s.serviceCard, { flexBasis: 'auto' }]}
                      >
                        <View style={[s.serviceIcon, { backgroundColor: v.bg }]}>
                          <Icon name={v.icon} color={v.color} size={25} />
                        </View>
                        <View style={s.serviceGo}><Icon name="arrow" size={14} color={Brand.ink} /></View>
                        <Text style={s.serviceTitle} numberOfLines={2}>{v.name}</Text>
                        <Text style={s.serviceDescription} numberOfLines={2}>{v.sub}</Text>
                      </PressableScale>
                    </Animated.View>
                  ))}
                </GuideSpot>

                <GuideSpot name="home-shops" order={3} text="Ouvrez les boutiques pour vous localiser, consulter les adresses du catalogue et réserver votre visite dans Robia." style={s.sectionHead}>
                  <View style={{ flex: 1 }}>
                    <Text accessibilityRole="header" style={s.sectionTitle}>Boutiques Orange</Text>
                    <Text style={s.sectionSub}>Choisissez où vous serez reçu.</Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => setTab('Les boutiques')} style={s.inlineLink}>
                    <Text style={s.orangeLink}>Tout voir</Text>
                    <Icon name="arrow" color={Brand.orangeDark} size={16} />
                  </Pressable>
                </GuideSpot>
                <ScrollView
                  horizontal={!wide}
                  scrollEnabled={!wide}
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={shopCardWidth ? shopCardWidth + 14 : undefined}
                  style={!wide && { marginHorizontal: -pad }}
                  contentContainerStyle={wide ? { flexDirection: 'row', gap: 16 } : [s.shopRail, { paddingHorizontal: pad, paddingBottom: 16 }]}
                >
                  {featuredShops.map((v, i) => (
                    <Animated.View key={v.id ?? v.name} entering={enter(i)} style={wide ? { flex: 1 } : { width: shopCardWidth }}>
                      <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel={`${v.name}, ${v.address}. Réserver dans cette boutique`}
                        onPress={() => open(undefined, i)}
                        style={s.shopCard}
                      >
                        <ShopVisual id={v.id} name={v.name} city={v.city} height={150} />
                        <View style={s.shopDetails}>
                          <Text style={s.shopName} numberOfLines={1}>{v.name}</Text>
                          <Text style={s.shopAddress} numberOfLines={1}>{v.address}</Text>
                          <View style={s.shopFooter}>
                            {(() => {
                              const next = nextSlots[v.id];
                              const label = !model.isRemote ? 'Lun.–sam. · 08:00–16:00'
                                : next === undefined ? 'Recherche d’un créneau…'
                                  : next.slot ? `${slotLabel(next.slot.startsAt, new Date(now))} · ${next.slot.available} place${next.slot.available > 1 ? 's' : ''}`
                                    : 'Aucun créneau libre';
                              const free = !model.isRemote || !!next?.slot;
                              return (
                                <View style={[s.bookChip, !free && { backgroundColor: Brand.surfaceSubtle }]}>
                                  <Icon name="clock" size={14} color={free ? Brand.orangeDark : Brand.textTertiary} />
                                  <Text style={[s.bookChipText, !free && { color: Brand.textTertiary }]} numberOfLines={1}>{label}</Text>
                                </View>
                              );
                            })()}
                          </View>
                        </View>
                      </PressableScale>
                    </Animated.View>
                  ))}
                </ScrollView>
                <View style={s.demoNote}>
                  <Icon name="pin" color={Brand.textTertiary} size={13} />
                  <Text style={s.noteText}>Adresses et disponibilités à confirmer avant votre visite.</Text>
                </View>
              </>
            )}

            {tab === 'Les boutiques' && <ShopLocator shops={bookableShops} onBook={index => open(undefined, index)} />}

            {(tab === 'Mes rendez-vous' || tab === 'Mes tickets') && (
              <View style={s.records}>
                {!model.ticketsLoaded ? (
                  <View accessibilityLabel="Chargement de vos rendez-vous" style={{ gap: 14 }}>
                    {[0, 1].map(i => <View key={i} style={[s.skeleton, { height: 130, borderRadius: 24 }]} />)}
                  </View>
                ) : tickets.length === 0 ? (
                  <Animated.View entering={enter(0)} style={s.empty}>
                    <View style={s.emptyArt}><Icon name="ticket" color={orange} size={36} /></View>
                    <Text style={[s.sectionTitle, { textAlign: 'center' }]}>Aucun rendez-vous pour l’instant</Text>
                    <Text style={[s.sectionSub, { textAlign: 'center', marginBottom: 8 }]}>
                      Réservez une visite en quelques secondes : votre ticket apparaîtra ici.
                    </Text>
                    <View style={{ alignSelf: 'stretch' }}>
                      <Button label="Prendre rendez-vous" onPress={() => open()} />
                    </View>
                  </Animated.View>
                ) : (
                  <>
                    {upcoming.length > 0 && <Text style={s.mutedTag}>À VENIR · {upcoming.length}</Text>}
                    {upcoming.map(renderRecord)}
                    {past.length > 0 && <Text style={[s.mutedTag, { marginTop: upcoming.length ? 12 : 0 }]}>HISTORIQUE</Text>}
                    {past.map((t, i) => renderRecord(t, upcoming.length + i))}
                    <View style={{ marginTop: 6 }}>
                      <Button label="Nouveau rendez-vous" secondary icon="calendar" onPress={() => open()} />
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={s.footer}>
              <Text style={s.footerText}>© {new Date(now).getFullYear()} Robia · Du temps pour l’essentiel.</Text>
              <Pressable accessibilityRole="button" onPress={() => setHelp(true)} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={[s.footerText, { color: Brand.orangeDark, fontWeight: '700' }]}>Aide & assistance</Text>
              </Pressable>
            </View>
          </ScrollView>

          {!desktop && (
            <View pointerEvents="box-none" style={[s.tabBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View accessibilityRole="tablist" style={s.tabBar}>
                {navigation.map(n => {
                  const active = tab === n.label;
                  return (
                    <PressableScale
                      key={n.label}
                      accessibilityRole="tab"
                      accessibilityLabel={n.label}
                      accessibilityState={{ selected: active }}
                      onPress={() => setTab(n.label)}
                      scaleTo={0.92}
                      style={[s.tabItem, active && s.tabItemActive]}
                    >
                      <Icon name={n.icon} size={21} color={active ? Brand.orangeDark : Brand.textTertiary} />
                      <Text numberOfLines={1} style={[s.tabLabel, active && s.tabLabelActive]}>{n.short}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>
      <BookingDialog model={model} wide={wide} />
      <HelpDialog visible={help} onClose={() => setHelp(false)} isRemote={model.isRemote} />
    </SafeAreaView></GuideViewport>
  );
}
