import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
  typescript: true,
});

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || '';
  return key.startsWith('sk_live_') || key.startsWith('sk_test_');
}

export function allowedPriceIds(): Set<string> {
  const ids = [
    process.env.STRIPE_PRICE_PRO_MONTHLY,
    process.env.STRIPE_PRICE_PRO_YEARLY,
    process.env.STRIPE_PRICE_ENTERPRISE,
  ].filter((v): v is string => !!v && v.startsWith('price_'));
  return new Set(ids);
}

export const STRIPE_PRICES = {
  FREE: null,
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
} as const;

export async function createCustomer(email: string, name?: string) {
  return stripe.customers.create({ email, name });
}

export async function createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string, metadata?: Record<string, string>) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    ...(metadata ? { subscription_data: { metadata } } : {}),
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || ''
  );
}