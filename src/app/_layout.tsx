
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { AppState } from 'react-native';
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from 'expo-font';
import { AppServicesProvider, useAppServices } from "@/composition/app-services-provider";
import { GuideProvider } from "@/presentation/onboarding/guide-provider";
import { ProfileProvider, ProfileGate } from '@/presentation/profile/profile-provider';
import { appFonts } from '@/presentation/shared/components/text';
import { Brand } from '@/presentation/shared/brand';

SplashScreen.setOptions({ duration: 400, fade: true });
void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const ready = fontsLoaded || !!fontError;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;
  return (
    <AppServicesProvider>
      <ProfileProvider>
      <GuideProvider>
        <NotificationObserver />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: Brand.canvas } }} />
        <ProfileGate />
      </GuideProvider>
      </ProfileProvider>
    </AppServicesProvider>
  );
}

function NotificationObserver() {
  const app = useAppServices();
  useEffect(() => app.observeNotificationResponses(() => router.push('/notifications')), [app]);
  useEffect(() => {
    const register = () => { void app.registerAppointmentPush().catch(() => {}); };
    register();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') register(); });
    return () => subscription.remove();
  }, [app]);
  return null;
}
