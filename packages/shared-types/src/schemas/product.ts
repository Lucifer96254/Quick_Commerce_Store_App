import { z } from 'zod';

export const CreateProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  discountedPrice: z.number().positive().optional().nullable(),
  categoryId: z.string().cuid(),
  unit: z.string().default('piece'),
  unitValue: z.number().positive().default(1),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  images: z.array(z.object({
    url: z.string().url(),
    publicId: z.string().optional(),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().cuid(),
});

export const UpdateStockSchema = z.object({
  quantity: z.number().int(),
  action: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']),
  notes: z.string().optional(),
});

export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  categorySlug: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  isAvailable: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'name', 'price', 'stockQuantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type UpdateStockInput = z.infer<typeof UpdateStockSchema>;
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export interface ProductImage {
  id: string;
  url: string;
  publicId: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountedPrice: number | null;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  unit: string;
  unitValue: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  isFeatured: boolean;
  tags: string[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}
