const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/logos/:id - получить конкретный логотип
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        l.id,
        l.project_id,
        l.generation_id,
        l.variant_index,
        l.png_url,
        l.font,
        l.background,
        l.editor_status,
        p.name as brand_name,
        p.niche,
        p.style,
        p.color,
        p.user_id,
        l.created_at
      FROM logos l
      LEFT JOIN projects p ON l.project_id = p.id
      WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Логотип не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get logo error:', error);
    res.status(500).json({ error: 'Ошибка при получении логотипа' });
  }
});

// PATCH /api/logos/:id - обновить параметры редактора
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { font, background, editor_status } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (font !== undefined) {
      updates.push(`font = $${paramIndex}`);
      values.push(font);
      paramIndex++;
    }

    if (background !== undefined) {
      updates.push(`background = $${paramIndex}`);
      values.push(background);
      paramIndex++;
    }

    if (editor_status !== undefined) {
      updates.push(`editor_status = $${paramIndex}`);
      values.push(editor_status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(id);

    const result = await query(
      `UPDATE logos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Логотип не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update logo error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении логотипа' });
  }
});

// POST /api/logos/:id/draft - сохранить как черновик
router.post('/:id/draft', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE logos
       SET editor_status = 'draft'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Логотип не найден' });
    }

    const logo = result.rows[0];

    res.json({
      success: true,
      logo
    });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ error: 'Ошибка при сохранении черновика' });
  }
});

// GET /api/logos/project/:projectId - получить логотипы проекта
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await query(
      `SELECT
        l.id,
        l.project_id,
        l.generation_id,
        l.variant_index,
        l.png_url,
        l.font,
        l.background,
        l.editor_status,
        l.is_selected,
        l.created_at
      FROM logos l
      WHERE l.project_id = $1
      ORDER BY l.variant_index`,
      [projectId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get project logos error:', error);
    res.status(500).json({ error: 'Ошибка при получении логотипов проекта' });
  }
});

module.exports = router;