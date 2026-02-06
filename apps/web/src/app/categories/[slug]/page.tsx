'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Grid, List } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/ui/product-card';
import { ProductRowSkeleton } from '@/components/ui/skeleton-loader';
import { Button } from '@/components/ui/button';
import { categoriesApi, productsApi } from '@/lib/api';

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug as string;

  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug),
    enabled: !!slug,
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-category', slug],
    queryFn: () => productsApi.list({ categorySlug: slug, limit: 100 }),
    enabled: !!slug,
  });

  const products = (productsData as any)?.items || [];

  if (loadingCategory) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-1/3 rounded bg-gray-200" />
            <ProductRowSkeleton count={8} />
          </div>
        </main>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-700">Category not found</h2>
            <Link href="/categories" className="mt-4 inline-block">
              <Button>Browse Categories</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-swiggy-gray-800 md:text-3xl">
              {category.name}
            </h1>
            <p className="text-sm text-swiggy-gray-500">
              {products.length} product{products.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Category Banner */}
        {category.image && (
          <div className="relative mb-6 h-48 overflow-hidden rounded-2xl bg-gradient-to-r from-swiggy-orange to-orange-500 md:h-64">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-3xl font-extrabold text-white md:text-4xl">
                {category.name}
              </h2>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loadingProducts ? (
          <ProductRowSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-5xl mb-3">📦</div>
            <p className="font-semibold text-swiggy-gray-700">No products in this category</p>
            <Link href="/categories" className="mt-4">
              <Button variant="outline">Browse Other Categories</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
