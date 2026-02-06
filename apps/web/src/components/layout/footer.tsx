import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-swiggy-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-swiggy-orange">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-swiggy-gray-800">QuickMart</span>
            </div>
            <p className="text-sm leading-relaxed text-swiggy-gray-400">
              Your neighbourhood quick-commerce store. Fresh groceries and essentials delivered in minutes!
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-swiggy-gray-700">Shop</h4>
            <ul className="space-y-2 text-sm text-swiggy-gray-500">
              <li><Link href="/products" className="hover:text-swiggy-orange transition-colors">All Products</Link></li>
              <li><Link href="/categories" className="hover:text-swiggy-orange transition-colors">Categories</Link></li>
              <li><Link href="/orders" className="hover:text-swiggy-orange transition-colors">My Orders</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-swiggy-gray-700">Support</h4>
            <ul className="space-y-2 text-sm text-swiggy-gray-500">
              <li><Link href="/help" className="hover:text-swiggy-orange transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-swiggy-orange transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-swiggy-orange transition-colors">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-swiggy-gray-700">Contact</h4>
            <ul className="space-y-2 text-sm text-swiggy-gray-500">
              <li>support@quickmart.local</li>
              <li>+91 98765 43210</li>
              <li>Mumbai, India</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-swiggy-gray-400">
          © {new Date().getFullYear()} QuickMart. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
