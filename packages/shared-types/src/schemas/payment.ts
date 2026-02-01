import { z } from 'zod';

export const PaymentStatus = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
]);

export const InitiatePaymentSchema = z.object({
  orderId: z.string().cuid(),
});

export const VerifyPaymentSchema = z.object({
  orderId: z.string().cuid(),
  gatewayPaymentId: z.string(),
  gatewayOrderId: z.string(),
  signature: z.string(),
});

export const StripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});

export const RazorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.record(z.unknown()),
    }).optional(),
    order: z.object({
      entity: z.record(z.unknown()),
    }).optional(),
  }),
});

export const RefundSchema = z.object({
  orderId: z.string().cuid(),
  amount: z.number().positive().optional(), // Full refund if not specified
  reason: z.string().max(500).optional(),
});

export type PaymentStatusType = z.infer<typeof PaymentStatus>;
export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
export type RefundInput = z.infer<typeof RefundSchema>;

export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatusType;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  paidAt: string | null;
  refundId: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInitResponse {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  key: string; // Gateway public key
  orderId: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerName: string | null;
}
