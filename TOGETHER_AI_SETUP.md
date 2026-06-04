# Together AI Integration Guide

## Overview
LogoAI теперь использует бесплатную модель **Together AI FLUX.1-schnell-Free** для генерации логотипов вместо платного Replicate.

## Benefits
- ✅ **БЕСПЛАТНО**: модель FLUX.1-schnell-Free бесплатна
- ✅ **БЫСТРО**: до 4 шагов (steps=4) вместо 20-50
- ✅ **КАЧЕСТВО**: современные генеративные модели
- ✅ **СТАБИЛЬНО**: прямые HTTP запросы, без зависимостей

## Setup Instructions

### 1. Получить API ключ Together AI

1. Перейдите на https://api.together.ai/signin
2. Войдите через GitHub/Google или создайте аккаунт
3. Перейдите на https://api.together.ai/credits
4. Получите бесплатные кредиты (обычно 25$)
5. Скопируйте API ключ

### 2. Настроить переменную окружения

Откройте файл `.env` в папке `/root/figma/backend/`:

```bash
# Together AI API (FREE FLUX.1-schnell-Free)
TOGETHER_API_KEY=your_actual_api_key_here
```

Вставьте ваш API ключ вместо `your_actual_api_key_here`.

### 3. Перезапустить сервер

```bash
cd /root/figma/backend
pkill -f "node.*server.js"  # Остановить старый процесс
node server.js &             # Запустить новый
```

### 4. Проверить работу

1. Откройте http://172.24.254.145:9000/
2. Войдите в аккаунт
3. Создайте новый логотип
4. Откройте консоль (F12) для логирования
5. Должны увидеть:
   ```
   Starting Together AI generation
   Generated prompt: Professional logo design for "..."
   Together AI response status: 200
   Variant 1 generated successfully: https://cdn.together.xyz/...
   ```

## API Details

### Endpoint
```
POST https://api.together.xyz/v1/images/generations
```

### Request Headers
```json
{
  "Authorization": "Bearer {API_KEY}",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "model": "black-forest-labs/FLUX.1-schnell-Free",
  "prompt": "Professional logo design for \"Brand Name\", tech company, minimalist...",
  "width": 512,
  "height": 512,
  "steps": 4,
  "n": 1,
  "seed": 1234567890
}
```

### Response
```json
{
  "data": [
    {
      "url": "https://cdn.together.xyz/..."
    }
  ]
}
```

## Error Handling

### 401 Unauthorized
```
Invalid Together AI API key
```
**Solution:** Проверьте, что API ключ скопирован правильно в `.env`

### 429 Rate Limit
```
Together AI rate limit exceeded. Please wait before generating more logos.
```
**Solution:** Подождите 30-60 секунд или увеличьте интервал между запросами

### 400 Bad Request
```
Together AI bad request: ...
```
**Solution:** Проверьте логи сервера `/tmp/backend-together.log`

### 500 Server Error
```
Together AI server error. Please try again later.
```
**Solution:** Попробуйте через несколько минут

## Rate Limits

Бесплатный план Together AI:
- **Requests:** ~100 запросов/мин (зависит от нагруженности)
- **Credits:** 25$ бесплатных кредитов
- **Timeout:** 60 секунд на запрос

## Monitoring

### Logs
```bash
tail -f /tmp/backend-together.log
```

### Key log messages
```
Starting Together AI generation
Generated prompt: ...
Together AI request: {model: ..., prompt: ...}
Together AI response status: 200
Variant 1 generated successfully: https://...
Successfully generated 4/4 logos
```

## Migration from Replicate

### Removed
```javascript
const Replicate = require('replicate');
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
```

### Added
```javascript
// Direct HTTP requests to Together AI
const response = await fetch('https://api.together.xyz/v1/images/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'black-forest-labs/FLUX.1-schnell-Free',
    prompt: ...,
    width: 512,
    height: 512,
    steps: 4,
    n: 1,
  }),
});
```

## Troubleshooting

### Логотипы не генерируются
1. Проверьте логи: `tail -f /tmp/backend-together.log`
2. Убедитесь, что API ключ в `.env` не пустой
3. Проверьте, что ключ активен на https://api.together.ai/credits

### Ошибка "TOGETHER_API_KEY not configured"
- Добавьте `TOGETHER_API_KEY=...` в `.env`
- Перезапустите сервер

### Ошибка "Invalid Together AI API key"
- API ключ неверный
- Получите новый ключ на https://api.together.ai

### Таймаут генерации
- Вместе AI работает синхронно, не нужно ждать предикции
- Генерация занимает ~5-10 секунд

## Code Changes

### Main file
`/root/figma/backend/services/fluxGenerator.js`

### Key functions
- `generateLogos()` - генерация логотипов через Together AI
- `buildPrompt()` - формирование промпта (без изменений)
- `createPrediction()` - совместимость с асинхронным API
- `getPredictionStatus()` - всегда возвращает succeeded
- `cancelPrediction()` - невозможно для синхронного API

## Support

- Together AI Docs: https://docs.together.ai/docs/images-text
- FLUX.1 Model: https://huggingface.co/black-forest-labs/FLUX.1-schnell-Free
- API Status: https://status.together.ai/