import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('workout-reminders', {
      name: 'Workout Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00FF7F',
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export const scheduleWorkoutUnlockNotification = async (lastWorkoutDate, nextDayNumber = 2) => {
  try {
    await cancelWorkoutNotifications();

    const completionTimestamp = new Date(lastWorkoutDate).getTime();
    const unlockTimestamp = completionTimestamp + (24 * 60 * 60 * 1000);
    const triggerDate = new Date(unlockTimestamp);

    if (triggerDate.getTime() <= Date.now()) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Train! 🏋️‍♂️",
        body: `Your 24-hour recovery window is up. Day ${nextDayNumber} is unlocked and ready!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        channelId: 'workout-reminders',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.error("Failed to schedule notification:", error);
    return null;
  }
};

export const cancelWorkoutNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};