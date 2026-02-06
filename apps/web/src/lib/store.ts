import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Auth Store ───────────────────────────────────────────────

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'quickmart-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// ─── Cart Store ───────────────────────────────────────────────

interface CartItem {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountedPrice: number | null;
    unit: string;
    stockQuantity: number;
    isAvailable: boolean;
    images: Array<{ url: string; isPrimary: boolean }>;
  };
  itemTotal: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isLoading: boolean;
  setCart: (cart: {
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    deliveryFee: number;
    total: number;
  }) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      itemCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      isLoading: false,
      setCart: (cart) =>
        set({
          items: cart.items,
          itemCount: cart.itemCount,
          subtotal: cart.subtotal,
          deliveryFee: cart.deliveryFee,
          total: cart.total,
        }),
      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === item.productId,
          );
          let newItems: CartItem[];

          if (existingIndex >= 0) {
            newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + item.quantity,
              itemTotal:
                (newItems[existingIndex].product.discountedPrice ||
                  newItems[existingIndex].product.price) *
                (newItems[existingIndex].quantity + item.quantity),
            };
          } else {
            newItems = [...state.items, item];
          }

          const subtotal = newItems.reduce((sum, i) => sum + i.itemTotal, 0);
          return {
            items: newItems,
            itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal,
            total: subtotal + state.deliveryFee,
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter((i) => i.productId !== productId);
            const subtotal = newItems.reduce((sum, i) => sum + i.itemTotal, 0);
            return {
              items: newItems,
              itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
              subtotal,
              total: subtotal + state.deliveryFee,
            };
          }

          const newItems = state.items.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity,
                  itemTotal:
                    (item.product.discountedPrice || item.product.price) * quantity,
                }
              : item,
          );

          const subtotal = newItems.reduce((sum, i) => sum + i.itemTotal, 0);
          return {
            items: newItems,
            itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal,
            total: subtotal + state.deliveryFee,
          };
        }),
      removeItem: (productId) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.productId !== productId);
          const subtotal = newItems.reduce((sum, i) => sum + i.itemTotal, 0);
          return {
            items: newItems,
            itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal,
            total: subtotal + state.deliveryFee,
          };
        }),
      clearCart: () =>
        set({
          items: [],
          itemCount: 0,
          subtotal: 0,
          total: 0,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'quickmart-cart',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
    },
  ),
);

// ─── Address Store ────────────────────────────────────────────

interface Address {
  id: string;
  label?: string;
  type: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
  isDefault: boolean;
  phone?: string;
  fullName?: string;
}

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  setAddresses: (addresses: Address[]) => void;
  addAddress: (address: Address) => void;
  updateAddress: (id: string, data: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setDefault: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAddressStore = create<AddressState>()((set) => ({
  addresses: [],
  isLoading: false,
  setAddresses: (addresses) => set({ addresses }),
  addAddress: (address) =>
    set((state) => {
      const newAddresses = address.isDefault
        ? state.addresses.map((a) => ({ ...a, isDefault: false }))
        : [...state.addresses];
      return { addresses: [...newAddresses, address] };
    }),
  updateAddress: (id, data) =>
    set((state) => ({
      addresses: state.addresses.map((a) =>
        a.id === id ? { ...a, ...data } : a,
      ),
    })),
  removeAddress: (id) =>
    set((state) => ({
      addresses: state.addresses.filter((a) => a.id !== id),
    })),
  setDefault: (id) =>
    set((state) => ({
      addresses: state.addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// ─── UI Store ─────────────────────────────────────────────────

interface UIState {
  isOnline: boolean;
  cartDrawerOpen: boolean;
  addressModalOpen: boolean;
  editingAddressId: string | null;
  searchOpen: boolean;
  setOnline: (online: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  openAddressModal: (addressId?: string) => void;
  closeAddressModal: () => void;
  setSearchOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isOnline: true,
  cartDrawerOpen: false,
  addressModalOpen: false,
  editingAddressId: null,
  searchOpen: false,
  setOnline: (online) => set({ isOnline: online }),
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  openAddressModal: (addressId) =>
    set({ addressModalOpen: true, editingAddressId: addressId || null }),
  closeAddressModal: () =>
    set({ addressModalOpen: false, editingAddressId: null }),
  setSearchOpen: (open) => set({ searchOpen: open }),
}));

// ─── Search Store ─────────────────────────────────────────────

interface SearchState {
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recentSearches: [],
      addRecentSearch: (term) =>
        set((state) => {
          const filtered = state.recentSearches.filter(
            (s) => s.toLowerCase() !== term.toLowerCase(),
          );
          return { recentSearches: [term, ...filtered].slice(0, 10) };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'quickmart-search',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
    },
  ),
);
