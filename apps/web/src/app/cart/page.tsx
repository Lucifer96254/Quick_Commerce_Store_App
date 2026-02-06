'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useCartStore, useAuthStore } from '@/lib/store';
import { cartApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

export default function CartPage() {
  const { items, subtotal, deliveryFee, total, updateQuantity, removeItem, clearCart } = useCartStore();
  const { isAuthenticated, accessToken } = useAuthStore();

  const handleUpdate = async (productId: string, qty: number) => {
    if (qty <= 0) {
      if (isAuthenticated && accessToken) {
        try { await cartApi.removeItem(accessToken, productId); } catch {}
      }
      removeItem(productId);
    } else {
      if (isAuthenticated && accessToken) {
        try { await cartApi.updateItem(accessToken, productId, qty); } catch {}
      }
      updateQuantity(productId, qty);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-sm text-center">
            <div className="mb-4 text-6xl">🛒</div>
            <h1 className="mb-2 text-xl font-extrabold text-swiggy-gray-800">Your cart is empty</h1>
            <p className="mb-6 text-sm text-swiggy-gray-400">
              You can go to home page to view more restaurants
            </p>
            <Link href="/products">
              <Button className="gap-2 bg-swiggy-orange hover:bg-swiggy-orange-dark">
                <ShoppingBag className="h-4 w-4" />
                Browse Products
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-swiggy-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-4 md:py-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Cart Items */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-lg font-extrabold text-swiggy-gray-800">Cart ({items.length})</h1>
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-swiggy-orange hover:underline"
              >
                Clear cart
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 rounded-xl bg-white p-3 shadow-card"
                >
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-swiggy-gray-50"
                  >
                    {item.product.images?.[0]?.url ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">📦</div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="line-clamp-1 text-sm font-semibold text-swiggy-gray-800 hover:text-swiggy-orange"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-swiggy-gray-400">{item.product.unit}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Stepper */}
                      <div className="flex items-center rounded-md bg-swiggy-orange text-white">
                        <button
                          onClick={() => handleUpdate(item.productId, item.quantity - 1)}
                          className="px-2.5 py-1 transition-opacity hover:opacity-80"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[24px] text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdate(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="px-2.5 py-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-swiggy-gray-800">
                        ₹{item.itemTotal.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="lg:sticky lg:top-[80px] lg:self-start">
            <div className="rounded-xl bg-white p-4 shadow-card">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-swiggy-gray-500">
                Bill Details
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-swiggy-gray-600">
                  <span>Item Total</span>
                  <span>₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-swiggy-gray-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-swiggy-green font-semibold' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <hr className="border-dashed border-gray-200" />
                <div className="flex justify-between text-base font-extrabold text-swiggy-gray-800">
                  <span>To Pay</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Link href={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'}>
                  <Button className="w-full gap-2 bg-swiggy-orange text-white hover:bg-swiggy-orange-dark" size="lg">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" className="w-full text-swiggy-gray-600" size="sm">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {deliveryFee === 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-swiggy-orange-light px-3 py-2 text-xs text-swiggy-orange">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-medium">Free delivery on this order!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
