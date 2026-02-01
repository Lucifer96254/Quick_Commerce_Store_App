import { z } from 'zod';

export const AddToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
});

export const UpdateCartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(0), // 0 = remove
});

export const RemoveFromCartSchema = z.object({
  productId: z.string().cuid(),
});

export const SyncCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive(),
  })),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type RemoveFromCartInput = z.infer<typeof RemoveFromCartSchema>;
export type SyncCartInput = z.infer<typeof SyncCartSchema>;

export interface CartItemResponse {
  id: string;
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
    images: Array<{
      url: string;
      isPrimary: boolean;
    }>;
  };
  itemTotal: number;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}
