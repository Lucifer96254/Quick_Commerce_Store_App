'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, Zap, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/ui/product-card';
import { CategoryPill } from '@/components/ui/category-pill';
import { SectionHeader } from '@/components/ui/section-header';
import { HorizontalScroller } from '@/components/ui/horizontal-scroller';
import { ProductRowSkeleton, CategoryPillSkeleton, BannerSkeleton } from '@/components/ui/skeleton-loader';
import { productsApi, categoriesApi } from '@/lib/api';

const PROMO_BANNERS = [
  { id: 1, title: 'Fresh Fruits & Veggies', subtitle: 'Up to 30% off', bg: 'from-green-400 to-emerald-500', emoji: '🥬' },
  { id: 2, title: 'Dairy & Bread', subtitle: 'Starting ₹19', bg: 'from-yellow-400 to-orange-400', emoji: '🥛' },
  { id: 3, title: 'Munchies & Snacks', subtitle: 'Buy 2 Get 1 Free', bg: 'from-red-400 to-pink-500', emoji: '🍿' },
  { id: 4, title: 'Cold Drinks & Juices', subtitle: 'Chilled & Fresh', bg: 'from-blue-400 to-cyan-500', emoji: '🧃' },
  { id: 5, title: 'Household Essentials', subtitle: 'Weekly Deals', bg: 'from-purple-400 to-violet-500', emoji: '🧹' },
];

export default function HomePage() {
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products-featured'],
    queryFn: () => productsApi.getFeatured(),
  });

  const { data: allProducts, isLoading: loadingAll } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productsApi.list({ limit: 30 }),
  });

  const catList = (categories as any[]) || [];
  const featured = (featuredProducts as any[]) || [];
  const allItems = (allProducts as any)?.items || [];

  // Simulate sections from all products
  const bestSellers = allItems.slice(0, 10);
  const recentProducts = allItems.slice(5, 15);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ETA Strip */}
      <div className="border-b border-gray-50 bg-white">
        <div className="container mx-auto flex items-center gap-6 px-4 py-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-swiggy-gray-700">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-swiggy-green">
              <Zap className="h-3 w-3 text-white" />
            </div>
            Delivery in <span className="text-swiggy-green">10–15 min</span>
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-swiggy-gray-400 md:flex">
            <Shield className="h-3.5 w-3.5" />
            Safe & hygienic packaging
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-swiggy-gray-400 md:flex">
            <Clock className="h-3.5 w-3.5" />
            Best prices guaranteed
          </div>
        </div>
      </div>

      <main className="pb-20 md:pb-8">
        {/* Promo Banners */}
        <section className="py-4">
          <div className="container mx-auto px-4">
            <HorizontalScroller>
              {PROMO_BANNERS.map((banner) => (
                <Link
                  key={banner.id}
                  href="/products"
                  className={`flex h-28 w-[260px] flex-shrink-0 items-center justify-between rounded-2xl bg-gradient-to-r ${banner.bg} p-5 text-white transition-transform hover:scale-[1.02] md:h-36 md:w-[320px]`}
                >
                  <div>
                    <p className="text-sm font-bold md:text-base">{banner.title}</p>
                    <p className="mt-0.5 text-xs opacity-90 md:text-sm">{banner.subtitle}</p>
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold opacity-90">
                      Order Now <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                  <span className="text-4xl md:text-5xl">{banner.emoji}</span>
                </Link>
              ))}
            </HorizontalScroller>
          </div>
        </section>

        {/* Shop by Category */}
        <section className="py-4">
          <div className="container mx-auto px-4">
            <SectionHeader title="Shop by Category" href="/categories" />
            {loadingCategories ? (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CategoryPillSkeleton key={i} />
                ))}
              </div>
            ) : (
              <HorizontalScroller>
                {catList.slice(0, 12).map((cat: any) => (
                  <CategoryPill key={cat.id} category={cat} />
                ))}
              </HorizontalScroller>
            )}
          </div>
        </section>

        <div className="container mx-auto px-4">
          <hr className="border-gray-100" />
        </div>

        {/* Featured Products */}
        <section className="py-4">
          <div className="container mx-auto px-4">
            <SectionHeader
              title="Featured Products"
              subtitle="Handpicked for you"
              href="/products"
            />
            {loadingFeatured ? (
              <ProductRowSkeleton count={6} />
            ) : featured.length === 0 ? (
              <p className="py-8 text-center text-sm text-swiggy-gray-400">No featured products yet</p>
            ) : (
              <HorizontalScroller>
                {featured.slice(0, 12).map((product: any) => (
                  <ProductCard key={product.id} product={product} compact />
                ))}
              </HorizontalScroller>
            )}
          </div>
        </section>

        <div className="container mx-auto px-4">
          <hr className="border-gray-100" />
        </div>

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <section className="py-4">
            <div className="container mx-auto px-4">
              <SectionHeader
                title="Best Sellers"
                subtitle="Most ordered around you"
                href="/products?sortBy=popularity"
              />
              <HorizontalScroller>
                {bestSellers.map((product: any) => (
                  <ProductCard key={product.id} product={product} compact />
                ))}
              </HorizontalScroller>
            </div>
          </section>
        )}

        <div className="container mx-auto px-4">
          <hr className="border-gray-100" />
        </div>

        {/* All Products Grid */}
        <section className="py-4">
          <div className="container mx-auto px-4">
            <SectionHeader
              title="All Products"
              subtitle="Browse our complete selection"
              href="/products"
            />
            {loadingAll ? (
              <ProductRowSkeleton count={5} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {allItems.slice(0, 18).map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recently Added */}
        {recentProducts.length > 0 && (
          <>
            <div className="container mx-auto px-4">
              <hr className="border-gray-100" />
            </div>
            <section className="py-4">
              <div className="container mx-auto px-4">
                <SectionHeader title="Recently Added" href="/products?sortBy=createdAt" />
                <HorizontalScroller>
                  {recentProducts.map((product: any) => (
                    <ProductCard key={`recent-${product.id}`} product={product} compact />
                  ))}
                </HorizontalScroller>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
