import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications = null;

// Only load expo-notifications in native builds outside Expo Go
if (Platform.OS !== 'web' && !isExpoGo) {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Global reference to clear active web timer
let webTimerId = null;

export const registerForPushNotificationsAsync = async () => {
  // Web browser notification permission
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  if (isExpoGo) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Notification permission error:', err);
    return false;
  }
};

export const scheduleWorkoutUnlockNotification = async (
  lastWorkoutDate,
  nextDayNumber = 2,
  overrideSeconds = null
) => {
  const completionTimestamp = new Date(lastWorkoutDate).getTime();
  const unlockTimestamp = completionTimestamp + (24 * 60 * 60 * 1000);
  const now = Date.now();

  const secondsRemaining = overrideSeconds !== null
    ? overrideSeconds
    : Math.round((unlockTimestamp - now) / 1000);

  if (secondsRemaining <= 0) return null;

  // WEB NOTIFICATION TRIGGER
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission !== 'granted') {
        await window.Notification.requestPermission();
      }

      if (webTimerId) clearTimeout(webTimerId);

      webTimerId = setTimeout(() => {
        new window.Notification("Time to Train! 🏋️‍♂️", {
          body: `Your recovery window is up. Day ${nextDayNumber} is unlocked and ready!`,
          icon: '/favicon.png', // Uses standard web asset
        });
      }, secondsRemaining * 1000);

      return 'web-timer-scheduled';
    }
    return null;
  }

  // NATIVE BUILD TRIGGER
  if (isExpoGo || !Notifications) return null;

  try {
    await cancelWorkoutNotifications();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Train! 🏋️‍♂️",
        body: `Your recovery window is up. Day ${nextDayNumber} is unlocked and ready!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        channelId: 'workout-reminders',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsRemaining,
        repeats: false,
      },
    });
  } catch (error) {
    console.error("Failed to schedule notification:", error);
    return null;
  }
};

export const cancelWorkoutNotifications = async () => {
  if (Platform.OS === 'web') {
    if (webTimerId) {
      clearTimeout(webTimerId);
      webTimerId = null;
    }
    return;
  }

  if (isExpoGo || !Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Failed to cancel notifications:", error);
  }
};