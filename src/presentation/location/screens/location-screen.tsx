import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookingDialog } from "../../booking/components/booking-dialog";
import { useBookingWorkflow } from "../../booking/hooks/use-booking-workflow";
import { LocationIcon } from "../components/location-icon";
import NearbyMap from "../components/nearby-map";
import { useShopLocator } from "../hooks/use-shop-locator";
import { distanceLabel } from "../models/route-labels";

export default function LocationScreen() {
  const { shopId, itineraire } = useLocalSearchParams<{ shopId?: string; itineraire?: string }>();
  const { height, width } = useWindowDimensions();
  const model = useBookingWorkflow();
  const locator = useShopLocator();
  const [routeShopId, setRouteShopId] = useState<string | null>(null);
  const [routeRevision, setRouteRevision] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const {
    selected,
    select,
    places,
    position,
    locate,
    isLocating,
    message,
    status,
    canAskAgain,
    openSettings,
    area,
    setArea,
    search,
  } = locator;
  useEffect(() => {
    if (shopId && !selected) {
      const place = places.find((item) => item.shopId === shopId);
      if (place) select(place);
    }
  }, [shopId, selected, places, select]);
  const bookingIndex = selected
    ? model.shops.findIndex((shop) => shop.id === selected.shopId)
    : -1;
  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right", "bottom"]}>
      <View style={s.header}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={s.back}
        >
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Localisation</Text>
          <Text style={s.subtitle}>Trouvez votre boutique sur la carte</Text>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <View style={s.mapWrap}>
          <NearbyMap
            key={routeRevision}
            height={Math.max(350, Math.min(height * 0.58, 650))}
            position={position}
            places={places}
            selected={selected}
            onSelect={(place) => {
              setRouteShopId(null);
              select(place);
            }}
            showRoute={!!selected && (selected.shopId === routeShopId || (itineraire === '1' && selected.shopId === shopId))}
          />
        </View>
        <Pressable
          onPress={() => void locate()}
          disabled={isLocating}
          accessibilityRole="button"
          style={s.locate}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#ed6100" />
          ) : (
            <LocationIcon color="#ed6100" size={19} />
          )}
          <Text style={s.locateText}>
            {isLocating
              ? "Recherche de votre position…"
              : position
              ? "Actualiser ma position"
              : "Me localiser"}
          </Text>
        </Pressable>
        {!!message && (
          <View style={s.notice}>
            <Text accessibilityRole="alert" style={s.body}>
              {message}
            </Text>
            {status === "denied" &&
              !canAskAgain &&
              (Platform.OS === "web" ? (
                <Text style={s.body}>
                  Autorisez la localisation dans votre navigateur.
                </Text>
              ) : (
                <Pressable onPress={openSettings}>
                  <Text style={s.link}>Ouvrir les paramètres</Text>
                </Pressable>
              ))}
          </View>
        )}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Choisir une boutique</Text>
          <Text style={s.subtitle}>Recherchez par nom ou quartier.</Text>
          <View style={s.search}>
            <TextInput
              value={area}
              onChangeText={setArea}
              onSubmitEditing={search}
              maxLength={120}
              placeholder="Nom ou quartier"
              placeholderTextColor="#888"
              accessibilityLabel="Rechercher une boutique"
              returnKeyType="search"
              style={s.input}
            />
            <Pressable
              onPress={search}
              accessibilityRole="button"
              style={s.searchButton}
            >
              <Text style={s.searchText}>Rechercher</Text>
            </Pressable>
          </View>
        </View>
        {selected && (
          <View style={s.selected}>
            <Text style={s.label}>
              BOUTIQUE SÉLECTIONNÉE{selected.isDemo ? " · DÉMONSTRATION" : ""}
            </Text>
            <Text style={s.cardTitle}>{selected.name}</Text>
            <Text style={s.body}>{selected.address}</Text>
            {selected.straightLineMeters != null && (
              <Text style={s.link}>
                {distanceLabel(selected.straightLineMeters)} à vol d’oiseau
              </Text>
            )}
            {!selected.coordinates && (
              <Text style={s.body}>Position sur la carte non renseignée.</Text>
            )}
            {selected.coordinates &&
              (position ? (
                <Pressable
                  onPress={() => {
                    setRouteShopId(selected.shopId);
                    setRouteRevision((value) => value + 1);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                  accessibilityRole="button"
                  style={s.primary}
                >
                  <Text style={s.primaryText}>
                    Afficher l’itinéraire et la distance
                  </Text>
                </Pressable>
              ) : (
                <Text style={s.body}>
                  Localisez-vous pour calculer le trajet jusqu’à cette boutique.
                </Text>
              ))}
            {bookingIndex >= 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => model.open(undefined, bookingIndex)}
                style={s.secondary}
              >
                <Text style={s.link}>
                  Réserver dans cette boutique{selected.isDemo ? " (démo)" : ""}
                </Text>
              </Pressable>
            )}
          </View>
        )}
        {locator.mapError ? (
          <Text accessibilityRole="alert" style={s.body}>
            {locator.mapError}
          </Text>
        ) : null}
        {!places.length && (
          <Text style={s.body}>Aucune boutique trouvée dans le catalogue.</Text>
        )}
        {places.map((place) => (
          <Pressable
            key={place.shopId}
            onPress={() => {
              setRouteShopId(null);
              select(place);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: place.shopId === selected?.shopId }}
            style={[s.card, place.shopId === selected?.shopId && s.cardActive]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.cardTitle}>{place.name}</Text>
              <Text style={s.body}>{place.address}</Text>
              <Text style={s.small}>
                {place.isDemo ? "Démonstration · " : ""}
                {place.coordinates
                  ? "Afficher sur la carte"
                  : "Position non renseignée"}
              </Text>
            </View>
            {place.straightLineMeters != null && (
              <Text style={s.link}>
                {distanceLabel(place.straightLineMeters)}
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
      <BookingDialog model={model} wide={width >= 730} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f9fb" },
  header: {
    backgroundColor: "white",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 30, lineHeight: 34, color: "#252525" },
  title: { fontSize: 22, fontWeight: "800", color: "#222" },
  subtitle: { color: "#777", fontSize: 13, lineHeight: 19 },
  content: {
    padding: 16,
    gap: 14,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingBottom: 32,
  },
  mapWrap: { width: "100%" },
  locate: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fff0e5",
    borderRadius: 14,
  },
  locateText: { color: "#df5c00", fontWeight: "700" },
  notice: { backgroundColor: "#fff3e8", padding: 14, borderRadius: 12, gap: 8 },
  section: { gap: 7, marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#222" },
  search: { flexDirection: "row", gap: 8, marginTop: 4 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: "#222",
  },
  searchButton: {
    justifyContent: "center",
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "#262626",
  },
  searchText: { color: "white", fontWeight: "700", fontSize: 12 },
  selected: {
    backgroundColor: "#fff4eb",
    borderRadius: 16,
    padding: 18,
    gap: 9,
  },
  label: {
    fontSize: 10,
    color: "#e3620b",
    letterSpacing: 1,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    gap: 8,
  },
  cardActive: { borderColor: "#ff6600" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#222" },
  body: { color: "#666", fontSize: 13, lineHeight: 20 },
  small: { color: "#999", fontSize: 11 },
  link: { color: "#e45e00", fontWeight: "700", fontSize: 12 },
  primary: {
    backgroundColor: "#ff6600",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  primaryText: { color: "white", fontWeight: "700" },
  secondary: { paddingVertical: 8 },
});
