import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

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
