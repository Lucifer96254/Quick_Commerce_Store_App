'use client';

import { Fragment, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore, useAuthStore } from '@/lib/store';
import { cartApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, subtotal, deliveryFee, total, itemCount, updateQuantity, removeItem, clearCart } = useCartStore();
  const { isAuthenticated, accessToken } = useAuthStore();

  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

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

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-swiggy-gray-700" />
            <h2 className="text-lg font-bold text-swiggy-gray-800">My Cart</h2>
            <span className="rounded-full bg-swiggy-orange-light px-2 py-0.5 text-xs font-bold text-swiggy-orange">
              {itemCount}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-swiggy-gray-500 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <div className="text-6xl">🛒</div>
            <p className="font-semibold text-swiggy-gray-700">Your cart is empty</p>
            <p className="text-sm text-swiggy-gray-400">Add items to start a cart</p>
            <Button onClick={onClose} className="mt-2">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 rounded-lg bg-swiggy-gray-50 p-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
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
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-swiggy-gray-800">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-swiggy-gray-400">{item.product.unit}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-swiggy-gray-800">
                        ₹{item.itemTotal.toFixed(0)}
                      </span>
                      {/* Stepper */}
                      <div className="flex items-center rounded-md bg-swiggy-orange text-white">
                        <button
                          onClick={() => handleUpdate(item.productId, item.quantity - 1)}
                          className="px-2 py-1 transition-opacity hover:opacity-80"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[20px] text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdate(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="px-2 py-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bill + CTA */}
        {items.length > 0 && (
          <div className="border-t bg-white p-4">
            <div className="mb-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-swiggy-gray-500">
                <span>Item total</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-swiggy-gray-500">
                <span>Delivery fee</span>
                <span className={deliveryFee === 0 ? 'text-swiggy-green font-medium' : ''}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1.5 text-base font-bold text-swiggy-gray-800">
                <span>Grand Total</span>
                <span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            <Link href={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'} onClick={onClose}>
              <Button className="w-full gap-2 bg-swiggy-orange text-white hover:bg-swiggy-orange-dark" size="lg">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Fragment>
  );
}
