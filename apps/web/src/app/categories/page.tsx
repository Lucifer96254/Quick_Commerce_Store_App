'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/ui/product-card';
import { ProductRowSkeleton } from '@/components/ui/skeleton-loader';
import { categoriesApi, productsApi } from '@/lib/api';

const CATEGORY_EMOJI: Record<string, string> = {
  fruits: '🍎', vegetables: '🥬', dairy: '🥛', bakery: '🍞', meat: '🥩',
  seafood: '🐟', snacks: '🍿', beverages: '🧃', 'personal-care': '🧴',
  household: '🧹', baby: '👶', frozen: '🧊', spices: '🌶️', rice: '🍚', atta: '🌾',
};

export default function CategoriesPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories, isLoading: loadingCat } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const catList = (categories as any[]) || [];

  // Auto-select first category
  useEffect(() => {
    if (catList.length > 0 && !activeCategory) {
      setActiveCategory(catList[0].slug);
    }
  }, [catList, activeCategory]);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-category', activeCategory],
    queryFn: () => productsApi.list({ categorySlug: activeCategory, limit: 40 }),
    enabled: !!activeCategory,
  });

  const productList = (products as any)?.items || [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto flex min-h-[calc(100vh-120px)]">
        {/* Left: Sticky category sidebar */}
        <aside className="sticky top-[72px] h-[calc(100vh-72px)] w-[100px] flex-shrink-0 overflow-y-auto border-r border-gray-100 bg-swiggy-gray-50 md:w-[140px]">
          {loadingCat ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-[72px] rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="py-1">
              {catList.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`flex w-full flex-col items-center gap-1 border-l-[3px] px-2 py-3 text-center transition-colors ${
                    activeCategory === cat.slug
                      ? 'border-swiggy-orange bg-white text-swiggy-orange'
                      : 'border-transparent text-swiggy-gray-500 hover:bg-white hover:text-swiggy-gray-700'
                  }`}
                >
                  {cat.image ? (
                    <div className="h-10 w-10 overflow-hidden rounded-lg md:h-12 md:w-12">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-xl md:text-2xl">
                      {CATEGORY_EMOJI[cat.slug] || '🛒'}
                    </span>
                  )}
                  <span className={`line-clamp-2 text-[10px] leading-tight md:text-xs ${
                    activeCategory === cat.slug ? 'font-bold' : 'font-medium'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Right: Product grid */}
        <main className="flex-1 px-3 py-4 md:px-6">
          {activeCategory && (
            <div className="mb-4">
              <h1 className="text-lg font-extrabold text-swiggy-gray-800 md:text-xl">
                {catList.find((c: any) => c.slug === activeCategory)?.name || 'Products'}
              </h1>
              <p className="text-xs text-swiggy-gray-400">
                {productList.length} product{productList.length !== 1 ? 's' : ''} available
              </p>
            </div>
          )}

          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col rounded-xl bg-white">
                  <div className="skeleton aspect-square rounded-t-xl" />
                  <div className="space-y-2 p-3">
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                    <div className="skeleton mt-2 h-7 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : productList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-5xl mb-3">📦</div>
              <p className="font-semibold text-swiggy-gray-700">No products in this category</p>
              <p className="text-sm text-swiggy-gray-400">Try selecting another category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {productList.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
