import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketService {
  constructor(private readonly gateway: WebsocketGateway) {}

  notifyStockUpdate(data: {
    productId: string;
    productName: string;
    previousStock: number;
    newStock: number;
    isAvailable: boolean;
  }) {
    this.gateway.emitStockUpdate(data.productId, data);
  }

  notifyOrderStatusUpdate(
    userId: string,
    data: {
      orderId: string;
      orderNumber: string;
      previousStatus: string;
      newStatus: string;
      notes?: string;
    },
  ) {
    this.gateway.emitOrderStatusUpdate(userId, data);
  }

  notifyNewOrder(data: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    total: number;
    itemCount: number;
    paymentMethod: string;
  }) {
    this.gateway.emitNewOrder(data);
  }

  notifyProductUpdate(data: {
    productId: string;
    productName: string;
    action: 'CREATED' | 'UPDATED' | 'DELETED';
    changes?: Record<string, { old: any; new: any }>;
  }) {
    this.gateway.emitProductUpdate(data);
  }

  notifyStoreStatusUpdate(data: { isOpen: boolean; message?: string }) {
    this.gateway.emitStoreStatusUpdate(data);
  }
}
