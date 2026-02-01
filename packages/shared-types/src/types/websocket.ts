export type WebSocketEventType =
  | 'STOCK_UPDATE'
  | 'ORDER_STATUS_UPDATE'
  | 'NEW_ORDER'
  | 'PRODUCT_UPDATE'
  | 'STORE_STATUS_UPDATE';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}

export interface StockUpdatePayload {
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  isAvailable: boolean;
}

export interface OrderStatusUpdatePayload {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  notes?: string;
  updatedAt: string;
}

export interface NewOrderPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  total: number;
  itemCount: number;
  paymentMethod: string;
  createdAt: string;
}

export interface ProductUpdatePayload {
  productId: string;
  productName: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export interface StoreStatusUpdatePayload {
  isOpen: boolean;
  message?: string;
}

export interface WebSocketAuthPayload {
  token: string;
}

export interface WebSocketSubscription {
  channel: 'orders' | 'products' | 'stock' | 'store';
  userId?: string;
}
