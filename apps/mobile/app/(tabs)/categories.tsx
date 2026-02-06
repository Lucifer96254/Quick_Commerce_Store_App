import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { categoriesApi, productsApi, cartApi } from '@/lib/api';

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

export default function CategoriesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const categoryList = (categories as any[]) || [];
  const activeSlug = selectedCategory || categoryList[0]?.slug;

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', activeSlug],
    queryFn: () => productsApi.list({ category: activeSlug }),
    enabled: !!activeSlug,
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId }: { productId: string }) => cartApi.addItem(productId, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const productList = (products as any)?.items || [];

  if (loadingCategories) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FC8019" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Left sidebar - Category list */}
      <ScrollView
        style={styles.sidebar}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sidebarContent}
      >
        {categoryList.map((category: any) => {
          const isActive = category.slug === activeSlug;
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryItem, isActive && styles.categoryItemActive]}
              onPress={() => setSelectedCategory(category.slug)}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <Text style={styles.categoryEmoji}>{getCategoryEmoji(category.slug)}</Text>
              <Text
                style={[
                  styles.categoryName,
                  isActive && styles.categoryNameActive,
                ]}
                numberOfLines={2}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Right - Products grid */}
      <View style={styles.productsSection}>
        <Text style={styles.productsTitle}>
          {categoryList.find((c: any) => c.slug === activeSlug)?.name || 'Products'}
        </Text>

        {loadingProducts ? (
          <View style={styles.productsLoading}>
            <ActivityIndicator size="small" color="#FC8019" />
          </View>
        ) : productList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try another category</Text>
          </View>
        ) : (
          <FlatList
            data={productList}
            numColumns={2}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
            columnWrapperStyle={styles.productRow}
            renderItem={({ item }) => {
              const hasDiscount = !!item.discountedPrice;
              const price = hasDiscount ? item.discountedPrice : item.price;
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
                        <Text style={{ fontSize: 32 }}>📦</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.productUnit}>{item.unit}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>₹{price}</Text>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => addToCartMutation.mutate({ productId: item.id })}
                      >
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Sidebar
  sidebar: {
    width: 90,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
  },
  sidebarContent: {
    paddingVertical: 8,
  },
  categoryItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    position: 'relative',
  },
  categoryItemActive: {
    backgroundColor: '#FFF7ED',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#FC8019',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 13,
  },
  categoryNameActive: {
    color: '#FC8019',
    fontWeight: '700',
  },
  // Products
  productsSection: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  productsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    paddingBottom: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  productImageContainer: {
    width: '100%',
    height: 90,
    backgroundColor: '#f9fafb',
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
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 15,
    marginBottom: 2,
  },
  productUnit: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1f2937',
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: '#FC8019',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#FC8019',
    fontWeight: '700',
    fontSize: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
});
