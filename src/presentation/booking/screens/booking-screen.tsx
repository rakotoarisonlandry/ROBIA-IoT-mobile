import { useRef, useState } from 'react';
import { GuideSpot } from '../../onboarding/guide-spot';
import { GuideEntry } from '../../onboarding/guide-entry';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShopLocator from '../../location/components/shop-locator';
import { BRAND_ORANGE as orange } from '../../shared/brand';
import { useBookingWorkflow } from '../hooks/use-booking-workflow';
import { Icon } from '../components/booking-icon';
import { QR } from '../components/ticket-qr';
import { Button } from '../components/booking-button';
import { BookingDialog } from '../components/booking-dialog';
import { HelpDialog } from '../components/help-dialog';
import { bookingStyles as s } from './booking-screen.styles';
const navigation = [
  { label: "Accueil", icon: "home" },
  { label: "Mes rendez-vous", icon: "calendar" },
  { label: "Les boutiques", icon: "shop" },
  { label: "Mes tickets", icon: "ticket" },
];
export default function BookingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const { width } = useWindowDimensions();
  const desktop = width >= 1050;
  const wide = width >= 730;
  const { view } = useLocalSearchParams<{ view?: string }>();
  const tab = navigation.some(n => n.label === view) ? view! : 'Accueil';
  const setTab = (next: string) => router.setParams({ view: next });
  const model = useBookingWorkflow();
  const { setHelp, open, name, services, shops, tickets, setTicket, setStep, setError, setModal, help, modal } = model;
  return ((
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.shell}>
        {desktop && (
          <View style={s.sidebar}>
            <View style={s.brand}>
              <View style={s.logoMark}>
                <Icon name="spark" color="white" size={25} />
              </View>
              <Text style={s.logo}>
                robia<Text style={{ color: orange }}>.</Text>
              </Text>
            </View>
            <Text style={s.brandSub}>Votre temps est précieux.</Text>
            <Text style={s.navCaption}>VOTRE ESPACE</Text>
            {navigation.map((n) => (
              <Pressable
                key={n.label}
                onPress={() => setTab(n.label)}
                style={[s.navItem, tab === n.label && s.navActive]}
              >
                <Icon
                  name={n.icon}
                  size={20}
                  color={tab === n.label ? orange : "#85858a"}
                />
                <Text
                  style={[
                    s.navText,
                    tab === n.label && { color: orange, fontWeight: "700" },
                  ]}
                >
                  {n.label}
                </Text>
              </Pressable>
            ))}
            <View style={{ flex: 1 }} />
            <View style={s.helpBox}>
              <Icon name="help" color={orange} />
              <Text style={s.helpTitle}>Un petit coup de main ?</Text>
              <Text style={s.small}>
                Nous sommes là pour vous{"\n"}accompagner à chaque étape.
              </Text>
              <Pressable onPress={() => setHelp(true)}>
                <Text style={s.helpLink}>Besoin d’aide ↗</Text>
              </Pressable>
            </View>
            <Pressable style={s.profile} onPress={() => open()}>
              <View style={s.avatar}>
                <Icon name="user" size={18} color="#777" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.profileName}>{name || "Mon espace"}</Text>
                <Text style={s.small}>Compte personnel</Text>
              </View>
              <Text style={{ color: "#777" }}>›</Text>
            </Pressable>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={[s.header, !desktop && { paddingHorizontal: 20 }]}>
            <Text
              style={[
                s.breadcrumb,
                !desktop && {
                  fontSize: 25,
                  fontWeight: "800",
                  letterSpacing: -1,
                },
              ]}
            >
              {desktop ? tab : "robia."}
            </Text>
            <View style={s.headerRight}>
              {width > 450 && (
                <>
                  <Pressable style={s.location} onPress={() => setTab("Les boutiques")}>
                    <Icon name="pin" color={orange} size={16} />
                    <Text style={s.locationText}>Boutiques autour de moi</Text>
                  </Pressable>
                  <View style={s.divider} />
                </>
              )}
              <Pressable
                onPress={() => setTab("Mes rendez-vous")}
                accessibilityLabel="Mes rendez-vous"
                style={{ padding: 4 }}
              >
                <Icon name="bell" size={21} />
                <View style={s.dot} />
              </Pressable>
              <Pressable style={s.avatar} onPress={() => open()}>
                <Text
                  style={{ fontWeight: "600", fontSize: 12, color: "#777" }}
                >
                  {name ? name.slice(0, 2).toUpperCase() : "JD"}
                </Text>
              </Pressable>
            </View>
          </View>
          <ScrollView
            ref={scrollRef}
            onLayout={() => setLayoutReady(true)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[s.content, !wide && { padding: 20 }]}
          >
            <View style={s.greeting}>
              <View>
                <Text style={s.eyebrow}>
                  MOINS D’ATTENTE, PLUS DE TEMPS POUR VOUS
                </Text>
                <Text
                  style={[
                    s.pageTitle,
                    !wide && { fontSize: 29, lineHeight: 36 },
                  ]}
                >
                  {tab === "Accueil"
                    ? "Votre prochain rendez-vous,\nen toute simplicité."
                    : tab}
                </Text>
                <Text style={s.subtitle}>
                  {tab === "Accueil"
                    ? "Vos services Orange vous attendent. Choisissez où et quand."
                    : "Préparez votre visite et retrouvez vos réservations."}
                </Text>
              </View>
              {wide && (
                <View style={s.dateLabel}>
                  <Icon name="calendar" size={16} color="#888" />
                  <Text style={s.small}>
                    {new Date().toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              )}
            </View>
<GuideEntry scope={tab === "Accueil" ? "home" : tab === "Les boutiques" ? "shops" : null} scrollRef={scrollRef} ready={layoutReady && !modal && !help} />
            {tab === "Accueil" && (
              <>
                <View style={[s.hero, !wide && { padding: 26 }]}>
                  <View style={{ zIndex: 2, maxWidth: wide ? "60%" : "100%" }}>
                    <View style={s.heroPill}>
                      <View style={s.whiteDot} />
                      <Text style={s.heroPillText}>
                        VOTRE BOUTIQUE, À PORTÉE DE MAIN
                      </Text>
                    </View>
                    <Text style={[s.heroTitle, !wide && { fontSize: 31 }]}>
                      La file d’attente ?{"\n"}C’est du passé.
                    </Text>
                    <Text style={s.heroDescription}>
                      Réservez depuis chez vous, récupérez votre ticket
                      {wide ? "\n" : " "}et rendez-vous en boutique l’esprit
                      tranquille.
                    </Text>
                    <GuideSpot name="home-reserve" order={1} text="Commencez ici pour choisir votre service, votre boutique et un horaire. Votre ticket QR et PDF sera disponible après confirmation." style={{ alignSelf: 'flex-start' }}><Pressable onPress={() => open()} style={s.heroButton}>
                      <Icon name="calendar" size={18} />
                      <Text style={s.heroButtonText}>
                        Prendre un rendez-vous
                      </Text>
                      <Icon name="arrow" size={18} />
                    </Pressable></GuideSpot>
                    <View style={s.heroFoot}>
                      <Icon name="check" size={13} color="white" />
                      <Text style={s.heroFootText}>Simple et gratuit</Text>
                      <View style={s.whiteDot} />
                      <Text style={s.heroFootText}>De 08 h à 16 h</Text>
                    </View>
                  </View>
                  {wide && (
                    <View style={s.heroArt}>
                      <View style={s.orbitOne} />
                      <View style={s.orbitTwo} />
                      <View style={s.artTicket}>
                        <View style={s.artTicketHeader}>
                          <Text style={{ fontWeight: "800", fontSize: 18 }}>
                            robia<Text style={{ color: orange }}>.</Text>
                          </Text>
                          <View style={s.confirmed}>
                            <Text style={{ fontSize: 8, color: "#428661" }}>
                              ✓ Confirmé
                            </Text>
                          </View>
                        </View>
                        <Text style={s.artTicketCaption}>
                          VOTRE PROCHAIN RENDEZ-VOUS
                        </Text>
                        <View style={s.artTicketBody}>
                          <View>
                            <Text style={s.artId}>A01</Text>
                            <Text style={{ fontSize: 11, fontWeight: "600" }}>
                              Orange Analakely
                            </Text>
                            <Text
                              style={{
                                fontSize: 10,
                                color: "#999",
                                marginTop: 6,
                              }}
                            >
                              Demain · 09:00
                            </Text>
                          </View>
                          <QR value="ROBIA-DEMO-A01" size={75} />
                        </View>
                        <View style={s.ticketDash} />
                        <Text style={s.artTicketBottom}>
                          Un scan. Et vous voilà pris en charge.
                        </Text>
                      </View>
                      <View style={s.floatingCheck}>
                        <Icon name="check" color={orange} size={26} />
                      </View>
                      <View style={s.artStar}>
                        <Icon name="spark" color="#ffd4b6" size={36} />
                      </View>
                    </View>
                  )}
                </View>
                <View style={s.sectionHead}>
                  <View>
                    <Text style={s.sectionTitle}>
                      De quoi avez-vous besoin ?
                    </Text>
                    <Text style={s.sectionSub}>
                      Un service, un rendez-vous, et c’est réglé.
                    </Text>
                  </View>
                  {wide && <Text style={s.mutedTag}>NOS SERVICES</Text>}
                </View>
                <GuideSpot name="home-services" order={2} text="Sélectionnez le service souhaité : Orange Money, récupération de numéro, abonnement ou achat." style={[s.serviceGrid, !wide && { flexWrap: "wrap" }]}>
                  {services.map((v, i) => (
                    <Pressable
                      key={v.name}
                      onPress={() => open(i)}
                      style={({ pressed }) => [
                        s.serviceCard,
                        !wide && { flexBasis: "47%", minWidth: 130 },
                        pressed && {
                          borderColor: orange,
                          backgroundColor: "#fff9f4",
                        },
                      ]}
                    >
                      <View style={[s.serviceIcon, { backgroundColor: v.bg }]}>
                        <Icon name={v.icon} color={v.color} size={25} />
                      </View>
                      <Text style={s.serviceTitle}>{v.name}</Text>
                      <Text style={s.serviceDescription}>{v.sub}</Text>
                      <View style={s.serviceBottom}>
                        <Text style={s.serviceLink}>Prendre rendez-vous</Text>
                        <Icon name="arrow" size={15} color="#777" />
                      </View>
                    </Pressable>
                  ))}
                </GuideSpot>
              </>
            )}
            {tab === "Les boutiques" && <ShopLocator shops={shops} onBook={(index) => open(undefined, index)} />}
            {tab === "Accueil" && (
              <>
                <GuideSpot name="home-shops" order={3} text="Ouvrez les boutiques pour vous localiser, consulter la carte et préparer votre itinéraire dans Robia." style={s.sectionHead}>
                  <View>
                    <Text style={s.sectionTitle}>
                      Trouvez votre boutique Orange
                    </Text>
                    <Text style={s.sectionSub}>
                      Localisez-vous pour découvrir les boutiques proches.
                    </Text>
                  </View>
                  {tab === "Accueil" && (
                    <Pressable
                      onPress={() => setTab("Les boutiques")}
                      style={s.inlineLink}
                    >
                      <Text style={s.orangeLink}>
                        {wide ? "Toutes les boutiques" : "Tout voir"}
                      </Text>
                      <Icon name="arrow" color={orange} size={16} />
                    </Pressable>
                  )}
                </GuideSpot>
                <View
                  style={[s.shopGrid, !wide && { flexDirection: "column" }]}
                >
                  {shops.map(
                    (v, i) =>
                    (
                      <Pressable
                        key={v.name}
                        onPress={() => open(undefined, i)}
                        style={s.shopCard}
                      >
                        <View style={s.shopImageWrap}>
                          <Image
                            source={{
                              uri: `https://images.unsplash.com/${v.photo}?auto=format&fit=crop&w=700&q=85`,
                            }}
                            style={s.shopImage}
                          />
                          <View style={s.openBadge}>
                            <View style={s.greenDot} />
                            <Text style={s.openText}>
                              Horaires · 08:00 – 16:00
                            </Text>
                          </View>
                          <View style={s.distanceBadge}>
                            <Icon name="pin" size={12} color="white" />
                            <Text style={s.distanceText}>
                              Exemple
                            </Text>
                          </View>
                          <View style={s.orangeShopSign}>
                            <Text style={s.orangeShopText}>orange</Text>
                          </View>
                        </View>
                        <View style={s.shopDetails}>
                          <View style={s.shopNameRow}>
                            <Text style={s.shopName}>{v.name}</Text>
                            <Icon name="arrow" size={17} />
                          </View>
                          <Text style={s.shopAddress}>{v.address}</Text>
                          <View style={s.shopFooter}>
                            <Icon name="calendar" size={13} color="#6f997e" />
                            <Text style={s.available}>
                              Créneaux de démonstration
                            </Text>
                            <Text style={s.shopRating}>
                              ★{" "}
                              <Text style={{ color: "#777" }}>
                                4.{i === 0 ? "8" : "7"}
                              </Text>
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    ),
                  )}
                </View>
                <View style={s.demoNote}>
                  <Icon name="pin" color="#aaa" size={12} />
                  <Text style={s.noteText}>
                    Exemples de boutiques · Consultez Google Maps pour les établissements proches.
                  </Text>
                </View>
              </>
            )}
            {(tab === "Mes rendez-vous" || tab === "Mes tickets") && (
              <View style={s.records}>
                {tickets.length === 0 ? (
                  <View style={s.empty}>
                    <View style={s.serviceIcon}>
                      <Icon name="ticket" color={orange} size={30} />
                    </View>
                    <Text style={s.sectionTitle}>
                      Votre prochain rendez-vous commence ici
                    </Text>
                    <Text style={s.subtitle}>
                      Réservez une visite et retrouvez votre ticket dans cet
                      espace.
                    </Text>
                    <Button
                      label="Prendre rendez-vous"
                      onPress={() => open()}
                    />
                  </View>
                ) : (
                  tickets.map((t) => (
                    <View key={t.reference} style={s.record}>
                      <View style={{ flex: 1, gap: 8 }}>
                        <Text style={s.shopName}>
                          {t.id} · {shops[t.shop].name}
                        </Text>
                        <Text style={s.small}>
                          {t.date} à {t.time}
                        </Text>
                        <Text style={s.small}>
                          {t.services.map((i) => services[i].name).join(" · ")}
                        </Text>
                        <Text style={s.available}>
                          Réservation de démonstration
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          setTicket(t);
                          setStep(3);
                          setError("");
                          setModal(true);
                        }}
                        style={{ alignItems: "center", gap: 8 }}
                      >
                        <Icon name="ticket" color={orange} />
                        <Text style={s.orangeLink}>Voir le ticket</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            )}
            {tab === "Accueil" && (
              <View
                style=
              >
                <View style={s.howHeading}>
                  <View style={s.howIcon}>
                    <Icon name="spark" color={orange} />
                  </View>
                  <View>
                    <Text style={s.howTitle}>Votre visite en 3 étapes</Text>
                    <Text style={s.howSub}>On simplifie votre quotidien.</Text>
                  </View>
                </View>
                {[
                  {
                    title: "Choisissez votre service",
                    sub: "Et la boutique qui vous convient.",
                  },
                  {
                    title: "Réservez votre créneau",
                    sub: "À l’heure qui vous arrange.",
                  },
                  {
                    title: "Présentez votre QR code",
                    sub: "Votre conseiller vous attend.",
                  },
                ].map((v, i) => (
                  <View key={v.title} style={s.howStep}>
                    <View style={s.stepNumber}>
                      <Text style={s.stepNumberText}>{i + 1}</Text>
                    </View>
                    <View>
                      <Text style={s.howStepTitle}>{v.title}</Text>
                      <Text style={s.howSub}>{v.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            <View style={s.footer}>
              <Text style={s.footerText}>
                © {new Date().getFullYear()} Robia. Du temps pour l’essentiel.
              </Text>
              <Pressable onPress={() => setHelp(true)}>
                <Text style={s.footerText}>Aide & assistance ↗</Text>
              </Pressable>
            </View>
          </ScrollView>
          {!desktop && (
            <View style={s.mobileNav}>
              {navigation.map((n) => (
                <Pressable
                  key={n.label}
                  onPress={() => setTab(n.label)}
                  style={s.mobileNavItem}
                >
                  <Icon
                    name={n.icon}
                    size={21}
                    color={tab === n.label ? orange : "#999"}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      color: tab === n.label ? orange : "#888",
                      fontWeight: "600",
                    }}
                  >
                    {n.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
      <BookingDialog model={model} wide={wide} />
      <HelpDialog visible={help} onClose={() => setHelp(false)} />
    </SafeAreaView>
  ));
}
