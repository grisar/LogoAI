/**
 * FLUX.1 Logo Generator using Together AI
 * Free model: black-forest-labs/FLUX.1-schnell-Free
 * API: https://api.together.ai
 */

// Style mapping for FLUX.1 prompts
const STYLE_PROMPTS = {
  'Минималистичный': 'minimalist logo design, clean lines, simple shapes, modern, professional',
  'Геометрический': 'geometric logo design, bold shapes, geometric patterns, vector style',
  'Ретро / Vintage': 'vintage logo design, retro style, classic typography, nostalgic feel',
  'Современный': 'modern logo design, contemporary, sleek, innovative style',
  'Рукописный': 'hand-drawn logo design, artistic, brush strokes, creative',
  'Абстрактный': 'abstract logo design, conceptual, artistic, creative shapes',
};

// Color mapping for FLUX.1 prompts
const COLOR_PROMPTS = {
  '#C68DFF': 'purple color scheme',
  '#CBE857': 'lime green color scheme',
  '#323843': 'dark charcoal color scheme',
  '#FFFFFF': 'white color scheme',
  '#5BA84A': 'green color scheme',
  '#E25A6F': 'pink color scheme',
};

// Niche mapping for FLUX.1 prompts
const NICHE_PROMPTS = {
  'Технологии': 'tech company, startup, software, IT, technology',
  'Дизайн': 'design studio, creative agency, design firm',
  'Медицина': 'medical, healthcare, clinic, pharmacy',
  'Еда и рестораны': 'restaurant, cafe, food delivery, culinary',
  'Образование': 'education, school, university, learning platform',
  'Финансы': 'finance, banking, investment, fintech',
  'Спорт': 'sports, fitness, gym, athletics',
  'Другое': 'business, company, brand, startup',
};

/**
 * Build a prompt for FLUX.1 based on user inputs
 *
 * Формирует промпт для модели FLUX.1, используя:
 * - brandName: название бренда
 * - niche: сфера/ниша бизнеса (например: Технологии, Дизайн, Медицина или кастомная ниша)
 * - style: стиль логотипа (например: Минималистичный, Геометрический, Винтаж)
 * - colors: основной цвет логотипа (например: #C68DFF)
 * - textPrompt: кастомный текстовый промпт (Pro функция)
 */
function buildPrompt(params) {
  const { brandName, niche, style, colors, textPrompt } = params;

  let prompt = '';

  // Кастомный FLUX.1 промпт (Pro функция)
  if (textPrompt && textPrompt.trim()) {
    prompt = textPrompt.trim();
  } else {
    // Формируем промпт из параметров мастера генерации
    prompt = `Professional logo design for "${brandName}"`;

    // 1. Добавляем сферу/нишу (выбирает отрасль бизнеса)
    if (niche && niche.trim()) {
      const trimmedNiche = niche.trim();

      // Проверяем, есть ли ниша в маппинге (готовых вариантах)
      if (NICHE_PROMPTS[trimmedNiche]) {
        prompt += `, ${NICHE_PROMPTS[trimmedNiche]}`;
        console.log(`Added mapped niche to prompt: ${trimmedNiche} -> ${NICHE_PROMPTS[trimmedNiche]}`);
      } else {
        // Если ниши нет в маппинге (кастомная ниша) - добавляем как есть с бизнес-контекстом
        prompt += `, ${trimmedNiche.toLowerCase()} business, ${trimmedNiche.toLowerCase()} company`;
        console.log(`Added custom niche to prompt: ${trimmedNiche}`);
      }
    }

    // 2. Добавляем стиль (определяет визуальный стиль логотипа)
    if (style && STYLE_PROMPTS[style]) {
      prompt += `, ${STYLE_PROMPTS[style]}`;
      console.log(`Added style to prompt: ${style} -> ${STYLE_PROMPTS[style]}`);
    } else if (style) {
      // Если стиль не в маппинге, добавляем как есть
      prompt += `, ${style.toLowerCase()} style`;
      console.log(`Added style as-is to prompt: ${style}`);
    }

    // 3. Добавляем цвета (определяет основную цветовую схему)
    if (colors && colors.length > 0) {
      const colorDescriptions = colors
        .map((color) => COLOR_PROMPTS[color] || '')
        .filter(Boolean);

      if (colorDescriptions.length > 0) {
        prompt += `, ${colorDescriptions.join(', ')}`;
        console.log(`Added colors to prompt: ${colors.join(', ')} -> ${colorDescriptions.join(', ')}`);
      } else {
        // Если цвет не в маппинге, добавляем hex-значение
        const primaryColor = colors[0];
        if (primaryColor) {
          prompt += `, main color ${primaryColor}`;
          console.log(`Added color hex to prompt: ${primaryColor}`);
        }
      }
    }

    // Технические спецификации для лучшей генерации логотипов
    prompt += ', vector style, clean, white background, high quality, professional logo design';
  }

  console.log('Final generated prompt:', prompt);
  return prompt;
}

/**
 * Generate logos using Together AI FLUX.1-schnell-Free (FREE)
 * API: https://api.together.ai
 * Model: black-forest-labs/FLUX.1-schnell-Free
 */
async function generateLogos(params) {
  const { brandName, niche, style, colors, textPrompt, numVariants = 4 } = params;

  console.log('Starting Together AI generation');
  console.log('Params:', { brandName, niche, style, colors, textPrompt, numVariants });

  const prompt = buildPrompt({ brandName, niche, style, colors, textPrompt });
  console.log('Generated prompt:', prompt);

  // Проверяем наличие API ключа
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    console.error('TOGETHER_API_KEY not found in environment variables');
    throw new Error('TOGETHER_API_KEY not configured');
  }

  const images = [];
  const errors = [];

  // Генерируем каждый вариант отдельно (n=1 в запросе)
  for (let i = 0; i < numVariants; i++) {
    try {
      console.log(`Generating variant ${i + 1}/${numVariants}...`);

      const requestBody = {
        model: 'black-forest-labs/FLUX.1-schnell-Free',
        prompt: `${prompt}, variant ${i + 1}, different unique design`,
        width: 512,
        height: 512,
        steps: 4,  // Максимум для бесплатной модели
        n: 1,
        seed: Date.now() + i, // Разный seed для каждого варианта
      };

      console.log('Together AI request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Together AI response status:', response.status);

      // Обработка ошибок
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Together AI error response:', errorText);

        if (response.status === 401) {
          throw new Error('Invalid Together AI API key');
        } else if (response.status === 429) {
          throw new Error('Together AI rate limit exceeded. Please wait before generating more logos.');
        } else if (response.status === 400) {
          throw new Error(`Together AI bad request: ${errorText}`);
        } else if (response.status >= 500) {
          throw new Error('Together AI server error. Please try again later.');
        } else {
          throw new Error(`Together AI error (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Together AI response data:', JSON.stringify(data, null, 2));

      // Парсинг URL изображения из ответа
      if (data.data && data.data.length > 0 && data.data[0].url) {
        const imageUrl = data.data[0].url;
        console.log(`Variant ${i + 1} generated successfully:`, imageUrl);
        images.push(imageUrl);
      } else {
        throw new Error('No image URL in Together AI response');
      }

      // Небольшая задержка между запросами для избежания rate limit
      if (i < numVariants - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`Error generating variant ${i + 1}:`, error);
      errors.push({ variant: i + 1, error: error.message });

      // Если это последний вариант и все неуспешны - выбрасываем ошибку
      if (i === numVariants - 1 && images.length === 0) {
        throw new Error(`Failed to generate any logos. Last error: ${error.message}`);
      }
    }
  }

  if (images.length === 0) {
    throw new Error(`Failed to generate logos. Errors: ${errors.map(e => e.error).join(', ')}`);
  }

  console.log(`Successfully generated ${images.length}/${numVariants} logos`);

  return {
    success: true,
    images: images,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Create a prediction (async generation) - синхронная реализация
 * Вместо Replicate predict используем direct Together AI API
 */
async function createPrediction(params) {
  try {
    const { brandName, niche, style, colors, textPrompt, numVariants = 4 } = params;

    const prompt = buildPrompt({ brandName, niche, style, colors, textPrompt });

    console.log('Starting async generation with prompt:', prompt);

    // Вместо предикции сразу вызываем генерацию (синхронно)
    const result = await generateLogos({ brandName, niche, style, colors, textPrompt, numVariants });

    console.log('Async generation completed:', result.success);

    return {
      success: true,
      predictionId: null, // Вместе AI работает синхронно, без prediction ID
      status: 'succeeded',
      output: result.images,
      errors: result.errors,
    };
  } catch (error) {
    console.error('Error in async generation:', error);
    throw new Error(`Failed to create prediction: ${error.message}`);
  }
}

/**
 * Get prediction status - для совместимости с существующим кодом
 * Вместе AI работает синхронно, так что всегда возвращаем succeeded
 */
async function getPredictionStatus(predictionId) {
  try {
    // Вместе AI работает синхронно, predictionId всегда null
    if (!predictionId || predictionId === 'null' || predictionId === 'undefined') {
      return {
        id: null,
        status: 'succeeded',
        output: null,
        error: null,
      };
    }

    // Для обратной совместимости
    console.warn('getPredictionStatus called with predictionId, but Together AI works synchronously');
    return {
      id: predictionId,
      status: 'succeeded',
      output: null,
      error: null,
    };
  } catch (error) {
    console.error('Error getting prediction status:', error);
    throw new Error(`Failed to get prediction status: ${error.message}`);
  }
}

/**
 * Cancel a running prediction - для совместимости с существующим кодом
 * Вместе AI работает синхронно, так что нельзя отменить
 */
async function cancelPrediction(predictionId) {
  try {
    // Вместе AI работает синхронно, так что нельзя отменить
    console.warn('cancelPrediction called, but Together AI works synchronously');

    return {
      success: true,
      status: 'cancelled',
      message: 'Together AI works synchronously and cannot be cancelled',
    };
  } catch (error) {
    console.error('Error canceling prediction:', error);
    throw new Error(`Failed to cancel prediction: ${error.message}`);
  }
}

/**
 * Convert PNG to SVG using a simple approach
 * Note: For production, you might want to use a vectorization service
 */
async function convertToSVG(pngUrl) {
  try {
    // This is a placeholder - for production you'd use a vectorization service
    // like Vector Magic, Potrace, or a dedicated AI model
    console.log('SVG conversion not implemented - using placeholder');

    return {
      success: true,
      svgUrl: pngUrl, // Placeholder - return original URL for now
      message: 'SVG conversion requires additional service integration',
    };
  } catch (error) {
    console.error('Error converting to SVG:', error);
    throw new Error(`Failed to convert to SVG: ${error.message}`);
  }
}

/**
 * Generate a mock SVG logo (fallback)
 */
function generateMockLogoSVG(brandName, color, variant) {
  const initial = brandName ? brandName.charAt(0).toUpperCase() : 'L';

  const shapes = [
    `<circle cx="50" cy="50" r="40" stroke="${color}" stroke-width="4" fill="none"/>`,
    `<rect x="15" y="15" width="70" height="70" rx="10" stroke="${color}" stroke-width="4" fill="none"/>`,
    `<polygon points="50,15 85,75 15,75" stroke="${color}" stroke-width="4" fill="none"/>`,
    `<ellipse cx="50" cy="50" rx="45" ry="30" stroke="${color}" stroke-width="4" fill="none"/>`,
  ];

  const backgrounds = [
    `<rect width="100%" height="100%" fill="#f3f4f6"/>`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<rect width="100%" height="100%" fill="#fef3c7"/>`,
    `<rect width="100%" height="100%" fill="#dbeafe"/>`,
  ];

  const svg = `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">
      ${backgrounds[variant % backgrounds.length]}
      ${shapes[variant % shapes.length]}
      <text x="50" y="58" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" font-weight="bold" fill="${color}">${initial}</text>
    </svg>`
  ).toString('base64')}`;

  return svg;
}

module.exports = {
  generateLogos,
  buildPrompt,
  createPrediction,
  getPredictionStatus,
  cancelPrediction,
  convertToSVG,
  generateMockLogoSVG, // Export for fallback
};