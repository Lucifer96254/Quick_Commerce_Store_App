import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, cartApi } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: () => productsApi.getBySlug(slug!),
  });

  const addToCartMutation = useMutation({
    mutationFn: (qty: number) =>
      cartApi.addItem((product as any).id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      Alert.alert('Added to cart! 🎉', 'Product has been added to your cart.');
    },
    onError: (err: any) => {
      if (err?.statusCode === 401) {
        Alert.alert('Login Required', 'Please login to add items to cart.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') },
        ]);
      } else {
        Alert.alert('Error', err?.message || 'Failed to add to cart.');
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

  if (error || !product) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Feather name="alert-circle" size={32} color="#d1d5db" />
        </View>
        <Text style={styles.errorText}>Failed to load product</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const p: any = product;
  const imageUrl = p.images?.[0]?.url;
  const hasDiscount = !!p.discountedPrice;
  const price = hasDiscount ? p.discountedPrice : p.price;
  const discountPct = hasDiscount
    ? Math.round((1 - p.discountedPrice / p.price) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 64 }}>📦</Text>
            </View>
          )}
          {discountPct > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPct}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.content}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.unit}>{p.unit}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>₹{p.price}</Text>
            )}
            {hasDiscount && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save ₹{p.price - p.discountedPrice}</Text>
              </View>
            )}
          </View>

          {/* Stock */}
          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: p.stockQuantity > 0 ? '#22c55e' : '#ef4444' },
              ]}
            />
            <Text style={styles.stockText}>
              {p.stockQuantity > 0
                ? `In Stock (${p.stockQuantity} available)`
                : 'Out of Stock'}
            </Text>
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Feather name="minus" size={16} color={quantity <= 1 ? '#d1d5db' : '#FC8019'} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setQuantity(Math.min(p.stockQuantity, quantity + 1))}
                disabled={quantity >= p.stockQuantity}
              >
                <Feather
                  name="plus"
                  size={16}
                  color={quantity >= p.stockQuantity ? '#d1d5db' : '#FC8019'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="truck" size={16} color="#FC8019" />
              </View>
              <Text style={styles.featureText}>Free Delivery</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="shield" size={16} color="#FC8019" />
              </View>
              <Text style={styles.featureText}>Quality Assured</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="rotate-ccw" size={16} color="#FC8019" />
              </View>
              <Text style={styles.featureText}>Easy Returns</Text>
            </View>
          </View>

          {/* Description */}
          {p.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{p.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceValue}>₹{price * quantity}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (p.stockQuantity === 0 || addToCartMutation.isPending) &&
              styles.addToCartButtonDisabled,
          ]}
          onPress={() => addToCartMutation.mutate(quantity)}
          disabled={p.stockQuantity === 0 || addToCartMutation.isPending}
          activeOpacity={0.8}
        >
          {addToCartMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="shopping-cart" size={18} color="#fff" />
              <Text style={styles.addToCartText}>
                {p.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Text>
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
    backgroundColor: '#fff',
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
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    backgroundColor: '#f9fafb',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#1e40af',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  saveBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 13,
    color: '#4b5563',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FC8019',
    borderRadius: 10,
    overflow: 'hidden',
  },
  qtyButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    width: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    backgroundColor: '#FFF7ED',
    lineHeight: 36,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  descriptionSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  footerPriceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
  },
  addToCartButton: {
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
  addToCartButtonDisabled: {
    opacity: 0.5,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
