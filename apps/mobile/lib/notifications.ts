import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // Show immediately
  });
}

export async function sendOrderNotification(orderNumber: string) {
  await sendLocalNotification(
    'Order Placed Successfully! 🎉',
    `Your order #${orderNumber} has been placed. We'll notify you when it's ready.`,
    { type: 'order', orderNumber },
  );
}

export async function sendLowStockNotification(productName: string) {
  await sendLocalNotification(
    'Low Stock Alert ⚠️',
    `${productName} is running low on stock.`,
    { type: 'low_stock', productName },
  );
}

export async function sendAdminOrderNotification(orderNumber: string, customerName: string) {
  await sendLocalNotification(
    'New Order Received 📦',
    `Order #${orderNumber} from ${customerName} needs your attention.`,
    { type: 'admin_order', orderNumber },
  );
}
