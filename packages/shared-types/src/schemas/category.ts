import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  parentId: z.string().cuid().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  id: z.string().cuid(),
});

export const CategoryListQuerySchema = z.object({
  includeInactive: z.coerce.boolean().default(false),
  parentId: z.string().cuid().optional().nullable(),
  flat: z.coerce.boolean().default(false),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CategoryListQuery = z.infer<typeof CategoryListQuerySchema>;

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
  children?: CategoryResponse[];
  createdAt: string;
  updatedAt: string;
}
