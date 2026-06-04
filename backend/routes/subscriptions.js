const { query } = require('../db');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

// Validation schemas
const createSubscriptionSchema = z.object({
  planType: z.enum(['basic', 'pro']),
  paymentMethod: z.string().optional(),
});

const router = require('express').Router();

/**
 * Get current subscription
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM projects WHERE user_id = $1) as project_count,
              (SELECT COUNT(*) FROM generations
               WHERE user_id = $1
               AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
               AND status = 'completed') as month_generations
       FROM subscriptions s
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        subscription: {
          planType: 'free',
          status: 'active',
          projectCount: 0,
          monthGenerations: 0,
          limits: {
            generationsPerMonth: 3,
            projectsLimit: 3,
            pngDpi: 72,
            transparentBg: false,
            svgExport: false,
            textPrompt: false,
          },
        },
      });
    }

    const subscription = result.rows[0];

    const planLimits = {
      free: {
        generationsPerMonth: 3,
        projectsLimit: 3,
        pngDpi: 72,
        transparentBg: false,
        svgExport: false,
        textPrompt: false,
      },
      basic: {
        generationsPerMonth: 30,
        projectsLimit: 50,
        pngDpi: 300,
        transparentBg: true,
        svgExport: true, // one-time purchase
        textPrompt: false,
      },
      pro: {
        generationsPerMonth: -1, // unlimited
        projectsLimit: -1, // unlimited
        pngDpi: 300,
        transparentBg: true,
        svgExport: true,
        textPrompt: true,
      },
    };

    res.json({
      subscription: {
        id: subscription.id,
        planType: subscription.plan_type,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        autoRenew: subscription.auto_renew,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stats: {
          projectCount: subscription.project_count || 0,
          monthGenerations: subscription.month_generations || 0,
        },
        limits: planLimits[subscription.plan_type] || planLimits.free,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

/**
 * Create checkout session (simplified - would integrate with Stripe in production)
 */
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { planType } = createSubscriptionSchema.parse(req.body);
    const userId = req.user.id;

    // Get current subscription
    const subResult = await query(
      `SELECT id, plan_type, status
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const currentSubscription = subResult.rows[0];

    if (currentSubscription && currentSubscription.plan_type === planType) {
      return res.status(400).json({
        error: 'You already have this plan',
        currentPlan: currentSubscription.plan_type,
      });
    }

    // In production, this would create a Stripe checkout session
    // For now, we'll simulate it
    const prices = {
      basic: 490, // RUB
      pro: 1190, // RUB
    };

    res.json({
      checkoutUrl: `https://logoai.example.com/checkout?plan=${planType}`,
      amount: prices[planType],
      currency: 'RUB',
      planType,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * Update subscription (for webhook handling in production)
 */
router.post('/update', async (req, res) => {
  try {
    const { userId, planType, status, stripeCustomerId, stripeSubscriptionId } = req.body;

    // Cancel existing active subscriptions
    await query(
      `UPDATE subscriptions
       SET status = 'cancelled', cancel_at_period_end = true
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    // Create new subscription
    const result = await query(
      `INSERT INTO subscriptions (user_id, plan_type, status, stripe_customer_id, stripe_subscription_id,
                                   current_period_start, current_period_end)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '1 month')
       RETURNING *`,
      [userId, planType, status, stripeCustomerId, stripeSubscriptionId]
    );

    const subscription = result.rows[0];

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.plan_type,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `UPDATE subscriptions
       SET cancel_at_period_end = true
       WHERE user_id = $1 AND status = 'active'
       RETURNING id, current_period_end`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    res.json({
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: result.rows[0].current_period_end,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * Get billing history
 */
router.get('/invoices', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, amount, currency, status, invoice_url, created_at
       FROM invoices
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      invoices: result.rows.map((invoice) => ({
        id: invoice.id,
        amount: parseFloat(invoice.amount),
        currency: invoice.currency,
        status: invoice.status,
        invoiceUrl: invoice.invoice_url,
        createdAt: invoice.created_at,
      })),
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

module.exports = router;