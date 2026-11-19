import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAppServices } from '../../composition/app-services-provider';
import type { Customer } from '../../domain/booking/entities';

type ProfileContextValue = { profile: Customer | null; loading: boolean; error: boolean; reload: () => void; save: (customer: Customer) => Promise<void> };
const ProfileContext = createContext<ProfileContextValue | null>(null);
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { profileStore } = useAppServices();
  const [profile, setProfile] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    setLoading(true); setError(false);
    void profileStore.load().then(setProfile).catch(() => setError(true)).finally(() => setLoading(false));
  }, [profileStore]);
  useEffect(() => {
    let active = true;
    void profileStore.load().then(value => { if (active) setProfile(value); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [profileStore]);
  const save = async (customer: Customer) => { await profileStore.save(customer); setProfile(customer); };
  return <ProfileContext.Provider value={{ profile, loading, error, reload: load, save }}>{children}</ProfileContext.Provider>;
}
export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('ProfileProvider missing');
  return context;
}
export function ProfileGate() {
  const { profile, loading, error, reload } = useProfile();
  const path = usePathname();
  const navigation = useRootNavigationState();
  useEffect(() => {
    if (navigation?.key && !loading && !error && !profile && path !== '/profil') router.replace('/profil');
  }, [navigation?.key, loading, error, profile, path]);
  if (!loading && !error && (profile || path === '/profil')) return null;
  return <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 }}>
    {error ? <><Text accessibilityRole="alert" style={{ textAlign: 'center', color: '#333' }}>Impossible de charger vos informations. Vérifiez le stockage de votre appareil et réessayez.</Text><Pressable accessibilityRole="button" onPress={reload}><Text style={{ color: '#e86512', fontWeight: '700' }}>Réessayer</Text></Pressable></> : <ActivityIndicator color="#e86512" />}
  </View>;
}
