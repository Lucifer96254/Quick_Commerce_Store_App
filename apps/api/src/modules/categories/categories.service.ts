import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CategoriesService {
  private readonly CACHE_KEY = 'categories:all';
  private readonly CACHE_TTL = 600; // 10 minutes

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(includeInactive = false) {
    // Check cache
    if (!includeInactive) {
      const cached = await this.redis.get<any[]>(this.CACHE_KEY);
      if (cached) return cached;
    }

    const categories = await this.db.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const formatted = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      parentId: cat.parentId,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      productCount: cat._count.products,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }));

    // Cache if not including inactive
    if (!includeInactive) {
      await this.redis.set(this.CACHE_KEY, formatted, this.CACHE_TTL);
    }

    return formatted;
  }

  async findById(id: string) {
    const category = await this.db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      productCount: category._count.products,
      children: category.children,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async findBySlug(slug: string) {
    const category = await this.db.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      productCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async create(input: {
    name: string;
    description?: string;
    image?: string;
    parentId?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const slug = this.slugify(input.name);

    const existing = await this.db.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.db.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        image: input.image,
        parentId: input.parentId,
        sortOrder: input.sortOrder || 0,
        isActive: input.isActive ?? true,
      },
    });

    // Invalidate cache
    await this.redis.del(this.CACHE_KEY);

    return category;
  }

  async update(id: string, input: Partial<{
    name: string;
    description: string;
    image: string;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
  }>) {
    const category = await this.db.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updateData: any = { ...input };

    if (input.name) {
      updateData.slug = this.slugify(input.name);
      
      const existing = await this.db.category.findFirst({
        where: { slug: updateData.slug, NOT: { id } },
      });

      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const updated = await this.db.category.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache
    await this.redis.del(this.CACHE_KEY);

    return updated;
  }

  async delete(id: string) {
    const category = await this.db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.products > 0) {
      throw new ConflictException('Cannot delete category with products');
    }

    if (category._count.children > 0) {
      throw new ConflictException('Cannot delete category with subcategories');
    }

    await this.db.category.delete({
      where: { id },
    });

    // Invalidate cache
    await this.redis.del(this.CACHE_KEY);

    return { message: 'Category deleted successfully' };
  }
}
