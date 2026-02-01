'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { adminApi } from '@/lib/api';
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils';

interface DashboardStats {
  today: { orders: number; revenue: number; newCustomers: number };
  week: { orders: number; revenue: number; avgOrderValue: number };
  month: { orders: number; revenue: number; avgOrderValue: number };
  ordersByStatus: Record<string, number>;
  topProducts: Array<{ id: string; name: string; totalSold: number; revenue: number }>;
  lowStockProducts: Array<{ id: string; name: string; stockQuantity: number; lowStockThreshold: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      adminApi
        .getDashboard(accessToken)
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="h-4 w-4" /> +12%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatPrice(stats.today.revenue)}
          </p>
          <p className="text-sm text-gray-600">Today's Revenue</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="h-4 w-4" /> +8%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{stats.today.orders}</p>
          <p className="text-sm text-gray-600">Today's Orders</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Users className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="h-4 w-4" /> +5%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{stats.today.newCustomers}</p>
          <p className="text-sm text-gray-600">New Customers</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Package className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-red-600">
              <TrendingDown className="h-4 w-4" /> -2%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatPrice(stats.week.avgOrderValue)}
          </p>
          <p className="text-sm text-gray-600">Avg Order Value</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatPrice(order.total)}</p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Orders by Status</h2>
          <div className="space-y-3">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(status)}`}
                  >
                    {status}
                  </span>
                </div>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            <Link href="/admin/products">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {stats.topProducts.slice(0, 5).map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="font-medium text-gray-900">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{product.totalSold} sold</p>
                  <p className="text-sm text-gray-600">{formatPrice(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-gray-600">All products are well stocked!</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3"
                >
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <div className="text-right">
                    <p className="font-medium text-orange-600">
                      {product.stockQuantity} left
                    </p>
                    <p className="text-xs text-gray-600">
                      Threshold: {product.lowStockThreshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
