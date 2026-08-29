import { Router } from 'express';
import { stripe, createCustomer, createCheckoutSession, createPortalSession, constructWebhookEvent } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { optionalApiKey, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(optionalApiKey);

router.post('/checkout', async (req: AuthenticatedRequest, res) => {
  try { const { priceId, successUrl, cancelUrl } = req.body; if (!priceId) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'priceId is required' }); const customer = await createCustomer(req.body.email || 'user@example.com'); const session = await createCheckoutSession(customer.id, priceId, successUrl || `${process.env.FRONTEND_URL}/billing/success`, cancelUrl || `${process.env.FRONTEND_URL}/billing/cancel`); res.json({ sessionId: session.id, url: session.url }); } catch (error) { console.error('Checkout error:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create checkout session' }); }
});

router.post('/portal', async (req: AuthenticatedRequest, res) => {
  try { const { customerId, returnUrl } = req.body; if (!customerId) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'customerId required' }); const session = await createPortalSession(customerId, returnUrl || `${process.env.FRONTEND_URL}/settings`); res.json({ url: session.url }); } catch (error) { console.error('Portal error:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create portal session' }); }
});

router.post('/webhook', async (req: AuthenticatedRequest, res) => {
  try { const signature = req.headers['stripe-signature'] as string; const event = constructWebhookEvent(req.body, signature); switch (event.type) { case 'customer.subscription.created': case 'customer.subscription.updated': case 'customer.subscription.deleted': { const subscription = event.data.object as any; await prisma.subscription.upsert({ where: { stripeSubscriptionId: subscription.id }, create: { userId: subscription.metadata?.userId || 'unknown', stripeCustomerId: subscription.customer as string, stripeSubscriptionId: subscription.id, stripePriceId: subscription.items.data[0]?.price.id, status: subscription.status.toUpperCase(), currentPeriodEnd: new Date(subscription.current_period_end * 1000), cancelAtPeriodEnd: subscription.cancel_at_period_end }, update: { status: subscription.status.toUpperCase(), currentPeriodEnd: new Date(subscription.current_period_end * 1000), cancelAtPeriodEnd: subscription.cancel_at_period_end } }); break; } } res.json({ received: true }); } catch (error) { console.error('Webhook error:', error); res.status(400).json({ code: 'WEBHOOK_ERROR', message: 'Webhook handling failed' }); }
});

router.get('/prices', async (req: AuthenticatedRequest, res) => {
  try { const prices = await stripe.prices.list({ active: true, expand: ['data.product'] }); res.json(prices.data.map(p => ({ id: p.id, product: p.product, unitAmount: p.unit_amount, currency: p.currency, recurring: p.recurring }))); } catch (error) { console.error('Prices error:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch prices' }); }
});

export default router;