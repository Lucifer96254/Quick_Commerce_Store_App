import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../redis/redis.service';
import { LoggerService } from '../../common/services/logger.service';
import { Prisma } from '@quickmart/db';

interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number | null;
  categoryId: string;
  unit?: string;
  unitValue?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  images?: Array<{
    url: string;
    publicId?: string;
    altText?: string;
    isPrimary?: boolean;
  }>;
}

@Injectable()
export class ProductsService {
  private readonly CACHE_PREFIX = 'products:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    categorySlug?: string;
    minPrice?: number;
    maxPrice?: number;
    isAvailable?: boolean;
    isFeatured?: boolean;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      isAvailable,
      isFeatured,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    // Get category ID from slug if needed
    let resolvedCategoryId = categoryId;
    if (categorySlug && !categoryId) {
      const category = await this.db.category.findUnique({
        where: { slug: categorySlug },
      });
      resolvedCategoryId = category?.id;
    }

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(resolvedCategoryId && { categoryId: resolvedCategoryId }),
      ...(minPrice !== undefined && { price: { gte: new Prisma.Decimal(minPrice) } }),
      ...(maxPrice !== undefined && { price: { lte: new Prisma.Decimal(maxPrice) } }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(inStock && { stockQuantity: { gt: 0 } }),
    };

    const [items, total] = await Promise.all([
      this.db.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.db.product.count({ where }),
    ]);

    return {
      items: items.map(this.formatProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async findById(id: string) {
    // Check cache
    const cached = await this.redis.get<any>(`${this.CACHE_PREFIX}${id}`);
    if (cached) return cached;

    const product = await this.db.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const formatted = this.formatProduct(product);

    // Cache result
    await this.redis.set(`${this.CACHE_PREFIX}${id}`, formatted, this.CACHE_TTL);

    return formatted;
  }

  async findBySlug(slug: string) {
    const product = await this.db.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProduct(product);
  }

  async create(input: CreateProductInput, performedBy: string) {
    // Check SKU uniqueness
    const existingSku = await this.db.product.findUnique({
      where: { sku: input.sku },
    });
    if (existingSku) {
      throw new ConflictException('SKU already exists');
    }

    const slug = this.slugify(input.name);
    
    // Check slug uniqueness
    const existingSlug = await this.db.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException('Product with similar name already exists');
    }

    const product = await this.db.product.create({
      data: {
        sku: input.sku,
        name: input.name,
        slug,
        description: input.description,
        price: new Prisma.Decimal(input.price),
        discountedPrice: input.discountedPrice 
          ? new Prisma.Decimal(input.discountedPrice) 
          : null,
        categoryId: input.categoryId,
        unit: input.unit || 'piece',
        unitValue: new Prisma.Decimal(input.unitValue || 1),
        stockQuantity: input.stockQuantity || 0,
        lowStockThreshold: input.lowStockThreshold || 10,
        isAvailable: input.isAvailable ?? true,
        isFeatured: input.isFeatured ?? false,
        tags: input.tags || [],
        images: input.images ? {
          create: input.images.map((img, index) => ({
            url: img.url,
            publicId: img.publicId,
            altText: img.altText,
            sortOrder: index,
            isPrimary: img.isPrimary ?? index === 0,
          })),
        } : undefined,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Create inventory log
    if (input.stockQuantity && input.stockQuantity > 0) {
      await this.db.inventoryLog.create({
        data: {
          productId: product.id,
          action: 'STOCK_IN',
          quantity: input.stockQuantity,
          previousStock: 0,
          newStock: input.stockQuantity,
          notes: 'Initial stock',
          performedBy,
        },
      });
    }

    this.logger.audit('PRODUCT_CREATED', performedBy, { productId: product.id, sku: product.sku });

    return this.formatProduct(product);
  }

  async update(id: string, input: Partial<CreateProductInput>, performedBy: string) {
    const product = await this.db.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check SKU uniqueness if changing
    if (input.sku && input.sku !== product.sku) {
      const existingSku = await this.db.product.findFirst({
        where: { sku: input.sku, NOT: { id } },
      });
      if (existingSku) {
        throw new ConflictException('SKU already exists');
      }
    }

    const updateData: any = {
      ...(input.name && { name: input.name, slug: this.slugify(input.name) }),
      ...(input.sku && { sku: input.sku }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: new Prisma.Decimal(input.price) }),
      ...(input.discountedPrice !== undefined && { 
        discountedPrice: input.discountedPrice 
          ? new Prisma.Decimal(input.discountedPrice) 
          : null,
      }),
      ...(input.categoryId && { categoryId: input.categoryId }),
      ...(input.unit && { unit: input.unit }),
      ...(input.unitValue !== undefined && { unitValue: new Prisma.Decimal(input.unitValue) }),
      ...(input.lowStockThreshold !== undefined && { lowStockThreshold: input.lowStockThreshold }),
      ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
      ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
      ...(input.tags && { tags: input.tags }),
    };

    const updated = await this.db.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`${this.CACHE_PREFIX}${id}`);

    this.logger.audit('PRODUCT_UPDATED', performedBy, { productId: id });

    return this.formatProduct(updated);
  }

  async updateStock(
    id: string,
    quantity: number,
    action: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT',
    performedBy: string,
    notes?: string,
  ) {
    const product = await this.db.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const previousStock = product.stockQuantity;
    let newStock: number;

    switch (action) {
      case 'STOCK_IN':
        newStock = previousStock + Math.abs(quantity);
        break;
      case 'STOCK_OUT':
        newStock = Math.max(0, previousStock - Math.abs(quantity));
        break;
      case 'ADJUSTMENT':
        newStock = quantity;
        break;
    }

    await this.db.$transaction([
      this.db.product.update({
        where: { id },
        data: { stockQuantity: newStock },
      }),
      this.db.inventoryLog.create({
        data: {
          productId: id,
          action,
          quantity: Math.abs(quantity),
          previousStock,
          newStock,
          notes,
          performedBy,
        },
      }),
    ]);

    // Invalidate cache
    await this.redis.del(`${this.CACHE_PREFIX}${id}`);

    this.logger.audit('STOCK_UPDATED', performedBy, { 
      productId: id, 
      action, 
      previousStock, 
      newStock,
    });

    return { id, previousStock, newStock, action };
  }

  async delete(id: string, performedBy: string) {
    const product = await this.db.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.db.product.delete({
      where: { id },
    });

    // Invalidate cache
    await this.redis.del(`${this.CACHE_PREFIX}${id}`);

    this.logger.audit('PRODUCT_DELETED', performedBy, { productId: id, sku: product.sku });

    return { message: 'Product deleted successfully' };
  }

  async getFeatured(limit: number = 10) {
    const products = await this.db.product.findMany({
      where: {
        isFeatured: true,
        isAvailable: true,
        stockQuantity: { gt: 0 },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    });

    return products.map(this.formatProduct);
  }

  async getLowStock(threshold?: number) {
    const products = await this.db.product.findMany({
      where: {
        stockQuantity: {
          lte: this.db.product.fields.lowStockThreshold,
        },
      },
      orderBy: { stockQuantity: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return products.filter((p: { stockQuantity: number; lowStockThreshold: number }) => p.stockQuantity <= p.lowStockThreshold);
  }

  private formatProduct(product: any) {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      discountedPrice: product.discountedPrice ? Number(product.discountedPrice) : null,
      categoryId: product.categoryId,
      category: product.category,
      unit: product.unit,
      unitValue: Number(product.unitValue),
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      tags: product.tags,
      images: product.images?.map((img: any) => ({
        id: img.id,
        url: img.url,
        publicId: img.publicId,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })) || [],
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
