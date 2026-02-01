import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Prisma } from '@quickmart/db';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's stats
    const [todayOrders, todayRevenue, todayNewCustomers] = await Promise.all([
      this.db.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.db.order.aggregate({
        where: { createdAt: { gte: todayStart }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      this.db.user.count({
        where: { createdAt: { gte: todayStart }, role: 'CUSTOMER' },
      }),
    ]);

    // Week's stats
    const [weekOrders, weekRevenue] = await Promise.all([
      this.db.order.count({
        where: { createdAt: { gte: weekStart } },
      }),
      this.db.order.aggregate({
        where: { createdAt: { gte: weekStart }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
    ]);

    // Month's stats
    const [monthOrders, monthRevenue] = await Promise.all([
      this.db.order.count({
        where: { createdAt: { gte: monthStart } },
      }),
      this.db.order.aggregate({
        where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
    ]);

    // Orders by status
    const ordersByStatus = await this.db.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Top products
    const topProducts = await this.db.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.db.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true },
        });
        return {
          id: item.productId,
          name: product?.name || 'Unknown',
          totalSold: item._sum.quantity || 0,
          revenue: Number(item._sum.total) || 0,
        };
      }),
    );

    // Low stock products
    const lowStockProducts = await this.db.product.findMany({
      where: {
        stockQuantity: { lte: this.db.product.fields.lowStockThreshold },
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        lowStockThreshold: true,
      },
      orderBy: { stockQuantity: 'asc' },
      take: 10,
    });

    // Recent orders
    const recentOrders = await this.db.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const weekRevenueNum = Number(weekRevenue._sum.total) || 0;
    const monthRevenueNum = Number(monthRevenue._sum.total) || 0;

    return {
      today: {
        orders: todayOrders,
        revenue: Number(todayRevenue._sum.total) || 0,
        newCustomers: todayNewCustomers,
      },
      week: {
        orders: weekOrders,
        revenue: weekRevenueNum,
        avgOrderValue: weekOrders > 0 ? weekRevenueNum / weekOrders : 0,
      },
      month: {
        orders: monthOrders,
        revenue: monthRevenueNum,
        avgOrderValue: monthOrders > 0 ? monthRevenueNum / monthOrders : 0,
      },
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map((s) => [s.status, s._count.status]),
      ),
      topProducts: topProductDetails.filter(p => p.totalSold > 0),
      lowStockProducts: lowStockProducts.filter(p => p.stockQuantity <= p.lowStockThreshold),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    };
  }

  async getStoreConfig() {
    const config = await this.db.storeConfig.findFirst();
    if (!config) {
      return null;
    }

    return {
      name: config.name,
      description: config.description,
      logo: config.logo,
      phone: config.phone,
      email: config.email,
      address: config.address,
      city: config.city,
      state: config.state,
      postalCode: config.postalCode,
      country: config.country,
      currency: config.currency,
      currencySymbol: config.currencySymbol,
      deliveryRadius: config.deliveryRadius,
      minOrderAmount: Number(config.minOrderAmount),
      deliveryFee: Number(config.deliveryFee),
      freeDeliveryAbove: config.freeDeliveryAbove ? Number(config.freeDeliveryAbove) : null,
      operatingHours: config.operatingHours,
      isOpen: config.isOpen,
      taxRate: Number(config.taxRate),
      taxInclusive: config.taxInclusive,
    };
  }

  async updateStoreConfig(input: Partial<{
    name: string;
    description: string;
    logo: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    deliveryRadius: number;
    minOrderAmount: number;
    deliveryFee: number;
    freeDeliveryAbove: number;
    operatingHours: any;
    isOpen: boolean;
    taxRate: number;
    taxInclusive: boolean;
  }>) {
    let config = await this.db.storeConfig.findFirst();

    const updateData: any = {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.logo !== undefined && { logo: input.logo }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.state !== undefined && { state: input.state }),
      ...(input.postalCode !== undefined && { postalCode: input.postalCode }),
      ...(input.country !== undefined && { country: input.country }),
      ...(input.deliveryRadius !== undefined && { deliveryRadius: input.deliveryRadius }),
      ...(input.minOrderAmount !== undefined && { minOrderAmount: new Prisma.Decimal(input.minOrderAmount) }),
      ...(input.deliveryFee !== undefined && { deliveryFee: new Prisma.Decimal(input.deliveryFee) }),
      ...(input.freeDeliveryAbove !== undefined && { 
        freeDeliveryAbove: input.freeDeliveryAbove ? new Prisma.Decimal(input.freeDeliveryAbove) : null,
      }),
      ...(input.operatingHours !== undefined && { operatingHours: input.operatingHours }),
      ...(input.isOpen !== undefined && { isOpen: input.isOpen }),
      ...(input.taxRate !== undefined && { taxRate: new Prisma.Decimal(input.taxRate) }),
      ...(input.taxInclusive !== undefined && { taxInclusive: input.taxInclusive }),
    };

    if (config) {
      return this.db.storeConfig.update({
        where: { id: config.id },
        data: updateData,
      });
    } else {
      return this.db.storeConfig.create({
        data: {
          name: input.name || 'QuickMart',
          ...updateData,
        },
      });
    }
  }

  async getSalesReport(startDate: Date, endDate: Date) {
    const orders = await this.db.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: { product: { select: { name: true, categoryId: true } } },
        },
      },
    });

    // Daily breakdown
    const dailyStats: Record<string, { orders: number; revenue: number }> = {};
    
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { orders: 0, revenue: 0 };
      }
      dailyStats[dateKey].orders++;
      dailyStats[dateKey].revenue += Number(order.total);
    }

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
        avgOrderValue: orders.length > 0 
          ? orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length 
          : 0,
      },
      dailyBreakdown: Object.entries(dailyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({ date, ...stats })),
    };
  }

  async getInventoryReport() {
    const products = await this.db.product.findMany({
      include: {
        category: { select: { name: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    const lowStock = products.filter(p => p.stockQuantity <= p.lowStockThreshold);
    const outOfStock = products.filter(p => p.stockQuantity === 0);
    const totalValue = products.reduce(
      (sum, p) => sum + p.stockQuantity * Number(p.price),
      0,
    );

    return {
      summary: {
        totalProducts: products.length,
        totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
      },
      lowStockProducts: lowStock.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
        totalSold: p._count.orderItems,
      })),
      outOfStockProducts: outOfStock.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
      })),
    };
  }
}
