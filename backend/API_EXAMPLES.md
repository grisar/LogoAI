# LogoAI API Examples

Здесь приведены примеры запросов к LogoAI Backend API.

## Базовый URL

```
http://localhost:3000
```

## Аутентификация

### Регистрация

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Иван Иванов"
  }'
```

**Ответ:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "createdAt": "2024-05-20T12:00:00.000Z"
  }
}
```

### Вход

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Ответ:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "subscription": {
      "planType": "free",
      "status": "active"
    }
  }
}
```

**Для всех защищенных маршрутов используйте заголовок:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Генерация логотипов

### Синхронная генерация

Генерирует логотипы и возвращает результат сразу (рекомендуется для разработки).

```bash
curl -X POST http://localhost:3000/api/generate/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "brandName": "TechFlow",
    "niche": "Технологии",
    "style": "Минималистичный",
    "colors": ["#C68DFF", "#FFFFFF"],
    "numVariants": 4
  }'
```

**Ответ:**
```json
{
  "success": true,
  "generationId": "uuid",
  "projectId": "uuid",
  "logos": [
    {
      "id": "uuid",
      "variant": 1,
      "url": "https://replicate.delivery/...",
      "prompt": "Professional logo design for \"TechFlow\", tech company, startup, software, IT, technology, minimalist logo design, clean lines, simple shapes, modern, professional, purple color scheme, white color scheme, vector style, clean, white background, high quality, professional logo design"
    },
    {
      "id": "uuid",
      "variant": 2,
      "url": "https://replicate.delivery/...",
      "prompt": "..."
    }
  ]
}
```

### Асинхронная генерация

Запускает генерацию в фоновом режиме и возвращает ID для поллинга (рекомендуется для production).

```bash
curl -X POST http://localhost:3000/api/generate/async \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "brandName": "CreativeStudio",
    "niche": "Дизайн",
    "style": "Абстрактный",
    "colors": ["#CBE857", "#323843"],
    "numVariants": 4
  }'
```

**Ответ:**
```json
{
  "success": true,
  "generationId": "uuid",
  "projectId": "uuid",
  "predictionId": "prediction_id_from_replicate",
  "status": "processing"
}
```

### Проверка статуса генерации

```bash
curl -X GET http://localhost:3000/api/generate/status/prediction_id_from_replicate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ (в процессе):**
```json
{
  "id": "prediction_id_from_replicate",
  "status": "processing",
  "output": null,
  "error": null
}
```

**Ответ (завершено):**
```json
{
  "id": "prediction_id_from_replicate",
  "status": "completed",
  "output": [
    "https://replicate.delivery/...",
    "https://replicate.delivery/...",
    "https://replicate.delivery/...",
    "https://replicate.delivery/..."
  ],
  "error": null
}
```

### Отмена генерации

```bash
curl -X DELETE http://localhost:3000/api/generate/cancel/prediction_id_from_replicate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "success": true,
  "status": "cancelled"
}
```

## Проекты

### Получить все проекты

```bash
curl -X GET "http://localhost:3000/api/projects?status=done&search=TechFlow" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "TechFlow",
      "niche": "Технологии",
      "style": "Минималистичный",
      "colors": ["#C68DFF", "#FFFFFF"],
      "status": "done",
      "isFavorite": false,
      "logos": [
        {
          "id": "uuid",
          "variant": 1,
          "url": "https://replicate.delivery/..."
        }
      ],
      "createdAt": "2024-05-20T12:00:00.000Z",
      "updatedAt": "2024-05-20T12:05:00.000Z"
    }
  ]
}
```

### Получить проект по ID

```bash
curl -X GET http://localhost:3000/api/projects/uuid \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Создать проект

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "NewBrand",
    "niche": "Медицина",
    "style": "Современный",
    "colors": ["#5BA84A"]
  }'
```

### Обновить проект

```bash
curl -X PATCH http://localhost:3000/api/projects/uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "UpdatedBrand",
    "status": "done"
  }'
```

### Добавить в избранное

```bash
curl -X POST http://localhost:3000/api/projects/uuid/favorite \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "isFavorite": true
}
```

### Удалить проект

```bash
curl -X DELETE http://localhost:3000/api/projects/uuid \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Подписки

### Получить текущую подписку

```bash
curl -X GET http://localhost:3000/api/subscriptions/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "subscription": {
    "id": "uuid",
    "planType": "free",
    "status": "active",
    "currentPeriodStart": null,
    "currentPeriodEnd": null,
    "autoRenew": false,
    "cancelAtPeriodEnd": false,
    "stats": {
      "projectCount": 5,
      "monthGenerations": 2
    },
    "limits": {
      "generationsPerMonth": 3,
      "projectsLimit": 3,
      "pngDpi": 72,
      "transparentBg": false,
      "svgExport": false,
      "textPrompt": false
    }
  }
}
```

### Создать сессию оплаты

```bash
curl -X POST http://localhost:3000/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "planType": "basic"
  }'
```

**Ответ:**
```json
{
  "checkoutUrl": "https://logoai.example.com/checkout?plan=basic",
  "amount": 490,
  "currency": "RUB",
  "planType": "basic"
}
```

### Отменить подписку

```bash
curl -X POST http://localhost:3000/api/subscriptions/cancel \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "success": true,
  "cancelAtPeriodEnd": true,
  "currentPeriodEnd": "2024-06-20T00:00:00.000Z"
}
```

### Получить историю платежей

```bash
curl -X GET http://localhost:3000/api/subscriptions/invoices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "amount": 490.00,
      "currency": "RUB",
      "status": "paid",
      "invoiceUrl": "https://...",
      "createdAt": "2024-05-20T12:00:00.000Z"
    }
  ]
}
```

## Пользователи

### Получить профиль

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Обновить профиль

```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Новое имя",
    "theme": "dark",
    "notificationEmail": true,
    "notificationGeneration": false
  }'
```

### Удалить аккаунт

```bash
curl -X DELETE http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Pro Feature: Текстовый промпт

Только для пользователей с планом Pro:

```bash
curl -X POST http://localhost:3000/api/generate/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PRO_USER_TOKEN_HERE" \
  -d '{
    "brandName": "MyBrand",
    "textPrompt": "minimalist logo design for a tech startup, purple gradient, modern vector style, clean lines, white background, high quality",
    "numVariants": 4
  }'
```

## Health Check

```bash
curl http://localhost:3000/health
```

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2024-05-20T12:00:00.000Z"
}
```

## Ошибки

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Free plan limit reached (3 generations per month)",
  "used": 3,
  "limit": 3,
  "requiredPlan": "basic"
}
```

### 404 Not Found
```json
{
  "error": "Not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## WebSocket (для real-time обновлений)

В будущем можно добавить WebSocket для real-time обновлений генерации:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Generation status:', data.status);
  console.log('Progress:', data.progress);
};

// Send generation request
ws.send(JSON.stringify({
  type: 'generate',
  token: 'YOUR_TOKEN_HERE',
  params: {
    brandName: 'MyBrand',
    niche: 'Технологии',
    style: 'Минималистичный',
    colors: ['#C68DFF'],
    numVariants: 4
  }
}));
```