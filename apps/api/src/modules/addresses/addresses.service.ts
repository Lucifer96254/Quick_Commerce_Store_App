import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AddressesService {
  constructor(private readonly db: DatabaseService) {}

  async findByUser(userId: string) {
    return this.db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string, userId: string) {
    const address = await this.db.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async create(userId: string, input: {
    label?: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    // If setting as default, unset other defaults
    if (input.isDefault) {
      await this.db.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If first address, make it default
    const existingCount = await this.db.address.count({ where: { userId } });
    const isDefault = input.isDefault || existingCount === 0;

    return this.db.address.create({
      data: {
        userId,
        label: input.label,
        fullName: input.fullName,
        phone: input.phone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        landmark: input.landmark,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country || 'India',
        latitude: input.latitude,
        longitude: input.longitude,
        isDefault,
      },
    });
  }

  async update(id: string, userId: string, input: Partial<{
    label: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    landmark: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  }>) {
    const address = await this.db.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await this.db.address.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.db.address.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string, userId: string) {
    const address = await this.db.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Check if address is used in orders
    const orderCount = await this.db.order.count({
      where: { addressId: id },
    });

    if (orderCount > 0) {
      throw new ForbiddenException('Cannot delete address used in orders');
    }

    await this.db.address.delete({ where: { id } });

    // If deleted was default, make another one default
    if (address.isDefault) {
      const nextAddress = await this.db.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextAddress) {
        await this.db.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Address deleted successfully' };
  }

  async setDefault(id: string, userId: string) {
    const address = await this.db.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.db.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return this.db.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
