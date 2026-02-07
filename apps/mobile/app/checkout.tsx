import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi, ordersApi, addressesApi } from '@/lib/api';
import { sendOrderNotification } from '@/lib/notifications';

export default function CheckoutScreen() {
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] =
    React.useState<'CASH_ON_DELIVERY' | 'RAZORPAY' | 'STRIPE'>('CASH_ON_DELIVERY');

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list(),
  });

  // Auto-select first address
  React.useEffect(() => {
    const addrList = (addresses as any)?.items || (addresses as any[]) || [];
    if (!selectedAddressId && addrList.length > 0) {
      const defaultAddr = addrList.find((a: any) => a.isDefault);
      setSelectedAddressId(defaultAddr ? defaultAddr.id : addrList[0].id);
    }
  }, [addresses, selectedAddressId]);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const c: any = cart;
      if (!c || !c.items || c.items.length === 0) {
        throw new Error('Cart is empty');
      }
      const addrList = (addresses as any)?.items || (addresses as any[]) || [];
      if (!addrList.length) {
        throw new Error('No delivery address found. Please add an address first.');
      }
      const addressId = selectedAddressId || addrList[0].id;
      return ordersApi.create({ addressId, paymentMethod });
    },
    onSuccess: async (order: any) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Send push notification
      await sendOrderNotification(order.orderNumber || order.id);
      Alert.alert('Order Placed! 🎉', 'Your order has been placed successfully.', [
        {
          text: 'View Order',
          onPress: () => router.replace(`/order/${order.id}`),
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Checkout Failed', err?.message || 'Unable to place order.');
    },
  });

  const isPlacing = createOrderMutation.isPending;

  if ((cartLoading || addressesLoading) && !cart) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC8019" />
      </View>
    );
  }

  const c: any = cart;
  const items = c?.items || [];
  const addrList = (addresses as any)?.items || (addresses as any[]) || [];

  if (!c || items.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Feather name="shopping-cart" size={40} color="#d1d5db" />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add products before checking out</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.primaryButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ETA Banner */}
        <View style={styles.etaBanner}>
          <Feather name="zap" size={16} color="#FC8019" />
          <Text style={styles.etaText}>Delivery in 10–15 minutes</Text>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Feather name="map-pin" size={16} color="#FC8019" />
            </View>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/addresses')}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          {addrList.length === 0 ? (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => router.push('/addresses')}
            >
              <Feather name="plus" size={16} color="#FC8019" />
              <Text style={styles.addAddressText}>Add a delivery address</Text>
            </TouchableOpacity>
          ) : (
            addrList.map((addr: any) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressOption,
                  addr.id === selectedAddressId && styles.addressOptionSelected,
                ]}
                onPress={() => setSelectedAddressId(addr.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radioOuter,
                  addr.id === selectedAddressId && styles.radioOuterActive,
                ]}>
                  {addr.id === selectedAddressId && <View style={styles.radioInner} />}
                </View>
                <View style={styles.addressInfo}>
                  <View style={styles.addressLabelRow}>
                    <Text style={styles.addressName}>{addr.label || addr.fullName}</Text>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressLine} numberOfLines={2}>
                    {addr.fullAddress || `${addr.addressLine1}, ${addr.city}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Feather name="credit-card" size={16} color="#FC8019" />
            </View>
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'CASH_ON_DELIVERY' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('CASH_ON_DELIVERY')}
            activeOpacity={0.7}
          >
            <View style={[
              styles.radioOuter,
              paymentMethod === 'CASH_ON_DELIVERY' && styles.radioOuterActive,
            ]}>
              {paymentMethod === 'CASH_ON_DELIVERY' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>💵  Cash on Delivery</Text>
              <Text style={styles.paymentHint}>Pay when your order arrives</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Feather name="file-text" size={16} color="#FC8019" />
            </View>
            <Text style={styles.cardTitle}>Bill Summary</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items ({items.length})</Text>
            <Text style={styles.billValue}>₹{c.subtotal ?? c.total}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, !c.deliveryFee && { color: '#059669' }]}>
              {c.deliveryFee ? `₹${c.deliveryFee}` : 'FREE'}
            </Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{c.total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>₹{c.total}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, isPlacing && styles.placeOrderButtonDisabled]}
          onPress={() => createOrderMutation.mutate()}
          disabled={isPlacing || !selectedAddressId}
          activeOpacity={0.8}
        >
          {isPlacing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Feather name="check" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FC8019',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FC8019',
    borderRadius: 10,
    gap: 6,
  },
  addAddressText: {
    fontSize: 14,
    color: '#FC8019',
    fontWeight: '600',
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  addressOptionSelected: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  radioOuterActive: {
    borderColor: '#FC8019',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FC8019',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  defaultBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  addressLine: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 3,
    lineHeight: 18,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
  },
  paymentOptionSelected: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  paymentHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FC8019',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    flex: 1.5,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
