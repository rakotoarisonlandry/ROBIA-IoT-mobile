import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function registerAppointmentPush(register: (token: string) => Promise<unknown>, askPermission = false): Promise<boolean> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return false;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('appointments', { name: 'Rendez-vous', importance: 4 });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain && askPermission) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof projectId !== 'string' || !projectId) return false;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await register(token.data);
  return true;
}

export async function scheduleBookingReminder(appointmentAt: string, shop: string): Promise<'scheduled' | 'denied' | 'too-late'> {
  const reminder = new Date(new Date(appointmentAt).getTime() - 60 * 60 * 1000);
  if (reminder.getTime() <= Date.now()) return 'too-late';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('appointments', { name: 'Rendez-vous', importance: 3 });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return 'denied';
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Votre rendez-vous approche', body: `Votre rendez-vous à ${shop} commence dans une heure.`, data: { destination: 'notifications' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder, channelId: 'appointments' },
  });
  return 'scheduled';
}

export function observeNotificationResponses(onOpen: () => void): () => void {
  const handle = (response: Notifications.NotificationResponse | null) => {
    if (response?.notification.request.content.data?.destination === 'notifications') {
      Notifications.clearLastNotificationResponse();
      onOpen();
    }
  };
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  handle(Notifications.getLastNotificationResponse());
  return () => subscription.remove();
}
