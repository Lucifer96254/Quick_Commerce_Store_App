import { useLocalSearchParams, router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING: { bg: '#FFF7ED', text: '#C2410C', icon: 'clock' },
  CONFIRMED: { bg: '#EFF6FF', text: '#1D4ED8', icon: 'check-circle' },
  PACKED: { bg: '#F5F3FF', text: '#7C3AED', icon: 'package' },
  OUT_FOR_DELIVERY: { bg: '#ECFDF5', text: '#059669', icon: 'truck' },
  DELIVERED: { bg: '#F0FDF4', text: '#16A34A', icon: 'check' },
  CANCELLED: { bg: '#FEF2F2', text: '#DC2626', icon: 'x-circle' },
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', id],
    enabled: !!id,
    queryFn: () => ordersApi.getById(id!),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC8019" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Feather name="alert-circle" size={32} color="#d1d5db" />
        </View>
        <Text style={styles.errorText}>Failed to load order details</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const o: any = order;
  const config = statusConfig[o.status] || { bg: '#f3f4f6', text: '#374151', icon: 'help-circle' };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Order Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.orderNumber}>{o.orderNumber}</Text>
            <Text style={styles.dateText}>
              {new Date(o.createdAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Feather name={config.icon as any} size={12} color={config.text} />
            <Text style={[styles.statusText, { color: config.text }]}>
              {o.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items Ordered</Text>
        {o.items?.map((item: any) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product?.name || 'Product'}</Text>
              <Text style={styles.itemUnit}>{item.product?.unit}</Text>
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemQty}>× {item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{item.total}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Bill Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bill Summary</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Subtotal</Text>
          <Text style={styles.billValue}>₹{o.subtotal ?? o.total}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Fee</Text>
          <Text style={[styles.billValue, !o.deliveryFee && { color: '#059669' }]}>
            {o.deliveryFee ? `₹${o.deliveryFee}` : 'FREE'}
          </Text>
        </View>
        <View style={styles.billDivider} />
        <View style={styles.billRow}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalValue}>₹{o.total}</Text>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIconContainer}>
            <Feather name="map-pin" size={14} color="#FC8019" />
          </View>
          <Text style={styles.cardTitle}>Delivery Address</Text>
        </View>
        {o.shippingAddress ? (
          <Text style={styles.addressText}>{o.shippingAddress.fullAddress}</Text>
        ) : (
          <Text style={styles.addressText}>Address not available.</Text>
        )}
      </View>

      {/* Back to Orders */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(tabs)/orders')}
        activeOpacity={0.7}
      >
        <Feather name="arrow-left" size={16} color="#FC8019" />
        <Text style={styles.backText}>Back to Orders</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#FC8019',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemUnit: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  itemMeta: {
    alignItems: 'flex-end',
  },
  itemQty: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
  },
  addressText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FC8019',
    gap: 6,
  },
  backText: {
    color: '#FC8019',
    fontWeight: '600',
    fontSize: 14,
  },
});
