import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, cartApi, productsApi } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

// Skeleton placeholder
function Skeleton({ style }: { style: any }) {
  return <View style={[{ backgroundColor: '#f3f4f6', borderRadius: 12 }, style]} />;
}

// Product card component
function ProductCard({ product, onAddToCart, isAdding }: any) {
  const hasDiscount = !!product.discountedPrice;
  const price = hasDiscount ? product.discountedPrice : product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.discountedPrice / product.price) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/product/${product.slug}`)}
    >
      <View style={styles.productImageContainer}>
        {product.images?.[0]?.url ? (
          <Image
            source={{ uri: product.images[0].url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={{ fontSize: 40 }}>📦</Text>
          </View>
        )}
        {discountPct > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPct}% OFF</Text>
          </View>
        )}
        {product.stockQuantity === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productUnit}>{product.unit}</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>₹{price}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>₹{product.price}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.addButton,
              product.stockQuantity === 0 && styles.addButtonDisabled,
            ]}
            onPress={() => onAddToCart(product.id)}
            disabled={isAdding || product.stockQuantity === 0}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories, isLoading: loadingCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api('/api/v1/categories'),
  });

  const { data: featuredProducts, isLoading: loadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => api('/api/v1/products/featured'),
  });

  const { data: allProducts, isLoading: loadingAll, refetch: refetchAll } = useQuery({
    queryKey: ['products-home'],
    queryFn: () => productsApi.list({ limit: 20 }),
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchProducts(), refetchAll()]);
    setRefreshing(false);
  };

  const allItems = (allProducts as any)?.items || [];
  const bestSellers = allItems.slice(0, 6);
  const snacksDrinks = allItems.slice(6, 12);

  const categoryEmojis: Record<string, string> = {
    fruits: '🍎',
    vegetables: '🥬',
    dairy: '🥛',
    snacks: '🍿',
    beverages: '🥤',
    household: '🧹',
    personal: '🧴',
    bakery: '🍞',
    meat: '🥩',
    frozen: '🧊',
  };

  const getCategoryEmoji = (slug: string) => {
    for (const [key, emoji] of Object.entries(categoryEmojis)) {
      if (slug.toLowerCase().includes(key)) return emoji;
    }
    return '🛒';
  };

  return (
    <View style={styles.screen}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoBadge}>
            <Feather name="shopping-bag" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.brandName}>QuickMart</Text>
            <View style={styles.deliveryRow}>
              <Feather name="map-pin" size={12} color="#FC8019" />
              <Text style={styles.deliveryText}>Deliver to </Text>
              <Text style={styles.deliveryBold}>Home</Text>
              <Feather name="chevron-down" size={14} color="#6b7280" />
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/cart')}
        >
          <Feather name="shopping-cart" size={22} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FC8019" />
        }
      >
        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Feather name="search" size={18} color="#9ca3af" />
          <Text style={styles.searchText}>Search for groceries, snacks...</Text>
        </TouchableOpacity>

        {/* ETA Banner */}
        <View style={styles.etaBanner}>
          <View style={styles.etaContent}>
            <View style={styles.etaIconContainer}>
              <Feather name="zap" size={16} color="#FC8019" />
            </View>
            <View>
              <Text style={styles.etaTitle}>Delivery in 10–15 mins</Text>
              <Text style={styles.etaSubtitle}>
                Fresh groceries at your doorstep
              </Text>
            </View>
          </View>
        </View>

        {/* Promo Banners Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.promoBanners}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <View style={[styles.promoBanner, { backgroundColor: '#FC8019' }]}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTag}>⚡ FLASH SALE</Text>
              <Text style={styles.promoTitle}>Up to 50% off</Text>
              <Text style={styles.promoSubtitle}>On daily essentials</Text>
              <TouchableOpacity
                style={styles.promoButton}
                onPress={() => router.push('/products')}
              >
                <Text style={styles.promoButtonText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.promoEmoji}>🛒</Text>
          </View>
          <View style={[styles.promoBanner, { backgroundColor: '#7c3aed' }]}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTag}>🥬 FRESH PRODUCE</Text>
              <Text style={styles.promoTitle}>Farm Fresh</Text>
              <Text style={styles.promoSubtitle}>Straight from the farm</Text>
              <TouchableOpacity
                style={styles.promoButton}
                onPress={() => router.push('/products')}
              >
                <Text style={styles.promoButtonText}>Explore</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.promoEmoji}>🍎</Text>
          </View>
          <View style={[styles.promoBanner, { backgroundColor: '#059669' }]}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTag}>🆕 NEW USER</Text>
              <Text style={styles.promoTitle}>Free Delivery</Text>
              <Text style={styles.promoSubtitle}>On your first 3 orders</Text>
              <TouchableOpacity
                style={styles.promoButton}
                onPress={() => router.push('/products')}
              >
                <Text style={styles.promoButtonText}>Order Now</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.promoEmoji}>🚀</Text>
          </View>
        </ScrollView>

        {/* Shop by Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/categories')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="arrow-right" size={14} color="#FC8019" />
            </TouchableOpacity>
          </View>
          {loadingCategories ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} style={{ width: 72, height: 88, marginRight: 12 }} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(categories as any[])?.map((category: any) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/products',
                      params: { category: String(category.slug) },
                    } as any)
                  }
                >
                  <View style={styles.categoryIcon}>
                    <Text style={styles.categoryEmoji}>
                      {getCategoryEmoji(category.slug)}
                    </Text>
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Frequently Bought</Text>
            <TouchableOpacity
              onPress={() => router.push('/products')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="arrow-right" size={14} color="#FC8019" />
            </TouchableOpacity>
          </View>
          {loadingProducts ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} style={{ width: CARD_WIDTH, height: 220, marginRight: 12 }} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(featuredProducts as any[])?.map((product: any) => (
                <View key={product.id} style={{ width: CARD_WIDTH + 8, marginRight: 8 }}>
                  <ProductCard
                    product={product}
                    onAddToCart={(id: string) =>
                      addToCartMutation.mutate({ productId: id })
                    }
                    isAdding={addToCartMutation.isPending}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Best Sellers Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Sellers</Text>
            <TouchableOpacity
              onPress={() => router.push('/products')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="arrow-right" size={14} color="#FC8019" />
            </TouchableOpacity>
          </View>
          {loadingAll ? (
            <View style={styles.productsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} style={{ width: CARD_WIDTH, height: 220, marginBottom: 12 }} />
              ))}
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {bestSellers.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(id: string) =>
                    addToCartMutation.mutate({ productId: id })
                  }
                  isAdding={addToCartMutation.isPending}
                />
              ))}
            </View>
          )}
        </View>

        {/* Snacks & Drinks horizontal */}
        {snacksDrinks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Snacks & Drinks</Text>
              <TouchableOpacity
                onPress={() => router.push('/products')}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Feather name="arrow-right" size={14} color="#FC8019" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {snacksDrinks.map((product: any) => (
                <View key={product.id} style={{ width: CARD_WIDTH + 8, marginRight: 8 }}>
                  <ProductCard
                    product={product}
                    onAddToCart={(id: string) =>
                      addToCartMutation.mutate({ productId: id })
                    }
                    isAdding={addToCartMutation.isPending}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FC8019',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  deliveryText: {
    fontSize: 12,
    color: '#6b7280',
  },
  deliveryBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  searchText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  etaBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  etaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  etaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  etaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  etaSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  promoBanners: {
    marginTop: 16,
  },
  promoBanner: {
    width: SCREEN_WIDTH - 48,
    height: 150,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginRight: 12,
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
  },
  promoTag: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  promoSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  promoButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
  },
  promoEmoji: {
    fontSize: 56,
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: '#FC8019',
    fontWeight: '600',
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 14,
    width: 72,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // Product Card Styles
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
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
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
  priceContainer: {
    flexDirection: 'column',
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
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#FC8019',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addButtonDisabled: {
    borderColor: '#d1d5db',
  },
  addButtonText: {
    color: '#FC8019',
    fontWeight: '700',
    fontSize: 12,
  },
});
