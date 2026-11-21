import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { validateCustomer } from "../../domain/booking/rules";
import { bookingErrorMessage } from "../booking/models/booking-messages";
import { useProfile } from "./profile-provider";
import { EmailRecovery } from './email-recovery';

export default function ProfileScreen() {
  const { profile, save } = useProfile();
  const [name, setName] = useState(profile?.name ?? "");
  const [cin, setCin] = useState(profile?.cin ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy) return;
    const customer = {
      name: name.trim(),
      cin: cin.trim(),
      phone: phone.trim(),
    };
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fffaf6" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            maxWidth: 560,
            width: "100%",
            alignSelf: "center",
            gap: 16,
          }}
        >
          {profile && (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ color: "#df6516", fontWeight: "700" }}>
                ← Retour
              </Text>
            </Pressable>
          )}
          <Text
            style={{
              color: "#df6516",
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            VOTRE ESPACE RobIoT
          </Text>
          <Text style={{ fontSize: 30, fontWeight: "800", color: "#222" }}>
            {profile ? "Mes informations" : "Bienvenue chez Robia"}
          </Text>
          <Text style={{ color: "#666", lineHeight: 22 }}>
            {profile
              ? "Modifiez vos coordonnées pour vos prochains rendez-vous."
              : "Renseignez vos informations une seule fois pour préparer vos prochains rendez-vous."}
          </Text>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              gap: 12,
              borderWidth: 1,
              borderColor: "#f1e8e0",
            }}
          >
            <Text style={{ fontWeight: "700", color: "#333" }}>
              Nom complet *
            </Text>
            <TextInput
              accessibilityLabel="Nom complet"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              placeholder="Votre nom et prénom"
              style={inputStyle}
            />
            <Text style={{ fontWeight: "700", color: "#333" }}>
              Numéro de CIN *
            </Text>
            <TextInput
              accessibilityLabel="Numéro de CIN"
              value={cin}
              onChangeText={setCin}
              keyboardType="number-pad"
              maxLength={12}
              placeholder="12 chiffres"
              style={inputStyle}
            />
            <Text style={{ fontWeight: "700", color: "#333" }}>
              Téléphone (facultatif)
            </Text>
            <TextInput
              accessibilityLabel="Téléphone facultatif"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="034 00 000 00"
              style={inputStyle}
            />
          </View>
          <Text style={{ color: "#777", lineHeight: 20 }}>
            {Platform.OS === "web"
              ? "Sur le web, ces informations sont enregistrées dans ce navigateur sans chiffrement. Utilisez un appareil personnel."
              : "Vos informations sont conservées sur cet appareil et réutilisées pour vos rendez-vous."}
          </Text>
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: "#a23c25" }}>
              {error}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => void submit()}
            style={{
              backgroundColor: "#e76513",
              borderRadius: 14,
              minHeight: 54,
              alignItems: "center",
              justifyContent: "center",
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "white", fontWeight: "800" }}>
              {busy ? "Enregistrement…" : "Enregistrer mes informations"}
            </Text>
          </Pressable>
          <EmailRecovery />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const inputStyle = {
  borderWidth: 1,
  borderColor: "#e7e3df",
  borderRadius: 12,
  paddingHorizontal: 14,
  minHeight: 50,
  color: "#222",
} as const;
