import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, cartApi } from '@/lib/api';

export default function CartScreen() {
  const queryClient = useQueryClient();

  const {
    data: cart,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      quantity > 0
        ? cartApi.updateItem(productId, quantity)
        : cartApi.removeItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to update cart.');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to clear cart.');
    },
  });

  const handleIncrement = (item: any) => {
    updateItemMutation.mutate({
      productId: item.product.id,
      quantity: item.quantity + 1,
    });
  };

  const handleDecrement = (item: any) => {
    updateItemMutation.mutate({
      productId: item.product.id,
      quantity: item.quantity - 1,
    });
  };

  const items = (cart as any)?.items || [];
  const subtotal = (cart as any)?.subtotal ?? (cart as any)?.total ?? 0;
  const deliveryFee = (cart as any)?.deliveryFee ?? 0;
  const total = (cart as any)?.total || 0;

  if (isLoading && !cart) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC8019" />
      </View>
    );
  }

  if (error) {
    const err = error as any;
    if (err instanceof ApiError && err.statusCode === 401) {
      return (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Feather name="lock" size={32} color="#d1d5db" />
          </View>
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptySubtitle}>Please login to view your cart</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load cart.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => queryClient.invalidateQueries({ queryKey: ['cart'] })}
        >
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Feather name="shopping-bag" size={48} color="#d1d5db" />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Browse products and add them to your cart
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.primaryButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemImageContainer}>
        {item.product?.images?.[0]?.url ? (
          <Image
            source={{ uri: item.product.images[0].url }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Text style={{ fontSize: 24 }}>📦</Text>
          </View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.itemUnit}>{item.product.unit}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => handleDecrement(item)}
          disabled={updateItemMutation.isPending}
        >
          <Feather
            name={item.quantity === 1 ? 'trash-2' : 'minus'}
            size={14}
            color={item.quantity === 1 ? '#ef4444' : '#FC8019'}
          />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => handleIncrement(item)}
          disabled={updateItemMutation.isPending}
        >
          <Feather name="plus" size={14} color="#FC8019" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.clearCartRow}
            onPress={() =>
              Alert.alert(
                'Clear cart',
                'Remove all items from cart?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => clearCartMutation.mutate(),
                  },
                ],
              )
            }
          >
            <Feather name="trash-2" size={14} color="#ef4444" />
            <Text style={styles.clearCartText}>Clear Cart</Text>
          </TouchableOpacity>
        }
      />

      {/* Sticky bottom */}
      <View style={styles.footer}>
        <View style={styles.billSection}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFee === 0 && { color: '#059669' }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push('/checkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
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
    width: 96,
    height: 96,
    borderRadius: 48,
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
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#FC8019',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  list: {
    padding: 16,
    paddingBottom: 220,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FC8019',
    borderRadius: 8,
    overflow: 'hidden',
  },
  qtyButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    width: 28,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    backgroundColor: '#FFF7ED',
  },
  clearCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginTop: 4,
  },
  clearCartText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  billSection: {
    marginBottom: 12,
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
    marginVertical: 6,
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
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FC8019',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
