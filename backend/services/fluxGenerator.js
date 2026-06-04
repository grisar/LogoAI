/**
 * FLUX.1 Logo Generator using Hugging Face Inference API
 * Free model: stabilityai/sdxl-turbo
 * API: https://api-inference.huggingface.co
 */

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
 * Generate logos using Hugging Face Inference API
 * Model: stabilityai/sdxl-turbo (FREE)
 * API: https://api-inference.huggingface.co
 */
async function generateLogos(params) {
  console.log('Starting Hugging Face generation');
  
  const apiKey = process.env.HF_API_TOKEN;
  if (!apiKey) {
    console.error('HF_API_TOKEN not found in environment variables');
    throw new Error('HF_API_TOKEN not configured');
  }

  const { numVariants = 4 } = params;
  const prompt = buildPrompt(params);
  const modelId = 'stabilityai/sdxl-turbo'; // Fast and FREE model

  console.log('Hugging Face generation config:', {
    model: modelId,
    prompt: prompt.substring(0, 100) + '...',
    variants: numVariants
  });

  const images = [];
  const errors = [];

  // Generate each variant with a different seed
  for (let i = 0; i < numVariants; i++) {
    try {
      console.log(`Generating variant ${i + 1}/${numVariants}...`);

      const requestBody = {
        inputs: prompt,
        parameters: {
          num_inference_steps: 4, // Fast generation
          guidance_scale: 7.5,
          seed: Math.floor(Math.random() * 1000000),
        }
      };

      console.log('Hugging Face request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Hugging Face API error (variant ${i + 1}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        if (response.status === 401) {
          throw new Error('Invalid Hugging Face API token. Check HF_API_TOKEN in .env');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 503) {
          throw new Error('Model is loading. Please try again in a few seconds.');
        } else {
          throw new Error(`Hugging Face API error (${response.status}): ${errorText}`);
        }
      }

      // Hugging Face returns binary image data
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const imageUrl = `data:image/png;base64,${base64}`;

      images.push({
        variant: i + 1,
        url: imageUrl,
        prompt: prompt
      });

      console.log(`Variant ${i + 1} generated successfully`);

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