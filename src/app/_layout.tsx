import { Stack, router } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AppServicesProvider, useAppServices } from "@/composition/app-services-provider";
import { GuideProvider } from "@/presentation/onboarding/guide-provider";
import { ProfileProvider, ProfileGate } from '@/presentation/profile/profile-provider';

SplashScreen.setOptions({ duration: 400, fade: true });

export default function Layout() {
  return (
    <AppServicesProvider>
      <ProfileProvider>
      <GuideProvider>
        <NotificationObserver />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
        <ProfileGate />
      </GuideProvider>
      </ProfileProvider>
    </AppServicesProvider>
  );
}

function NotificationObserver() {
  const app = useAppServices();
  useEffect(() => app.observeNotificationResponses(() => router.push('/notifications')), [app]);
  return null;
}
