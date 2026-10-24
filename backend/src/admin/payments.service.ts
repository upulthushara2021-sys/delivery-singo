import Stripe from 'stripe';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2026-01-28.clover',
      });
    }
  }

  async createPaymentIntent(amount: number) {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Payments are not configured yet.',
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
    });
  }
}