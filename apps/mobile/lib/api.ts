import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An error occurred',
      data.error?.details,
    );
  }

  return data.data;
}

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token: providedToken, ...fetchOptions } = options;

  // Get token from secure store if not provided
  let token = providedToken;
  if (!token) {
    token = await SecureStore.getItemAsync('accessToken') || undefined;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  return handleResponse<T>(response);
}

// Auth helpers
export const authStorage = {
  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
  },

  async getAccessToken() {
    return SecureStore.getItemAsync('accessToken');
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync('refreshToken');
  },

  async clearTokens() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },
};

// Auth API
export const authApi = {
  login: (data: { email?: string; phone?: string; password: string }) =>
    api<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: {
    email?: string;
    phone?: string;
    password: string;
    firstName: string;
    lastName: string;
  }) =>
    api<any>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => api<any>('/api/v1/auth/me'),

  logout: (refreshToken?: string) =>
    api<any>('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// Products API
export const productsApi = {
  list: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return api<any>(`/api/v1/products?${searchParams}`);
  },

  getBySlug: (slug: string) => api<any>(`/api/v1/products/slug/${slug}`),

  getFeatured: () => api<any>('/api/v1/products/featured'),
};

// Categories API
export const categoriesApi = {
  list: () => api<any>('/api/v1/categories'),
};

// Cart API
export const cartApi = {
  get: () => api<any>('/api/v1/cart'),

  addItem: (productId: string, quantity: number) =>
    api<any>('/api/v1/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),

  updateItem: (productId: string, quantity: number) =>
    api<any>(`/api/v1/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (productId: string) =>
    api<any>(`/api/v1/cart/items/${productId}`, {
      method: 'DELETE',
    }),

  clear: () =>
    api<any>('/api/v1/cart', {
      method: 'DELETE',
    }),
};

// Orders API
export const ordersApi = {
  create: (data: any) =>
    api<any>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return api<any>(`/api/v1/orders?${searchParams}`);
  },

  getById: (id: string) => api<any>(`/api/v1/orders/${id}`),

  cancel: (id: string, reason: string) =>
    api<any>(`/api/v1/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// Addresses API
export const addressesApi = {
  list: () => api<any>('/api/v1/addresses'),

  create: (data: any) =>
    api<any>('/api/v1/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    api<any>(`/api/v1/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    api<any>(`/api/v1/addresses/${id}`, {
      method: 'DELETE',
    }),
};
