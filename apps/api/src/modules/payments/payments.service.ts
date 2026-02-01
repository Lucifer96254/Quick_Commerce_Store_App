import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { LoggerService } from '../../common/services/logger.service';
import { OrdersService } from '../orders/orders.service';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;
  private razorpay: any = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly ordersService: OrdersService,
  ) {
    // Initialize Stripe
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    }

    // Initialize Razorpay
    const razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const razorpaySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (razorpayKeyId && razorpaySecret) {
      this.razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpaySecret,
      });
    }
  }

  async initiatePayment(orderId: string, userId: string) {
    const order = await this.db.order.findFirst({
      where: { id: orderId, userId },
      include: { payment: true, user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.payment?.status === 'COMPLETED') {
      throw new BadRequestException('Payment already completed');
    }

    const amount = Number(order.total);
    const currency = 'INR';

    if (order.paymentMethod === 'STRIPE') {
      return this.initiateStripePayment(order, amount, currency);
    } else if (order.paymentMethod === 'RAZORPAY') {
      return this.initiateRazorpayPayment(order, amount, currency);
    }

    throw new BadRequestException('Invalid payment method');
  }

  private async initiateStripePayment(order: any, amount: number, currency: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency.toLowerCase(),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Update payment record
    await this.db.payment.update({
      where: { orderId: order.id },
      data: {
        gatewayOrderId: paymentIntent.id,
        status: 'PROCESSING',
      },
    });

    return {
      gatewayOrderId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      key: this.configService.get<string>('STRIPE_PUBLISHABLE_KEY'),
      orderId: order.id,
      customerEmail: order.user.email,
      customerPhone: order.user.phone,
      customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
    };
  }

  private async initiateRazorpayPayment(order: any, amount: number, currency: string) {
    if (!this.razorpay) {
      throw new BadRequestException('Razorpay not configured');
    }

    const razorpayOrder = await this.razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
      },
    });

    // Update payment record
    await this.db.payment.update({
      where: { orderId: order.id },
      data: {
        gatewayOrderId: razorpayOrder.id,
        status: 'PROCESSING',
      },
    });

    return {
      gatewayOrderId: razorpayOrder.id,
      amount,
      currency,
      key: this.configService.get<string>('RAZORPAY_KEY_ID'),
      orderId: order.id,
      customerEmail: order.user.email,
      customerPhone: order.user.phone,
      customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
    };
  }

  async verifyPayment(input: {
    orderId: string;
    gatewayPaymentId: string;
    gatewayOrderId: string;
    signature: string;
  }) {
    const payment = await this.db.payment.findFirst({
      where: { orderId: input.orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.order.paymentMethod === 'RAZORPAY') {
      return this.verifyRazorpayPayment(payment, input);
    } else if (payment.order.paymentMethod === 'STRIPE') {
      return this.verifyStripePayment(payment, input);
    }

    throw new BadRequestException('Invalid payment method');
  }

  private async verifyRazorpayPayment(payment: any, input: any) {
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) {
      throw new BadRequestException('Razorpay not configured');
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${input.gatewayOrderId}|${input.gatewayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== input.signature) {
      await this.db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: 'Signature verification failed',
        },
      });
      throw new BadRequestException('Payment verification failed');
    }

    // Payment verified
    await this.db.$transaction([
      this.db.payment.update({
        where: { id: payment.id },
        data: {
          gatewayPaymentId: input.gatewayPaymentId,
          gatewaySignature: input.signature,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      }),
      this.db.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
      }),
      this.db.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: 'CONFIRMED',
          notes: 'Payment verified',
        },
      }),
    ]);

    this.logger.audit('PAYMENT_COMPLETED', payment.order.userId, {
      orderId: payment.orderId,
      paymentId: input.gatewayPaymentId,
    });

    return { success: true, orderId: payment.orderId };
  }

  private async verifyStripePayment(payment: any, input: any) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    const paymentIntent = await this.stripe.paymentIntents.retrieve(input.gatewayPaymentId);

    if (paymentIntent.status !== 'succeeded') {
      await this.db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: `Payment status: ${paymentIntent.status}`,
        },
      });
      throw new BadRequestException('Payment not successful');
    }

    // Payment verified
    await this.db.$transaction([
      this.db.payment.update({
        where: { id: payment.id },
        data: {
          gatewayPaymentId: input.gatewayPaymentId,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      }),
      this.db.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
      }),
      this.db.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: 'CONFIRMED',
          notes: 'Payment verified',
        },
      }),
    ]);

    this.logger.audit('PAYMENT_COMPLETED', payment.order.userId, {
      orderId: payment.orderId,
      paymentId: input.gatewayPaymentId,
    });

    return { success: true, orderId: payment.orderId };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handleStripePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handleStripePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
    }

    return { received: true };
  }

  private async handleStripePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    const payment = await this.db.payment.findFirst({
      where: { orderId },
    });

    if (!payment || payment.status === 'COMPLETED') return;

    await this.db.$transaction([
      this.db.payment.update({
        where: { id: payment.id },
        data: {
          gatewayPaymentId: paymentIntent.id,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      }),
      this.db.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
      }),
      this.db.orderStatusHistory.create({
        data: {
          orderId,
          status: 'CONFIRMED',
          notes: 'Payment confirmed via webhook',
        },
      }),
    ]);
  }

  private async handleStripePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    const payment = await this.db.payment.findFirst({
      where: { orderId },
    });

    if (!payment) return;

    await this.db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    });
  }

  async handleRazorpayWebhook(payload: any, signature: string) {
    const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (generatedSignature !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const orderId = paymentEntity.notes?.orderId;
      if (orderId) {
        const payment = await this.db.payment.findFirst({
          where: { orderId },
        });

        if (payment && payment.status !== 'COMPLETED') {
          await this.db.$transaction([
            this.db.payment.update({
              where: { id: payment.id },
              data: {
                gatewayPaymentId: paymentEntity.id,
                status: 'COMPLETED',
                paidAt: new Date(),
              },
            }),
            this.db.order.update({
              where: { id: orderId },
              data: { status: 'CONFIRMED' },
            }),
            this.db.orderStatusHistory.create({
              data: {
                orderId,
                status: 'CONFIRMED',
                notes: 'Payment confirmed via webhook',
              },
            }),
          ]);
        }
      }
    }

    return { received: true };
  }

  async refund(orderId: string, amount?: number, reason?: string) {
    const payment = await this.db.payment.findFirst({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Payment not completed');
    }

    const refundAmount = amount || Number(payment.amount);

    if (payment.order.paymentMethod === 'STRIPE' && this.stripe) {
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.gatewayPaymentId!,
        amount: Math.round(refundAmount * 100),
        reason: 'requested_by_customer',
      });

      await this.db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundId: refund.id,
          refundAmount: refundAmount,
          refundedAt: new Date(),
        },
      });
    } else if (payment.order.paymentMethod === 'RAZORPAY' && this.razorpay) {
      const refund = await this.razorpay.payments.refund(payment.gatewayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { reason: reason || 'Customer request' },
      });

      await this.db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundId: refund.id,
          refundAmount: refundAmount,
          refundedAt: new Date(),
        },
      });
    }

    await this.ordersService.updateStatus(orderId, 'REFUNDED', reason || 'Refund processed');

    return { success: true, refundAmount };
  }
}
