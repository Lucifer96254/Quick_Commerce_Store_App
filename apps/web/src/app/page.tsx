import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, MapPin, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/products/featured`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">QuickMart</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/products">
              <Button variant="ghost">Products</Button>
            </Link>
            <Link href="/cart">
              <Button variant="ghost">Cart</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
              <Clock className="h-4 w-4" />
              Delivery in 10-15 minutes
            </div>
            <h1 className="text-5xl font-bold leading-tight text-gray-900 lg:text-6xl">
              Fresh Groceries
              <br />
              <span className="text-primary">Delivered Fast</span>
            </h1>
            <p className="text-lg text-gray-600">
              Get your daily essentials delivered to your doorstep in minutes.
              Fresh produce, dairy, snacks, and more!
            </p>
            <div className="flex gap-4">
              <Link href="/products">
                <Button size="lg" className="gap-2">
                  Shop Now <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                <MapPin className="h-5 w-5" /> Set Location
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-green-100 to-green-200">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 p-8">
                  {['🍎', '🥛', '🍞', '🥬', '🧀', '🥚', '🍊', '🥕', '🍇'].map((emoji, i) => (
                    <div
                      key={i}
                      className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-4xl shadow-lg"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white">
                <Truck className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Express Delivery</h3>
              <p className="text-gray-600">
                Get your order delivered in as fast as 10 minutes
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500 text-white">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Wide Selection</h3>
              <p className="text-gray-600">
                Browse thousands of products from local stores
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500 text-white">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Fresh Guaranteed</h3>
              <p className="text-gray-600">
                Quality checked products, always fresh
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">Shop by Category</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
            {categories.slice(0, 8).map((category: any) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group rounded-2xl bg-white p-4 text-center shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-gray-100">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={100}
                      height={100}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">
                      🛒
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {category.productCount || 0} items
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products">
              <Button variant="ghost" className="gap-2">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {featuredProducts.slice(0, 10).map((product: any) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-gray-100">
                  {product.images?.[0]?.url ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      📦
                    </div>
                  )}
                  {product.discountedPrice && (
                    <div className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white">
                      {Math.round((1 - product.discountedPrice / product.price) * 100)}% OFF
                    </div>
                  )}
                </div>
                <h3 className="mb-1 line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-primary">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500">{product.unit}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    ₹{product.discountedPrice || product.price}
                  </span>
                  {product.discountedPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{product.price}
                    </span>
                  )}
                </div>
                <Button size="sm" className="mt-3 w-full">
                  Add to Cart
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">QuickMart</span>
              </div>
              <p className="text-sm text-gray-600">
                Your neighborhood quick-commerce store. Fresh groceries delivered in minutes!
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/products" className="hover:text-primary">Products</Link></li>
                <li><Link href="/categories" className="hover:text-primary">Categories</Link></li>
                <li><Link href="/orders" className="hover:text-primary">My Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/help" className="hover:text-primary">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-primary">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>support@quickmart.local</li>
                <li>+91 98765 43210</li>
                <li>Mumbai, India</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
            © 2026 QuickMart. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
