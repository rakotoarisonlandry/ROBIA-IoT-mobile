import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppServicesProvider } from "@/composition/app-services-provider";
export default function Layout() {
  return (
    <AppServicesProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppServicesProvider>
  );
}
