const { query } = require('../db');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  niche: z.string().optional(),
  style: z.string().optional(),
  colors: z.array(z.string()).optional(),
  textPrompt: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  niche: z.string().optional(),
  style: z.string().optional(),
  colors: z.array(z.string()).optional(),
  status: z.enum(['draft', 'generating', 'done', 'failed']).optional(),
});

const router = require('express').Router();

/**
 * Get all projects for current user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search, favorites } = req.query;
    const userId = req.user.id;

    let queryText = `
      SELECT p.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', l.id,
                   'variant', l.variant_index,
                   'url', l.png_url
                 )
                 ORDER BY l.variant_index
               ) FILTER (WHERE l.id IS NOT NULL),
               '[]'
             ) as logos
      FROM projects p
      LEFT JOIN logos l ON p.id = l.project_id
      WHERE p.user_id = $1
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      queryText += ` AND p.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (p.name ILIKE $${paramIndex} OR p.niche ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (favorites === 'true') {
      queryText += ` AND p.is_favorite = true`;
    }

    queryText += ' GROUP BY p.id ORDER BY p.updated_at DESC';

    const result = await query(queryText, queryParams);

    res.json({
      projects: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        niche: row.niche,
        style: row.style,
        colors: row.colors,
        textPrompt: row.text_prompt,
        status: row.status,
        isFavorite: row.is_favorite,
        logos: row.logos,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

/**
 * Get project by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT p.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', l.id,
                    'variant', l.variant_index,
                    'url', l.png_url,
                    'svgData', l.svg_data,
                    'isSelected', l.is_selected
                  )
                  ORDER BY l.variant_index
                ) FILTER (WHERE l.id IS NOT NULL),
                '[]'
              ) as logos
       FROM projects p
       LEFT JOIN logos l ON p.id = l.project_id
       WHERE p.id = $1 AND p.user_id = $2
       GROUP BY p.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = result.rows[0];

    res.json({
      project: {
        id: project.id,
        name: project.name,
        niche: project.niche,
        style: project.style,
        colors: project.colors,
        textPrompt: project.text_prompt,
        status: project.status,
        isFavorite: project.is_favorite,
        logos: project.logos,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

/**
 * Create new project
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, niche, style, colors, textPrompt } = createProjectSchema.parse(req.body);
    const userId = req.user.id;

    // Check if user has text prompt feature (Pro plan)
    if (textPrompt) {
      const subResult = await query(
        `SELECT plan_type
         FROM subscriptions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      const subscription = subResult.rows[0] || { plan_type: 'free' };

      if (subscription.plan_type !== 'pro') {
        return res.status(403).json({
          error: 'Text prompt feature is only available on Pro plan',
          requiredPlan: 'pro',
        });
      }
    }

    const result = await query(
      `INSERT INTO projects (user_id, name, niche, style, colors, text_prompt, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING *`,
      [userId, name, niche, style, JSON.stringify(colors || []), textPrompt]
    );

    const project = result.rows[0];

    res.status(201).json({
      project: {
        id: project.id,
        name: project.name,
        niche: project.niche,
        style: project.style,
        colors: project.colors,
        textPrompt: project.text_prompt,
        status: project.status,
        isFavorite: project.is_favorite,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * Update project
 */
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, niche, style, colors, status } = updateProjectSchema.parse(req.body);
    const userId = req.user.id;

    const result = await query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           niche = COALESCE($2, niche),
           style = COALESCE($3, style),
           colors = COALESCE($4, colors),
           status = COALESCE($5, status)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name, niche, style, colors ? JSON.stringify(colors) : null, status, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = result.rows[0];

    res.json({
      project: {
        id: project.id,
        name: project.name,
        niche: project.niche,
        style: project.style,
        colors: project.colors,
        textPrompt: project.text_prompt,
        status: project.status,
        isFavorite: project.is_favorite,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * Toggle project favorite status
 */
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE projects
       SET is_favorite = NOT is_favorite
       WHERE id = $1 AND user_id = $2
       RETURNING is_favorite`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      isFavorite: result.rows[0].is_favorite,
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

/**
 * Delete project
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('Delete project request:', {
      projectId: id,
      userId: userId,
      userEmail: req.user.email
    });

    const result = await query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      console.log('Delete failed: Project not found or user does not own it', {
        projectId: id,
        userId: userId
      });
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('Project deleted successfully:', {
      projectId: id,
      deletedId: result.rows[0].id
    });

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;