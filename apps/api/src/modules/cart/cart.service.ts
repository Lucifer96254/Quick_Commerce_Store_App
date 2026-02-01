import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CartService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getCart(userId: string) {
    let cart = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.db.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
    }

    return this.formatCart(cart);
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await this.db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isAvailable) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestException(`Only ${product.stockQuantity} items available`);
    }

    let cart = await this.db.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.db.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists
    const existingItem = await this.db.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stockQuantity) {
        throw new BadRequestException(`Only ${product.stockQuantity} items available`);
      }

      await this.db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.db.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartItem = await this.db.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: { product: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Item not in cart');
    }

    if (quantity === 0) {
      await this.db.cartItem.delete({
        where: { id: cartItem.id },
      });
    } else {
      if (quantity > cartItem.product.stockQuantity) {
        throw new BadRequestException(`Only ${cartItem.product.stockQuantity} items available`);
      }

      await this.db.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity },
      });
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.db.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.db.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.db.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.db.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return { items: [], itemCount: 0, subtotal: 0, deliveryFee: 0, discount: 0, total: 0 };
  }

  async syncCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
    let cart = await this.db.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.db.cart.create({
        data: { userId },
      });
    }

    // Clear existing items
    await this.db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Add new items
    for (const item of items) {
      const product = await this.db.product.findUnique({
        where: { id: item.productId },
      });

      if (product && product.isAvailable && product.stockQuantity >= item.quantity) {
        await this.db.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity: Math.min(item.quantity, product.stockQuantity),
          },
        });
      }
    }

    return this.getCart(userId);
  }

  private async formatCart(cart: any) {
    const storeConfig = await this.db.storeConfig.findFirst();
    
    let subtotal = 0;
    const items = cart.items.map((item: any) => {
      const price = item.product.discountedPrice 
        ? Number(item.product.discountedPrice)
        : Number(item.product.price);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: Number(item.product.price),
          discountedPrice: item.product.discountedPrice 
            ? Number(item.product.discountedPrice) 
            : null,
          unit: item.product.unit,
          stockQuantity: item.product.stockQuantity,
          isAvailable: item.product.isAvailable,
          images: item.product.images.map((img: any) => ({
            url: img.url,
            isPrimary: img.isPrimary,
          })),
        },
        itemTotal,
      };
    });

    const minOrderAmount = storeConfig ? Number(storeConfig.minOrderAmount) : 0;
    const freeDeliveryAbove = storeConfig?.freeDeliveryAbove 
      ? Number(storeConfig.freeDeliveryAbove) 
      : null;
    const deliveryFeeAmount = storeConfig ? Number(storeConfig.deliveryFee) : 0;

    const deliveryFee = freeDeliveryAbove && subtotal >= freeDeliveryAbove 
      ? 0 
      : deliveryFeeAmount;

    return {
      id: cart.id,
      items,
      itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      subtotal,
      deliveryFee,
      discount: 0,
      total: subtotal + deliveryFee,
    };
  }
}
