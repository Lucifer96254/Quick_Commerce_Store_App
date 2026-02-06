import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, cartApi } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function ProductsScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', params.category],
    queryFn: () =>
      productsApi.list(
        params.category ? { category: params.category as string } : undefined,
      ),
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId }: { productId: string }) => cartApi.addItem(productId, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => {
      if (err?.statusCode === 401) {
        Alert.alert('Login Required', 'Please login to add items to cart.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') },
        ]);
      } else {
        Alert.alert('Error', err?.message || 'Failed to add to cart');
      }
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC8019" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Feather name="alert-circle" size={32} color="#d1d5db" />
        </View>
        <Text style={styles.errorText}>Failed to load products</Text>
      </View>
    );
  }

  const items = (data as any)?.items || (data as any[]) || [];

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>📦</Text>
        <Text style={styles.emptyTitle}>No products found</Text>
        <Text style={styles.emptySubtitle}>Try a different category</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => {
          const hasDiscount = !!item.discountedPrice;
          const price = hasDiscount ? item.discountedPrice : item.price;
          const discountPct = hasDiscount
            ? Math.round((1 - item.discountedPrice / item.price) * 100)
            : 0;

          return (
            <TouchableOpacity
              style={styles.productCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/product/${item.slug}`)}
            >
              <View style={styles.productImageContainer}>
                {item.images?.[0]?.url ? (
                  <Image
                    source={{ uri: item.images[0].url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Text style={{ fontSize: 36 }}>📦</Text>
                  </View>
                )}
                {discountPct > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{discountPct}% OFF</Text>
                  </View>
                )}
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productUnit}>{item.unit}</Text>
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.productPrice}>₹{price}</Text>
                    {hasDiscount && (
                      <Text style={styles.originalPrice}>₹{item.price}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() =>
                      addToCartMutation.mutate({ productId: item.id })
                    }
                    disabled={addToCartMutation.isPending || item.stockQuantity === 0}
                  >
                    <Text style={styles.addButtonText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  productImageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.85,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#1e40af',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
    lineHeight: 18,
  },
  productUnit: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
  },
  originalPrice: {
    fontSize: 11,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: '#FC8019',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FC8019',
    fontWeight: '700',
    fontSize: 12,
  },
});
