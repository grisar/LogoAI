const { query } = require('../db');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  notificationEmail: z.boolean().optional(),
  notificationGeneration: z.boolean().optional(),
  notificationMarketing: z.boolean().optional(),
});

const router = require('express').Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, avatar_url, email_verified,
              theme, notification_email, notification_generation,
              notification_marketing, two_factor_enabled,
              created_at, updated_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get subscription info
    const subResult = await query(
      `SELECT plan_type, status, current_period_end,
              (SELECT COUNT(*) FROM projects WHERE user_id = $1) as project_count
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );

    const subscription = subResult.rows[0] || {
      plan_type: 'free',
      status: 'active',
      project_count: 0,
    };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        theme: user.theme,
        notificationEmail: user.notification_email,
        notificationGeneration: user.notification_generation,
        notificationMarketing: user.notification_marketing,
        twoFactorEnabled: user.two_factor_enabled,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        subscription: {
          planType: subscription.plan_type,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
        },
        stats: {
          projectCount: subscription.project_count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * Update user profile
 */
router.patch('/me', async (req, res) => {
  try {
    const { name, theme, notificationEmail, notificationGeneration, notificationMarketing } = updateProfileSchema.parse(req.body);

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           theme = COALESCE($2, theme),
           notification_email = COALESCE($3, notification_email),
           notification_generation = COALESCE($4, notification_generation),
           notification_marketing = COALESCE($5, notification_marketing)
       WHERE id = $6
       RETURNING id, email, name, avatar_url, theme,
                 notification_email, notification_generation, notification_marketing`,
      [name, theme, notificationEmail, notificationGeneration, notificationMarketing, req.user.id]
    );

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        theme: user.theme,
        notificationEmail: user.notification_email,
        notificationGeneration: user.notification_generation,
        notificationMarketing: user.notification_marketing,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Delete user account
 */
router.delete('/me', async (req, res) => {
  try {
    // This will cascade delete all user data
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;