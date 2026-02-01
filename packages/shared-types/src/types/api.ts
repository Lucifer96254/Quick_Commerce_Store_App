export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    storage: 'connected' | 'disconnected';
  };
}

export interface DashboardStats {
  today: {
    orders: number;
    revenue: number;
    newCustomers: number;
  };
  week: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
  };
  month: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
  };
  ordersByStatus: Record<string, number>;
  topProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export interface StoreConfigResponse {
  name: string;
  description: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  currency: string;
  currencySymbol: string;
  deliveryRadius: number | null;
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryAbove: number | null;
  operatingHours: Record<string, { open: string; close: string }> | null;
  isOpen: boolean;
  taxRate: number;
  taxInclusive: boolean;
}
