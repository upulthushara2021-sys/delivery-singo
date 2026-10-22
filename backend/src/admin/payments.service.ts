import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: '2026-01-28.clover',
  });

  async createPaymentIntent(amount: number) {
    return this.stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
    });
  }
}
