import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export default function MapPlaceholder() {
  return (
    <View style={s.container}>
      <View style={s.icon}>
        <Svg
          width={40}
          height={40}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ff6600"
          strokeWidth={1.5}
        >
          <Path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
          <Circle cx={12} cy={10} r={3} />
        </Svg>
      </View>
      <Text style={s.title}>Les bonnes adresses, autour de vous.</Text>
      <Text style={s.description}>
        La carte intégrée n’est pas encore disponible. Vous pourrez y retrouver
        les boutiques et votre trajet sans quitter Robia.
      </Text>
      <Text style={s.caption}>
        La localisation et les réservations restent accessibles.
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  container: {
    minHeight: 260,
    padding: 28,
    gap: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff7f0",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ffe4ce",
  },
  icon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#252525",
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 400,
  },
  caption: { fontSize: 11, color: "#977b68", textAlign: "center" },
});
