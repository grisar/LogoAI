const Replicate = require('replicate');

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    // Добавляем стиль (определяет визуальный стиль логотипа)
    if (style && STYLE_PROMPTS[style]) {
      prompt += `, ${STYLE_PROMPTS[style]}`;
      console.log(`Added style to prompt: ${style} -> ${STYLE_PROMPTS[style]}`);
    } else if (style) {
      // Если стиль не в маппинге, добавляем как есть
      prompt += `, ${style.toLowerCase()} style`;
      console.log(`Added style as-is to prompt: ${style}`);
    }

    // Добавляем цвета (определяет основную цветовую схему)
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
 * Generate logos using a mock service
 * Note: Replicate API requires payment method or credits
 */
async function generateLogos(params) {
  const { brandName, niche, style, colors, textPrompt, numVariants = 4 } = params;

  console.log('Using mock generation service');
  console.log('Params:', { brandName, niche, style, colors, textPrompt, numVariants });

  const prompt = buildPrompt({ brandName, niche, style, colors, textPrompt });
  console.log('Generated prompt:', prompt);

  // Generate mock SVG logos instead of external placeholder images
  const mockLogos = [];
  for (let i = 0; i < numVariants; i++) {
    const primaryColor = colors && colors[0] || '#6366f1';
    const mockLogo = generateMockLogoSVG(brandName, primaryColor, i + 1);
    mockLogos.push(mockLogo);
  }

  return {
    success: true,
    images: mockLogos,
  };
}

/**
 * Create a prediction (async generation)
 */
async function createPrediction(params) {
  try {
    const { brandName, niche, style, colors, textPrompt, numVariants = 4 } = params;

    const prompt = buildPrompt({ brandName, niche, style, colors, textPrompt });

    console.log('Creating prediction with prompt:', prompt);

    const mockLogos = [];
    for (let i = 0; i < numVariants; i++) {
      const primaryColor = colors && colors[0] || '#6366f1';
      const mockLogo = generateMockLogoSVG(brandName, primaryColor, i + 1);
      mockLogos.push(mockLogo);
    }

    console.log('Prediction created with mock output');

    return {
      success: true,
      predictionId: null,
      status: 'succeeded',
      output: mockLogos,
    };
  } catch (error) {
    console.error('Error creating prediction:', error);
    throw new Error(`Failed to create prediction: ${error.message}`);
  }
}

/**
 * Get prediction status
 */
async function getPredictionStatus(predictionId) {
  try {
    // For synchronous runs, we don't have a prediction ID
    if (!predictionId) {
      return {
        id: null,
        status: 'succeeded',
        output: null,
        error: null,
      };
    }

    const prediction = await replicate.predictions.get(predictionId);

    return {
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
    };
  } catch (error) {
    console.error('Error getting prediction status:', error);
    throw new Error(`Failed to get prediction status: ${error.message}`);
  }
}

/**
 * Cancel a running prediction
 */
async function cancelPrediction(predictionId) {
  try {
    const prediction = await replicate.predictions.cancel(predictionId);

    return {
      success: true,
      status: prediction.status,
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
 * Generate a mock SVG logo
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
};