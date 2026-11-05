import { useCurrentLocation } from "@/hooks/use-current-location";
import {
  directionsUrl,
  nearbyShopsUrl,
  placeUrl,
  type MapPlace,
  type TravelMode,
} from "@/utils/google-maps";
import * as Linking from "expo-linking";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking as NativeLinking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import NearbyMap from "./nearby-map";

type Props = {
  shops: { name: string; address: string }[];
  onBook: (index: number) => void;
};

function LocationIcon({
  color = "#ff6600",
  size = 22,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
    >
      <Circle cx={12} cy={12} r={7} />
      <Circle cx={12} cy={12} r={2} />
      <Path d="M12 1v4m0 14v4M1 12h4m14 0h4" />
    </Svg>
  );
}

export default function ShopLocator({ shops, onBook }: Props) {
  const { status, location, message, canAskAgain, locate } =
    useCurrentLocation();
  const [area, setArea] = useState("");
  const [mode, setMode] = useState<TravelMode>("driving");
  const [selected, setSelected] = useState<MapPlace | null>(null);
  const [linkError, setLinkError] = useState("");
  const position = location?.coords ?? null;
  const isLocating = status === "locating";

  const openMap = (url: string) => {
    setLinkError("");
    // Called directly from the press, preserving browser user activation.
    void Linking.openURL(url).catch(() => {
      setLinkError(
        "Google Maps n’a pas pu s’ouvrir. Vérifiez votre connexion puis réessayez.",
      );
    });
  };

  const directions = (place: MapPlace) =>
    openMap(directionsUrl(place, mode, position));

  return (
    <View style={s.container}>
      <View style={s.heading}>
        <Text style={s.eyebrow}>VOTRE VISITE COMMENCE ICI</Text>
        <Text style={s.title}>Trouvez votre boutique Orange.</Text>
        <Text style={s.description}>
          Votre position, les boutiques autour de vous et le meilleur chemin
          pour vous y rendre.
        </Text>
      </View>

      <View style={s.locationCard}>
        <View style={s.locationIcon}>
          <LocationIcon />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.cardTitle}>
            {position
              ? "Votre position est disponible"
              : "Où souhaitez-vous nous retrouver ?"}
          </Text>
          <Text style={s.small}>
            {position
              ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}${position.accuracy != null ? ` · précision ± ${Math.round(position.accuracy)} m` : ""}`
              : "Activez la localisation ou recherchez une ville."}
          </Text>
          {location && (
            <Text style={s.caption}>
              Position relevée à{" "}
              {new Date(location.timestamp).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
        <Pressable
          disabled={isLocating}
          onPress={() => void locate()}
          style={[s.locateButton, isLocating && { opacity: 0.6 }]}
          accessibilityLabel={
            position
              ? "Actualiser ma position"
              : "Utiliser ma position actuelle"
          }
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#ff6600" />
          ) : (
            <LocationIcon size={17} />
          )}
          <Text style={s.orangeText}>
            {isLocating
              ? "Recherche…"
              : position
                ? "Actualiser"
                : "Me localiser"}
          </Text>
        </Pressable>
      </View>

      {!!message && (
        <View style={s.notice}>
          <Text accessibilityRole="alert" style={s.noticeText}>
            {message}
          </Text>
          {status === "denied" &&
            !canAskAgain &&
            (Platform.OS === "web" ? (
              <Text style={s.small}>
                Modifiez l’autorisation de localisation dans les paramètres de
                votre navigateur.
              </Text>
            ) : (
              <Pressable
                onPress={() => {
                  void NativeLinking.openSettings().catch(() =>
                    setLinkError(
                      "Ouvrez les paramètres de votre appareil pour autoriser la localisation.",
                    ),
                  );
                }}
              >
                <Text style={s.orangeText}>Ouvrir les paramètres</Text>
              </Pressable>
            ))}
        </View>
      )}

      <View style={s.searchRow}>
        <TextInput
          style={s.input}
          value={area}
          onChangeText={setArea}
          placeholder="Une ville ou un quartier, par ex. Analakely"
          accessibilityLabel="Ville ou quartier pour rechercher une boutique Orange"
          returnKeyType="search"
          onSubmitEditing={() => openMap(nearbyShopsUrl(position, area))}
        />
      </View>

      <NearbyMap
        position={position}
        selected={selected}
        onSelect={setSelected}
      />

      <Pressable
        style={({ pressed }) => [s.primaryButton, pressed && { opacity: 0.8 }]}
        onPress={() => openMap(nearbyShopsUrl(position, area))}
      >
        <LocationIcon size={21} color="white" />
        <Text style={s.primaryText}>
          {area.trim()
            ? "Rechercher les boutiques dans cette zone"
            : "Voir les boutiques Orange autour de moi"}
        </Text>
        <Text style={s.externalArrow}>↗</Text>
      </Pressable>
      <Text style={s.caption}>
        Google Maps affiche les établissements, leurs horaires et leurs avis.
        Choisissez une boutique pour voir le trajet et sa durée.
      </Text>

      <View style={s.transport}>
        <Text style={s.cardTitle}>Votre mode de déplacement</Text>
        <View style={s.transportOptions}>
          {(
            [
              { value: "driving", label: "En voiture" },
              { value: "walking", label: "À pied" },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setMode(item.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: mode === item.value }}
              style={[s.modeButton, mode === item.value && s.modeActive]}
            >
              <Text
                style={[
                  s.modeText,
                  mode === item.value && { color: "#ff6600" },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.small}>
          Ce choix s’applique aux boutons « Itinéraire » ci-dessous. Le trajet
          et la durée sont calculés par Google Maps.
        </Text>
      </View>

      {selected && (
        <View style={s.selectedCard}>
          <Text style={s.eyebrow}>SÉLECTION SUR LA CARTE</Text>
          <Text style={s.cardTitle}>{selected.name}</Text>
          <View style={s.actions}>
            <Pressable
              style={s.outlineButton}
              onPress={() => openMap(placeUrl(selected))}
            >
              <Text style={s.orangeText}>Fiche Google Maps ↗</Text>
            </Pressable>
            <Pressable
              style={s.outlineButton}
              onPress={() => directions(selected)}
            >
              <Text style={s.orangeText}>Itinéraire ↗</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={s.demoHeading}>
        <Text style={s.sectionTitle}>Préparer un rendez-vous</Text>
        <Text style={s.small}>
          Boutiques de démonstration de Robia. Vérifiez leur fiche et leur
          emplacement dans Google Maps avant votre déplacement.
        </Text>
      </View>
      <View style={s.shopList}>
        {shops.map((shop, index) => (
          <View key={shop.name} style={s.shopCard}>
            <View style={s.shopTop}>
              <View style={s.orangeLogo}>
                <Text style={s.logoText}>orange</Text>
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={s.cardTitle}>{shop.name}</Text>
                <Text style={s.small}>{shop.address}</Text>
              </View>
              <Text style={s.demoBadge}>DÉMO</Text>
            </View>
            <View style={s.actions}>
              <Pressable
                style={s.outlineButton}
                onPress={() =>
                  directions({
                    name: shop.name,
                    address: `${shop.address}, Antananarivo, Madagascar`,
                  })
                }
                accessibilityLabel={`Itinéraire vers ${shop.name}`}
              >
                <Text style={s.orangeText}>Itinéraire ↗</Text>
              </Pressable>
              <Pressable style={s.bookingButton} onPress={() => onBook(index)}>
                <Text style={s.bookingText}>Prendre rendez-vous</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      {!position && (
        <Text style={s.caption}>
          Sans position GPS, Google Maps vous proposera de choisir le point de
          départ.
        </Text>
      )}
      {!!linkError && (
        <Text accessibilityRole="alert" style={s.error}>
          {linkError}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 18, marginTop: 5 },
  heading: { gap: 10 },
  eyebrow: {
    fontSize: 9,
    color: "#9a8b80",
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: "#202023",
  },
  description: { fontSize: 13, lineHeight: 21, color: "#888" },
  locationCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ececf0",
    padding: 17,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    flexWrap: "wrap",
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#fff0e5",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#292929" },
  small: { fontSize: 11, lineHeight: 18, color: "#888" },
  caption: { fontSize: 10, color: "#999", lineHeight: 17 },
  locateButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    backgroundColor: "#fff5ed",
  },
  orangeText: { fontSize: 11, fontWeight: "600", color: "#e65b00" },
  notice: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff2e8",
    gap: 10,
  },
  noticeText: { fontSize: 12, lineHeight: 19, color: "#8a5737" },
  searchRow: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e5ea",
  },
  input: { minHeight: 48, padding: 14, fontSize: 13, color: "#333" },
  primaryButton: {
    backgroundColor: "#ff6600",
    borderRadius: 10,
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  primaryText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    lineHeight: 19,
  },
  externalArrow: { fontSize: 22, color: "white" },
  transport: {
    gap: 12,
    padding: 18,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ececf0",
  },
  transportOptions: { flexDirection: "row", gap: 10 },
  modeButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 21,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8e8ed",
  },
  modeActive: { backgroundColor: "#fff3e9", borderColor: "#ff6600" },
  modeText: { fontSize: 12, fontWeight: "600", color: "#777" },
  selectedCard: {
    backgroundColor: "#fff6ee",
    borderWidth: 1,
    borderColor: "#ffd7b8",
    padding: 18,
    borderRadius: 12,
    gap: 12,
  },
  demoHeading: { marginTop: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#292929" },
  shopList: { gap: 12 },
  shopCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e8e8ed",
    padding: 18,
    borderRadius: 12,
    gap: 17,
  },
  shopTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  orangeLogo: {
    width: 45,
    height: 45,
    backgroundColor: "#ff6600",
    padding: 4,
    justifyContent: "flex-end",
  },
  logoText: {
    fontSize: 11,
    color: "white",
    letterSpacing: -0.5,
    fontWeight: "700",
  },
  demoBadge: { color: "#999", fontSize: 8, letterSpacing: 1 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  outlineButton: {
    minHeight: 44,
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#fff8f2",
    borderWidth: 1,
    borderColor: "#ffdcc2",
  },
  bookingButton: {
    minHeight: 44,
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#282828",
  },
  bookingText: { fontSize: 11, fontWeight: "600", color: "white" },
  error: { color: "#b83e22", fontSize: 12, lineHeight: 19 },
});
