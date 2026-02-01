import { z } from 'zod';

export const OrderStatus = z.enum([
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

export const PaymentMethod = z.enum([
  'CASH_ON_DELIVERY',
  'STRIPE',
  'RAZORPAY',
]);

export const CreateOrderSchema = z.object({
  addressId: z.string().cuid(),
  paymentMethod: PaymentMethod,
  notes: z.string().max(500).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatus,
  notes: z.string().max(500).optional(),
});

export const CancelOrderSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const OrderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: OrderStatus.optional(),
  paymentMethod: PaymentMethod.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'total', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const AdminOrderListQuerySchema = OrderListQuerySchema.extend({
  userId: z.string().cuid().optional(),
  search: z.string().optional(), // Order number or customer name
});

export type OrderStatusType = z.infer<typeof OrderStatus>;
export type PaymentMethodType = z.infer<typeof PaymentMethod>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;
export type AdminOrderListQuery = z.infer<typeof AdminOrderListQuerySchema>;

export interface OrderItemResponse {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountedPrice: number | null;
  total: number;
  productSnapshot: {
    name: string;
    slug: string;
    sku: string;
    unit: string;
    image: string | null;
  };
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatusType;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethodType;
  notes: string | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  deliveryAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItemResponse[];
  payment?: {
    id: string;
    status: string;
    method: string;
    paidAt: string | null;
  };
  statusHistory: Array<{
    status: OrderStatusType;
    notes: string | null;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersByStatus: Record<OrderStatusType, number>;
}
