import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppServicesProvider } from "@/composition/app-services-provider";
import { GuideProvider } from "@/presentation/onboarding/guide-provider";
export default function Layout() {
  return (
    <AppServicesProvider>
      <GuideProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </GuideProvider>
    </AppServicesProvider>
  );
}
