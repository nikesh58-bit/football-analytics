import { Router } from 'express';
import { z } from 'zod';
import {
  stripe,
  isStripeConfigured,
  allowedPriceIds,
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
} from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { apiKeyAuth, optionalApiKey, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const checkoutSchema = z.object({
  priceId: z.string().regex(/^price_[A-Za-z0-9]+$/, 'priceId must be a Stripe price id'),
  email: z.string().email(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const VALID_SUBSCRIPTION_STATUSES = new Set([
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
]);

function requireStripe(res: any): boolean {
  if (!isStripeConfigured()) {
    res.status(503).json({ code: 'BILLING_DISABLED', message: 'Billing is not configured' });
    return false;
  }
  return true;
}

// Stripe redirects (success/cancel/portal return) must stay on the
// configured frontend origin. Arbitrary URLs enable open-redirect phishing.
function resolveRedirect(url: unknown, fallback: string): string {
  const base = process.env.FRONTEND_URL || 'http://localhost:3000';
  if (typeof url !== 'string' || url.length === 0) return fallback;
  try {
    const target = new URL(url, base);
    const allowed = new URL(base);
    if (target.origin !== allowed.origin) return fallback;
    return target.toString();
  } catch {
    return fallback;
  }
}

// Checkout + portal are authenticated: the Stripe customer is always bound to
// the caller's API key (metadata.userId = apiKey.id). We never trust an
// arbitrary customerId from the request body for a different user.
router.post('/checkout', apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireStripe(res)) return;
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid checkout payload',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const { priceId, email, successUrl, cancelUrl } = parsed.data;

    const allowlist = allowedPriceIds();
    if (allowlist.size > 0 && !allowlist.has(priceId)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Unknown priceId' });
    }

    const customer = await createCustomer(email);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await createCheckoutSession(
      customer.id,
      priceId,
      resolveRedirect(successUrl, `${frontend}/billing/success`),
      resolveRedirect(cancelUrl, `${frontend}/billing/cancel`),
      // Webhook links subscriptions via subscription.metadata.userId.
      // Customer metadata alone is NOT copied to subscriptions.
      { userId: req.apiKey!.id },
    );
    // Bind Stripe customer to API-key owner at checkout time via subscription
    // metadata update happens in the webhook; store intent here for audit.
    await stripe.customers.update(customer.id, {
      metadata: { userId: req.apiKey!.id },
    });
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create checkout session' });
  }
});

router.post('/portal', apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireStripe(res)) return;
    // Resolve the customer from subscriptions owned by this API key.
    // A caller-supplied customerId is only honored if it belongs to them.
    const requestedCustomerId =
      typeof req.body?.customerId === 'string' ? req.body.customerId : undefined;

    const owned = await prisma.subscription.findMany({
      where: { userId: req.apiKey!.id },
      select: { stripeCustomerId: true },
    });
    const ownedCustomerIds = new Set(owned.map((s) => s.stripeCustomerId));

    let customerId: string | undefined;
    if (requestedCustomerId) {
      if (!ownedCustomerIds.has(requestedCustomerId)) {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Customer does not belong to this API key' });
      }
      customerId = requestedCustomerId;
    } else {
      customerId = owned[0]?.stripeCustomerId;
    }

    if (!customerId) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'No billing customer found for this API key' });
    }

    const { returnUrl } = req.body || {};
    const session = await createPortalSession(
      customerId,
      resolveRedirect(returnUrl, `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings`),
    );
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create portal session' });
  }
});

router.post('/webhook', async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireStripe(res)) return;
    const signature = req.headers['stripe-signature'] as string | undefined;
    if (!signature) {
      return res.status(400).json({ code: 'WEBHOOK_ERROR', message: 'Missing stripe-signature header' });
    }
    const event = constructWebhookEvent(req.body, signature);
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;
        if (!userId || typeof userId !== 'string') {
          console.error('Webhook: subscription without metadata.userId, skipping', subscription.id);
          break;
        }
        const rawStatus = String(subscription.status || '').toUpperCase();
        if (!VALID_SUBSCRIPTION_STATUSES.has(rawStatus)) {
          console.error('Webhook: unknown subscription status', subscription.status);
          break;
        }
        const priceId = subscription.items?.data?.[0]?.price?.id;
        if (!priceId) {
          console.error('Webhook: subscription without price, skipping', subscription.id);
          break;
        }
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          create: {
            userId,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status: rawStatus as any,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          update: {
            status: rawStatus as any,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ code: 'WEBHOOK_ERROR', message: 'Webhook handling failed' });
  }
});

router.get('/prices', optionalApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireStripe(res)) return;
    const prices = await stripe.prices.list({ active: true, expand: ['data.product'] });
    res.json(
      prices.data.map((p) => ({
        id: p.id,
        product: p.product,
        unitAmount: p.unit_amount,
        currency: p.currency,
        recurring: p.recurring,
      })),
    );
  } catch (error) {
    console.error('Prices error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch prices' });
  }
});

export default router;
