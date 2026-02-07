import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List products with filters' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('isAvailable') isAvailable?: boolean,
    @Query('isFeatured') isFeatured?: boolean,
    @Query('inStock') inStock?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.productsService.findAll({
      page,
      limit,
      search,
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      isAvailable,
      isFeatured,
      inStock,
      sortBy,
      sortOrder,
    });
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured products' })
  async getFeatured(@Query('limit') limit?: string | number) {
    // Parse limit to number, default to undefined if invalid
    const parsedLimit =
      limit !== undefined && limit !== null && !isNaN(Number(limit))
        ? Number(limit)
        : undefined;
    return this.productsService.getFeatured(parsedLimit);
  }

  @Get('low-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get low stock products (Admin)' })
  async getLowStock() {
    return this.productsService.getLowStock();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get product by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (Admin)' })
  async create(
    @Body() body: {
      sku: string;
      name: string;
      description?: string;
      price: number;
      discountedPrice?: number;
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
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.create(body, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (Admin)' })
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.update(id, body, userId);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product stock (Admin)' })
  async updateStock(
    @Param('id') id: string,
    @Body() body: {
      quantity: number;
      action: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
      notes?: string;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.updateStock(
      id,
      body.quantity,
      body.action,
      userId,
      body.notes,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product (Admin)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.delete(id, userId);
  }
}
