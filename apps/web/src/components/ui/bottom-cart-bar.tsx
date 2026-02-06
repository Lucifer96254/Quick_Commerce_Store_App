'use client';

import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomCartBar() {
  const { items, itemCount, total } = useCartStore();
  const pathname = usePathname();

  // Hide on cart/checkout/admin/login pages
  const hiddenPaths = ['/cart', '/checkout', '/admin', '/login', '/register'];
  if (hiddenPaths.some((p) => pathname.startsWith(p))) return null;
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <Link href="/cart">
        <div className="mx-3 mb-3 flex items-center justify-between rounded-2xl bg-swiggy-orange px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShoppingBag className="h-5 w-5 text-white" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-swiggy-orange">
                {itemCount}
              </span>
            </div>
            <div className="text-white">
              <p className="text-xs font-medium opacity-90">{items.length} item{items.length > 1 ? 's' : ''}</p>
              <p className="text-sm font-bold">₹{total.toFixed(0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-white">
            View Cart
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </div>
  );
}
