import { router } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInputProps } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { validateCustomer } from "../../domain/booking/rules";
import { Button } from "../booking/components/booking-button";
import { Icon } from "../booking/components/booking-icon";
import { bookingErrorMessage } from "../booking/models/booking-messages";
import { Brand, Elevation, Radius, TOUCH } from "../shared/brand";
import { PressableScale } from "../shared/components/pressable-scale";
import { Text, TextInput } from "../shared/components/text";
import { useProfile } from "./profile-provider";
import { EmailRecovery } from './email-recovery';

const logo = require("../../../assets/images/robia-iot-logo-transparent.png");

function Field({ label, icon, hint, ...input }: TextInputProps & { label: string; icon: string; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.field, focused && s.fieldFocused]}>
        <Icon name={icon} size={19} color={focused ? Brand.orange : Brand.textTertiary} />
        <TextInput
          {...input}
          accessibilityLabel={label}
          onFocus={event => { setFocused(true); input.onFocus?.(event); }}
          onBlur={event => { setFocused(false); input.onBlur?.(event); }}
          style={s.input}
        />
      </View>
      {!!hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, save } = useProfile();
  const [name, setName] = useState(profile?.name ?? "");
  const [cin, setCin] = useState(profile?.cin ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy) return;
    const customer = { name: name.trim(), cin: cin.trim(), phone: phone.trim() };
    try {
      validateCustomer(customer);
    } catch (e) {
      setError(bookingErrorMessage(e));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await save(customer);
      if (profile && router.canGoBack()) router.back();
      else router.replace("/");
    } catch {
      setError("Impossible d’enregistrer vos informations. Réessayez.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          {profile ? (
            <View style={s.topBar}>
              <PressableScale accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={s.back}>
                <View style={{ transform: [{ scaleX: -1 }] }}><Icon name="arrow" size={20} color={Brand.ink} /></View>
              </PressableScale>
            </View>
          ) : null}

          <Animated.View entering={FadeInDown.duration(450)} style={s.hero}>
            <View style={s.logoTile}>
              <Image source={logo} style={{ width: 84, height: 56 }} resizeMode="contain" />
            </View>
            <Text style={s.heroEyebrow}>{profile ? "VOTRE ESPACE" : "BIENVENUE"}</Text>
            <Text accessibilityRole="header" style={s.heroTitle}>
              {profile ? "Mes informations" : <>Bienvenue sur robia<Text style={{ color: Brand.white, opacity: 0.6 }}>.</Text></>}
            </Text>
            <Text style={s.heroText}>
              {profile
                ? "Mettez à jour vos coordonnées pour vos prochains rendez-vous."
                : "Renseignez-vous une seule fois : vos prochaines réservations ne prendront que quelques secondes."}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(80)} style={s.card}>
            <Field label="Nom complet" icon="user" value={name} onChangeText={setName} autoComplete="name" placeholder="Votre nom et prénom" returnKeyType="next" />
            <Field label="Numéro de CIN" icon="ticket" value={cin} onChangeText={setCin} keyboardType="number-pad" maxLength={12} placeholder="12 chiffres" hint="Votre CIN originale sera demandée en boutique." />
            <Field label="Téléphone (facultatif)" icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="034 00 000 00" />
          </Animated.View>

          <View style={s.privacy}>
            <Icon name="check" size={16} color="#278251" />
            <Text style={s.privacyText}>
              {Platform.OS === "web"
                ? "Sur le web, ces informations sont enregistrées dans ce navigateur sans chiffrement. Utilisez un appareil personnel."
                : "Vos informations restent sur cet appareil et servent uniquement à vos rendez-vous."}
            </Text>
          </View>
          {!!error && (
            <View style={s.errorBox}><Text accessibilityRole="alert" style={s.errorText}>{error}</Text></View>
          )}
          <Button
            label={busy ? "Enregistrement…" : profile ? "Enregistrer" : "Commencer"}
            loading={busy}
            icon={profile ? "check" : "arrow"}
            onPress={() => void submit()}
          />
          {profile && (
            <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={s.cancel}>
              <Text style={s.cancelText}>Annuler</Text>
            </Pressable>
          )}
          <EmailRecovery />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.canvas },
  content: { flexGrow: 1, padding: 20, paddingBottom: 40, maxWidth: 560, width: "100%", alignSelf: "center", gap: 16 },
  topBar: { flexDirection: "row" },
  back: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: Brand.surface, alignItems: "center", justifyContent: "center", ...Elevation.card },
  hero: { backgroundColor: Brand.orange, borderRadius: Radius.lg, padding: 24, overflow: "hidden", gap: 6, ...Elevation.glow },
  logoTile: { alignSelf: "flex-start", marginBottom: 12 },
  heroEyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.3, color: "rgba(255,255,255,0.85)" },
  heroTitle: { fontSize: 30, lineHeight: 35, fontWeight: "800", letterSpacing: -1.2, color: Brand.white },
  heroText: { fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.9)" },
  card: { backgroundColor: Brand.surface, borderRadius: Radius.card, padding: 20, gap: 18, ...Elevation.card },
  label: { fontSize: 14, fontWeight: "700" },
  field: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 56, paddingHorizontal: 16, borderRadius: Radius.control, backgroundColor: Brand.canvas, borderWidth: 2, borderColor: "transparent" },
  fieldFocused: { borderColor: Brand.orange, backgroundColor: Brand.white, boxShadow: "0px 0px 0px 4px rgba(255,102,0,0.12)" },
  input: { flex: 1, minWidth: 0, minHeight: 52, fontSize: 16, fontWeight: "600", paddingVertical: 0 },
  hint: { fontSize: 12, color: Brand.textTertiary },
  privacy: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingHorizontal: 4 },
  privacyText: { flex: 1, fontSize: 13, color: Brand.textSecondary, lineHeight: 19 },
  errorBox: { backgroundColor: "#FFF0EF", borderRadius: Radius.control, padding: 14 },
  errorText: { color: "#BE554E", fontSize: 14, fontWeight: "500" },
  cancel: { minHeight: TOUCH, alignItems: "center", justifyContent: "center" },
  cancelText: { color: Brand.textSecondary, fontWeight: "600", fontSize: 15 },
});
