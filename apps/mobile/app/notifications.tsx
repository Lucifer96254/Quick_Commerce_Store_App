import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import * as Notifications from 'expo-notifications';

interface NotificationItem {
  id: string;
  type: 'order' | 'low_stock' | 'admin_order';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Get user orders for order notifications
  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(),
  });

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Listen for notifications
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      const newNotification: NotificationItem = {
        id: notification.request.identifier || Date.now().toString(),
        type: notification.request.content.data?.type || 'order',
        title: notification.request.content.title || 'Notification',
        message: notification.request.content.body || '',
        timestamp: new Date(),
        read: false,
        data: notification.request.content.data,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    });

    // Get notification response (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'order' && data?.orderNumber) {
        // Find order and navigate to it
        const orderList = (orders as any)?.items || [];
        const order = orderList.find((o: any) => o.orderNumber === data.orderNumber);
        if (order) {
          router.push(`/order/${order.id}`);
        }
      }
    });

    // Load existing notifications from orders
    loadNotificationsFromOrders();

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [orders]);

  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus === 'granted') {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        setExpoPushToken(token);
      }
    } catch (error) {
      console.log('Error registering for push notifications:', error);
    }
  };

  const loadNotificationsFromOrders = () => {
    const orderList = (orders as any)?.items || [];
    const orderNotifications: NotificationItem[] = orderList
      .slice(0, 10) // Show last 10 orders
      .map((order: any) => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        title: 'Order Placed',
        message: `Your order #${order.orderNumber || order.id} has been placed successfully.`,
        timestamp: new Date(order.createdAt),
        read: false,
        data: { orderNumber: order.orderNumber, orderId: order.id },
      }));

    setNotifications(orderNotifications);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    markAsRead(notification.id);
    if (notification.type === 'order' && notification.data?.orderId) {
      router.push(`/order/${notification.data.orderId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'package';
      case 'low_stock':
        return 'alert-triangle';
      case 'admin_order':
        return 'shopping-bag';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return '#FC8019';
      case 'low_stock':
        return '#ef4444';
      case 'admin_order':
        return '#2563EB';
      default:
        return '#6b7280';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="bell-off" size={48} color="#d1d5db" />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            You'll receive notifications about your orders and important updates here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notificationItem, !item.read && styles.notificationUnread]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getNotificationColor(item.type) + '15' },
                ]}
              >
                <Feather
                  name={getNotificationIcon(item.type) as any}
                  size={20}
                  color={getNotificationColor(item.type)}
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                refetchOrders();
                loadNotificationsFromOrders();
              }}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 3,
    borderLeftColor: '#FC8019',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FC8019',
    marginLeft: 8,
    marginTop: 4,
  },
});
