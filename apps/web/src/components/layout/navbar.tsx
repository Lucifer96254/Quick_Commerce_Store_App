'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ShoppingCart, User, Menu, X, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { CartDrawer } from '@/components/ui/cart-drawer';
import { useAuthStore, useCartStore } from '@/lib/store';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount, total } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        {/* Top bar */}
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4 md:h-16">
          {/* Logo + Location */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-swiggy-orange md:h-9 md:w-9">
                <ShoppingBag className="h-4 w-4 text-white md:h-5 md:w-5" />
              </div>
              <span className="hidden text-lg font-extrabold text-swiggy-gray-800 md:inline">
                QuickMart
              </span>
            </Link>

            {/* Location pill */}
            <button className="hidden items-center gap-1 rounded-lg px-2 py-1 text-left transition-colors hover:bg-swiggy-gray-50 md:flex">
              <MapPin className="h-4 w-4 text-swiggy-orange" />
              <div className="max-w-[180px]">
                <p className="truncate text-xs font-bold text-swiggy-gray-800">Home</p>
                <p className="truncate text-[11px] text-swiggy-gray-400">
                  Mumbai, Maharashtra
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-swiggy-orange" />
            </button>
          </div>

          {/* Search - Desktop */}
          <div className="hidden max-w-md flex-1 md:block">
            <SearchBar />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Desktop nav links */}
            <div className="hidden items-center gap-1 md:flex">
              {isAuthenticated ? (
                <>
                  <Link href="/orders">
                    <Button variant="ghost" size="sm" className="text-swiggy-gray-600 hover:text-swiggy-gray-800">
                      Orders
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-swiggy-gray-600 hover:text-swiggy-gray-800">
                      <User className="h-4 w-4" />
                      {user?.firstName || 'Profile'}
                    </Button>
                  </Link>
                  {user?.role !== 'CUSTOMER' && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm" className="text-xs">
                        Admin
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="font-semibold text-swiggy-gray-700">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-swiggy-orange font-semibold text-white hover:bg-swiggy-orange-dark">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Cart button - Desktop */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative hidden items-center gap-2 rounded-xl bg-swiggy-orange px-4 py-2 font-bold text-white transition-colors hover:bg-swiggy-orange-dark md:flex"
            >
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 ? (
                <span className="text-sm">{itemCount} items · ₹{total.toFixed(0)}</span>
              ) : (
                <span className="text-sm">Cart</span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="rounded-lg p-1.5 text-swiggy-gray-600 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search - Mobile */}
        <div className="border-t border-gray-50 px-4 py-2 md:hidden">
          <SearchBar />
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-full z-50 border-t bg-white shadow-lg md:hidden animate-fade-in">
            <div className="container mx-auto space-y-1 px-4 py-3">
              <Link
                href="/products"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-swiggy-gray-700 hover:bg-swiggy-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                All Products
              </Link>
              <Link
                href="/categories"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-swiggy-gray-700 hover:bg-swiggy-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                href="/orders"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-swiggy-gray-700 hover:bg-swiggy-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Orders
              </Link>
              <hr className="my-1" />
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-swiggy-gray-700 hover:bg-swiggy-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-swiggy-orange hover:bg-swiggy-orange-dark">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Cart Drawer */}
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
}
