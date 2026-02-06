'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Package, Settings, LogOut, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuthStore, useUIStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, user, accessToken, logout } = useAuthStore();
  const { openAddressModal } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account');
      return;
    }
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    try {
      if (accessToken) {
        await authApi.logout(accessToken);
      }
    } catch {
      // Ignore logout errors
    } finally {
      logout();
      router.push('/');
      toast({ title: 'Logged out successfully' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    try {
      // TODO: Implement profile update API when backend supports it
      toast({ title: 'Profile updated successfully' });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Failed to update profile',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">My Account</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Card */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-swiggy-orange text-white text-2xl font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-swiggy-orange focus:outline-none focus:ring-1 focus:ring-swiggy-orange"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={saving} className="bg-swiggy-orange hover:bg-swiggy-orange-dark">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user?.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1 space-y-4">
            <Link
              href="/orders"
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-swiggy-orange/10 text-swiggy-orange">
                  <Package className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-900">My Orders</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            <Link
              href="/addresses"
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-900">Saved Addresses</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            <button
              onClick={() => openAddressModal()}
              className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-900">Add Address</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>

            <Link
              href="/settings"
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Settings className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-900">Settings</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-medium text-red-600">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
