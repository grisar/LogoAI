/**
 * FLUX.1 Logo Generator using Cloudflare Workers AI
 * Model: @cf/black-forest-labs/flux-1-schnell
 * API: https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Style mapping for prompt
const STYLE_PROMPTS = {
  'Минималистичный': 'minimalist logo design, clean lines, simple shapes, modern, professional',
  'Геометрический': 'geometric logo design, bold shapes, geometric patterns, vector style',
  'Ретро / Vintage': 'vintage logo design, retro style, classic typography, nostalgic feel',
  'Современный': 'modern logo design, contemporary, sleek, innovative style',
  'Рукописный': 'hand-drawn logo design, artistic, brush strokes, creative',
  'Абстрактный': 'abstract logo design, conceptual, artistic, creative shapes',
};

// Color mapping for prompt
const COLOR_PROMPTS = {
  '#C68DFF': 'purple color scheme',
  '#CBE857': 'lime green color scheme',
  '#323843': 'dark charcoal color scheme',
  '#FFFFFF': 'white color scheme',
  '#5BA84A': 'green color scheme',
  '#E25A6F': 'pink color scheme',
};

// Niche mapping for prompt
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
 * Build a prompt based on user inputs
 */
function buildPrompt(params) {
  const { brandName, niche, style, colors, textPrompt } = params;
  const primaryColor = colors && colors.length > 0 ? colors[0] : '#C68DFF';

  // If textPrompt provided (Pro feature), use it directly
  if (textPrompt && textPrompt.trim()) {
    return `${textPrompt.trim()}, logo design for ${brandName}`;
  }

  // Build custom prompt for FLUX.1
  const nichePrompt = NICHE_PROMPTS[niche] || NICHE_PROMPTS['Другое'];
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['Минималистичный'];
  const colorPrompt = COLOR_PROMPTS[primaryColor] || COLOR_PROMPTS['#C68DFF'];

  const prompt = `Professional logo design for ${brandName}, ${nichePrompt}, ${stylePrompt}, ${colorPrompt}, centered composition, white background, high quality, minimalist`;

  console.log('Generated prompt:', prompt);
  return prompt;
}

/**
 * Decode base64 and save as PNG file
 */
function saveBase64Image(base64Data, uploadDir) {
  const timestamp = Date.now();
  const filename = `logo_${timestamp}_${crypto.randomBytes(4).toString('hex')}.png`;
  const filepath = path.join(uploadDir, filename);

  // Remove data:image/png;base64, prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

  const buffer = Buffer.from(cleanBase64, 'base64');
  fs.writeFileSync(filepath, buffer);

  return filename;
}

/**
 * Generate logos using Cloudflare Workers AI
 * Model: @cf/black-forest-labs/flux-1-schnell
 */
async function generateLogos(params) {
  console.log('Starting Cloudflare Workers AI generation');

  const apiKey = process.env.CF_API_TOKEN;
  const accountId = process.env.CF_ACCOUNT_ID;

  if (!apiKey) {
    console.error('CF_API_TOKEN not found in environment variables');
    throw new Error('CF_API_TOKEN not configured');
  }

  if (!accountId) {
    console.error('CF_ACCOUNT_ID not found in environment variables');
    throw new Error('CF_ACCOUNT_ID not configured');
  }

  const { numVariants = 4, userId } = params;
  const prompt = buildPrompt(params);
  const modelId = '@cf/black-forest-labs/flux-1-schnell';

  console.log('Cloudflare generation config:', {
    model: modelId,
    prompt: prompt.substring(0, 100) + '...',
    variants: numVariants
  });

  // Ensure upload directory exists
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const images = [];
  const errors = [];

  // Generate each variant
  for (let i = 0; i < numVariants; i++) {
    try {
      console.log(`Generating variant ${i + 1}/${numVariants}...`);

      const requestBody = {
        prompt: prompt
      };

      console.log('Cloudflare request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Cloudflare API error (variant ${i + 1}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        if (response.status === 401) {
          throw new Error('Invalid Cloudflare API token. Check CF_API_TOKEN in .env');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 400) {
          throw new Error(`Bad request: ${errorText}`);
        } else {
          throw new Error(`Cloudflare API error (${response.status}): ${errorText}`);
        }
      }

      // Cloudflare returns JSON with base64 image
      const responseData = await response.json();
      const base64Image = responseData.result?.image;

      if (!base64Image) {
        throw new Error('No image data in response');
      }

      // Save base64 image as PNG file
      const filename = saveBase64Image(base64Image, uploadDir);
      const imageUrl = `/uploads/${filename}`;

      images.push({
        variant: i + 1,
        url: imageUrl,
        filename: filename,
        prompt: prompt
      });

      console.log(`Variant ${i + 1} generated and saved: ${filename}`);

      // Add small delay between variants to avoid rate limit
      if (i < numVariants - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error(`Error generating variant ${i + 1}:`, error);
      errors.push({
        variant: i + 1,
        error: error.message
      });
    }
  }

  if (images.length === 0) {
    console.error('No images generated. Errors:', errors);
    throw new Error(`Failed to generate logos. First error: ${errors[0]?.error || 'Unknown error'}`);
  }

  console.log(`Successfully generated ${images.length} variants`);

  return {
    success: true,
    images: images,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Export functions
module.exports = {
  buildPrompt,
  generateLogos
};