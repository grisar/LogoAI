const { query } = require('../db');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');
const { generateLogos, createPrediction, getPredictionStatus } = require('../services/fluxGenerator');

// Validation schemas
const generateSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  niche: z.string().optional(),
  style: z.string().optional(),
  colors: z.array(z.string()).optional(),
  textPrompt: z.string().optional(), // Pro feature
  projectId: z.string().uuid().optional(),
  numVariants: z.number().min(1).max(4).default(4),
});

const pollSchema = z.object({
  predictionId: z.string().min(1, 'Prediction ID is required'),
});

const router = require('express').Router();

/**
 * Generate logos synchronously
 */
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const params = generateSchema.parse(req.body);
    const userId = req.user.id;

    // Check user's plan limits
    const subResult = await query(
      `SELECT plan_type, status
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const subscription = subResult.rows[0] || { plan_type: 'free', status: 'active' };

    // Check if text prompt is used (Pro feature)
    if (params.textPrompt && subscription.plan_type !== 'pro') {
      return res.status(403).json({
        error: 'Text prompt feature is only available on Pro plan',
        requiredPlan: 'pro',
      });
    }

    // Check generation limits (simplified - should be more robust in production)
    if (subscription.plan_type === 'free') {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const genCountResult = await query(
        `SELECT COUNT(*) as count
         FROM generations
         WHERE user_id = $1
         AND DATE_TRUNC('month', created_at) = $2::date
         AND status = 'completed'`,
        [userId, currentMonth]
      );

      const genCount = parseInt(genCountResult.rows[0].count);
      if (genCount >= 3) {
        return res.status(403).json({
          error: 'Free plan limit reached (3 generations per month)',
          used: genCount,
          limit: 3,
          requiredPlan: 'basic',
        });
      }
    }

    // Generate logos using FLUX.1
    const result = await generateLogos(params);

    // Create project if not provided
    let projectId = params.projectId;
    if (!projectId) {
      const projectResult = await query(
        `INSERT INTO projects (user_id, name, niche, style, colors, text_prompt, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'done')
         RETURNING id`,
        [userId, params.brandName, params.niche, params.style, JSON.stringify(params.colors || []), params.textPrompt]
      );
      projectId = projectResult.rows[0].id;
    }

    // Create generation record
    const genResult = await query(
      `INSERT INTO generations (user_id, project_id, status, started_at, completed_at)
       VALUES ($1, $2, 'completed', NOW(), NOW())
       RETURNING id`,
      [userId, projectId]
    );

    const generationId = genResult.rows[0].id;

    // Save generated logos
    const logoInserts = result.images.map((img, index) =>
      query(
        `INSERT INTO logos (project_id, generation_id, variant_index, png_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [projectId, generationId, index + 1, img.url]
      )
    );

    await Promise.all(logoInserts);

    res.json({
      success: true,
      generationId,
      projectId,
      logos: result.images.map((img, index) => ({
        id: logoInserts[index].then((r) => r.rows[0].id),
        variant: img.variant,
        url: img.url,
        prompt: img.prompt,
      })),
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Sync generate error:', error);
    res.status(500).json({ error: 'Failed to generate logos' });
  }
});

/**
 * Start async generation
 * 
 * Принимает параметры генерации логотипа:
 * - brandName (обязательно): название бренда
 * - niche (опционально, по умолчанию 'design'): сфера/ниша бизнеса
 * - style (опционально, по умолчанию 'minimalist'): стиль логотипа
 * - colors (опционально, по умолчанию ['#C68DFF']): массив цветов
 * - textPrompt (опционально): текстовый промпт для FLUX.1 (Pro функция)
 * - projectId (опционально): ID существующего проекта
 * - numVariants (опционально, по умолчанию 4): количество вариантов (1-4)
 */
router.post('/async', authenticateToken, async (req, res) => {
  try {
    const params = generateSchema.parse(req.body);
    const userId = req.user.id;

    console.log('Async generation request:', {
      brandName: params.brandName,
      niche: params.niche,
      style: params.style,
      colors: params.colors,
      textPrompt: params.textPrompt ? '***' : undefined,
      numVariants: params.numVariants,
      userId: userId
    });

    // Check user's plan limits (same as sync)
    const subResult = await query(
      `SELECT plan_type, status
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const subscription = subResult.rows[0] || { plan_type: 'free', status: 'active' };

    // Pro feature check: text prompt only available on Pro plan
    if (params.textPrompt && subscription.plan_type !== 'pro') {
      return res.status(403).json({
        error: 'Text prompt feature is only available on Pro plan',
        requiredPlan: 'pro',
      });
    }

    // Создаём проект с тремя новыми параметрами: niche, style, colors
    let projectId = params.projectId;
    if (!projectId) {
      const projectResult = await query(
        `INSERT INTO projects (user_id, name, niche, style, colors, text_prompt, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'generating')
         RETURNING id`,
        [
          userId, 
          params.brandName, 
          params.niche || 'design',      // сфера/ниша
          params.style || 'minimalist',   // стиль логотипа
          JSON.stringify(params.colors || ['#C68DFF']), // массив цветов
          params.textPrompt               // текстовый промпт (Pro)
        ]
      );
      projectId = projectResult.rows[0].id;
      console.log('Created project with ID:', projectId);
    }

    // Передаём все параметры (включая niche, style, colors) в сервис генерации
    const predictionResult = await createPrediction({
      brandName: params.brandName,
      niche: params.niche || 'design',
      style: params.style || 'minimalist',
      colors: params.colors || ['#C68DFF'],
      textPrompt: params.textPrompt,
      numVariants: params.numVariants || 4,
    });

    // Если синхронная генерация (без predictionId), сохраняем результаты напрямую
    if (predictionResult.status === 'succeeded' && predictionResult.output) {
      const images = predictionResult.output;

      // Сохраняем логотипы
      const logoInserts = images.map((url, index) =>
        query(
          `INSERT INTO logos (project_id, generation_id, variant_index, png_url)
           VALUES ($1, NULL, $2, $3)
           RETURNING id`,
          [projectId, index + 1, url]
        )
      );

      const logos = await Promise.all(logoInserts);

      // Обновляем статус проекта
      await query(
        `UPDATE projects SET status = 'done' WHERE id = $1`,
        [projectId]
      );

      res.json({
        success: true,
        generationId: null,
        projectId,
        predictionId: null,
        status: 'completed',
        logos: logos.map((l, i) => ({
          id: l.rows[0].id,
          variant: i + 1,
          url: images[i],
        })),
      });
      return;
    }

    // Создаём запись генерации для асинхронной генерации
    const genResult = await query(
      `INSERT INTO generations (user_id, project_id, status, replicate_prediction_id, started_at)
       VALUES ($1, $2, 'processing', $3, NOW())
       RETURNING id`,
      [userId, projectId, predictionResult.predictionId]
    );

    const generationId = genResult.rows[0].id;

    res.json({
      success: true,
      generationId,
      projectId,
      predictionId: predictionResult.predictionId,
      status: 'processing',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Async generate error:', error);
    res.status(500).json({ error: 'Failed to start generation' });
  }
});

/**
 * Poll generation status
 */
router.get('/status/:predictionId', authenticateToken, async (req, res) => {
  try {
    const { predictionId } = req.params;

    // For mock generation (null predictionId), return success immediately
    if (!predictionId || predictionId === 'null' || predictionId === 'undefined') {
      return res.json({
        status: 'succeeded',
        output: [],
        message: 'Mock generation completed',
      });
    }

    // Get prediction status from Replicate
    const prediction = await getPredictionStatus(predictionId);

    // If completed, save results to database
    if (prediction.status === 'succeeded' && prediction.output) {
      // Find generation record
      const genResult = await query(
        `SELECT id, project_id FROM generations WHERE replicate_prediction_id = $1`,
        [predictionId]
      );

      if (genResult.rows.length > 0) {
        const generation = genResult.rows[0];
        const images = Array.isArray(prediction.output) ? prediction.output : [prediction.output];

        // Save logos
        const logoInserts = images.map((url, index) =>
          query(
            `INSERT INTO logos (project_id, generation_id, variant_index, png_url)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [generation.project_id, generation.id, index + 1, url]
          )
        );

        await Promise.all(logoInserts);

        // Update project status
        await query(
          `UPDATE projects SET status = 'done' WHERE id = $1`,
          [generation.project_id]
        );

        // Update generation status
        await query(
          `UPDATE generations SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [generation.id]
        );
      }
    } else if (prediction.status === 'failed') {
      // Update generation as failed
      await query(
        `UPDATE generations
         SET status = 'failed', error_message = $1, completed_at = NOW()
         WHERE replicate_prediction_id = $2`,
        [prediction.error || 'Unknown error', predictionId]
      );

      // Update project status
      await query(
        `UPDATE generations g
         SET projects.status = 'failed'
         FROM projects
         WHERE projects.id = g.project_id
         AND g.replicate_prediction_id = $1`,
        [predictionId]
      );
    }

    res.json({
      id: prediction.id,
      status: prediction.status === 'succeeded' ? 'completed' : prediction.status,
      output: prediction.output,
      error: prediction.error,
    });
  } catch (error) {
    console.error('Poll status error:', error);
    res.status(500).json({ error: 'Failed to get generation status' });
  }
});

/**
 * Cancel generation
 */
router.delete('/cancel/:predictionId', authenticateToken, async (req, res) => {
  try {
    const { predictionId } = req.params;
    const userId = req.user.id;

    // Check if prediction belongs to user
    const genResult = await query(
      `SELECT id FROM generations WHERE replicate_prediction_id = $1 AND user_id = $2`,
      [predictionId, userId]
    );

    if (genResult.rows.length === 0) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    // Cancel prediction
    await cancelPrediction(predictionId);

    // Update status
    await query(
      `UPDATE generations SET status = 'cancelled', completed_at = NOW() WHERE replicate_prediction_id = $1`,
      [predictionId]
    );

    res.json({ success: true, status: 'cancelled' });
  } catch (error) {
    console.error('Cancel generation error:', error);
    res.status(500).json({ error: 'Failed to cancel generation' });
  }
});

module.exports = router;