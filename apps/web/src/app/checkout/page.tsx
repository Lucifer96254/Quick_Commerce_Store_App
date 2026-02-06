'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Truck, ChevronRight, Plus, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useCartStore, useAuthStore } from '@/lib/store';
import { addressesApi, ordersApi, cartApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, subtotal, deliveryFee, total, clearCart } = useCartStore();
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'RAZORPAY' | 'STRIPE'>('CASH_ON_DELIVERY');

  // Redirect if not authenticated (after hydration)
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Fetch addresses
  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list(accessToken!),
    enabled: !!accessToken,
  });

  const addrList = (addresses as any[]) || [];

  // Auto-select first/default address
  useEffect(() => {
    if (addrList.length > 0 && !selectedAddress) {
      const def = addrList.find((a: any) => a.isDefault);
      setSelectedAddress(def?.id || addrList[0].id);
    }
  }, [addrList, selectedAddress]);

  // Minimum order validation
  const MIN_ORDER_AMOUNT = 0; // Can be set to a minimum like 100
  const canPlaceOrder = items.length > 0 && selectedAddress && subtotal >= MIN_ORDER_AMOUNT;

  // Place order
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAddress) throw new Error('Please select a delivery address');
      if (items.length === 0) throw new Error('Cart is empty');
      if (subtotal < MIN_ORDER_AMOUNT) {
        throw new Error(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}`);
      }

      // Check for out of stock items
      const outOfStockItems = items.filter(
        (item) => item.quantity > item.product.stockQuantity,
      );
      if (outOfStockItems.length > 0) {
        throw new Error(
          `Some items are out of stock: ${outOfStockItems.map((i) => i.product.name).join(', ')}`,
        );
      }

      // Sync cart first if authenticated
      if (isAuthenticated && accessToken) {
        await cartApi.sync(
          accessToken,
          items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        );
      }

      return ordersApi.create(accessToken!, {
        addressId: selectedAddress,
        paymentMethod,
      });
    },
    onSuccess: (order: any) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Order placed successfully!' });
      router.push(`/payment-success?orderId=${order.id}&orderNumber=${order.orderNumber}`);
    },
    onError: (err: any) => {
      toast({
        title: 'Checkout failed',
        description: err?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  if (!_hasHydrated) return null;
  if (!isAuthenticated) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-5xl mb-3">🛒</div>
          <p className="font-bold text-swiggy-gray-700">Your cart is empty</p>
          <Link href="/products" className="mt-4">
            <Button className="bg-swiggy-orange hover:bg-swiggy-orange-dark">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-swiggy-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-4 md:py-6">
        <h1 className="mb-4 text-lg font-extrabold text-swiggy-gray-800 md:text-xl">Checkout</h1>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Left: Steps */}
          <div className="space-y-4">
            {/* Delivery Address */}
            <div className="rounded-xl bg-white p-4 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-swiggy-orange text-white">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-bold text-swiggy-gray-800">Delivery Address</h2>
              </div>

              {loadingAddresses ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="skeleton h-16 rounded-lg" />
                  ))}
                </div>
              ) : addrList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
                  <p className="text-sm text-swiggy-gray-500 mb-2">No addresses saved</p>
                  <Link href="/addresses">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add Address
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {addrList.map((addr: any) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors ${
                        selectedAddress === addr.id
                          ? 'border-swiggy-orange bg-swiggy-orange-light'
                          : 'border-transparent bg-swiggy-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="mt-1 accent-[#FC8019]"
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-swiggy-gray-800">
                            {addr.label || addr.type || 'Address'}
                          </span>
                          {addr.isDefault && (
                            <span className="rounded bg-swiggy-green/10 px-1.5 py-0.5 text-[10px] font-bold text-swiggy-green">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-swiggy-gray-500 leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          , {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                      </div>
                    </label>
                  ))}
                  <Link href="/addresses" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-swiggy-orange hover:underline">
                    <Plus className="h-3 w-3" /> Add new address
                  </Link>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="rounded-xl bg-white p-4 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-swiggy-orange text-white">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-bold text-swiggy-gray-800">Payment Method</h2>
              </div>

              <div className="space-y-2">
                {([
                  { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', desc: 'Pay when delivered', icon: '💵' },
                  { value: 'RAZORPAY', label: 'Razorpay', desc: 'UPI, Cards, NetBanking', icon: '💳' },
                ] as const).map((pm) => (
                  <label
                    key={pm.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                      paymentMethod === pm.value
                        ? 'border-swiggy-orange bg-swiggy-orange-light'
                        : 'border-transparent bg-swiggy-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      className="accent-[#FC8019]"
                      checked={paymentMethod === pm.value}
                      onChange={() => setPaymentMethod(pm.value)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-swiggy-gray-800">{pm.label}</span>
                      <p className="text-xs text-swiggy-gray-400">{pm.desc}</p>
                    </div>
                    <span className="text-xl">{pm.icon}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ETA */}
            <div className="flex items-center gap-3 rounded-xl bg-swiggy-orange-light p-3">
              <Truck className="h-5 w-5 text-swiggy-orange" />
              <div>
                <p className="text-sm font-semibold text-swiggy-gray-800">Express Delivery</p>
                <p className="text-xs text-swiggy-gray-500">Estimated delivery in 10–15 minutes</p>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:sticky lg:top-[80px] lg:self-start">
            <div className="rounded-xl bg-white p-4 shadow-card">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-swiggy-gray-500">
                Order Summary
              </h2>

              <div className="mb-3 max-h-52 space-y-2 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-2">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-swiggy-gray-50">
                      {item.product.images?.[0]?.url ? (
                        <Image src={item.product.images[0].url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-lg">📦</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-1 text-xs font-medium text-swiggy-gray-700">{item.product.name}</p>
                      <p className="text-[10px] text-swiggy-gray-400">×{item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-swiggy-gray-700">₹{item.itemTotal.toFixed(0)}</p>
                  </div>
                ))}
              </div>

              <hr className="border-dashed border-gray-200" />

              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-swiggy-gray-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-swiggy-gray-500">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-swiggy-green font-semibold' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <hr className="border-dashed border-gray-200" />
                <div className="flex justify-between text-base font-extrabold text-swiggy-gray-800">
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              {MIN_ORDER_AMOUNT > 0 && subtotal < MIN_ORDER_AMOUNT && (
                <div className="mb-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  Add ₹{(MIN_ORDER_AMOUNT - subtotal).toFixed(0)} more to place order
                </div>
              )}
              <Button
                onClick={() => placeOrderMutation.mutate()}
                disabled={placeOrderMutation.isPending || !canPlaceOrder}
                className="mt-4 w-full gap-2 bg-swiggy-orange text-white hover:bg-swiggy-orange-dark disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {placeOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                <ChevronRight className="h-4 w-4" />
              </Button>

              <p className="mt-2 text-center text-[10px] text-swiggy-gray-400">
                By placing this order, you agree to our Terms & Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
