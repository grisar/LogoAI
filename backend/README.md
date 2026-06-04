# LogoAI Backend

Backend для сервиса генерации логотипов с использованием модели FLUX.1 от Black Forest Labs.

## Возможности

- ✅ Генерация логотипов через FLUX.1 (via Replicate API)
- ✅ JWT-аутентификация
- ✅ Управление пользователями
- ✅ Управление проектами и генерациями
- ✅ Система подписок (Free, Basic, Pro)
- ✅ Zod-валидация
- ✅ PostgreSQL база данных
- ✅ Node.js 20 LTS + Express.js

## Технологии

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **Auth**: JWT + bcrypt
- **Validation**: Zod
- **AI Model**: FLUX.1 via Replicate API

## Установка

### Требования

- Node.js 20 LTS
- PostgreSQL 16
- Replicate API Token (для FLUX.1)

### Шаги

1. **Клонировать репозиторий и установить зависимости**

```bash
cd backend
npm install
```

2. **Настроить переменные окружения**

Скопируйте `.env.example` в `.env` и настройте:

```bash
cp .env.example .env
```

Обязательно заполните:
- `DB_PASSWORD` - пароль PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT
- `REPLICATE_API_TOKEN` - API токен для Replicate (получить на https://replicate.com/account/api-tokens)

3. **Инициализировать базу данных**

```bash
npm run init-db
```

Это создаст базу данных `logoai` и применит схему.

4. **Запустить сервер**

```bash
npm start
```

Сервер будет доступен на `http://localhost:3000`

## API Эндпоинты

### Аутентификация

- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему

### Пользователи

- `GET /api/users/me` - Получить информацию о текущем пользователе
- `PATCH /api/users/me` - Обновить профиль пользователя
- `DELETE /api/users/me` - Удалить аккаунт

### Проекты

- `GET /api/projects` - Получить все проекты
- `GET /api/projects/:id` - Получить проект по ID
- `POST /api/projects` - Создать новый проект
- `PATCH /api/projects/:id` - Обновить проект
- `DELETE /api/projects/:id` - Удалить проект
- `POST /api/projects/:id/favorite` - Добавить/убрать из избранного

### Генерация логотипов

#### Синхронная генерация

```bash
POST /api/generate/sync
```

Тело запроса:
```json
{
  "brandName": "MyBrand",
  "niche": "Технологии",
  "style": "Минималистичный",
  "colors": ["#C68DFF", "#FFFFFF"],
  "numVariants": 4
}
```

Ответ:
```json
{
  "success": true,
  "generationId": "uuid",
  "projectId": "uuid",
  "logos": [
    {
      "id": "uuid",
      "variant": 1,
      "url": "https://...",
      "prompt": "..."
    }
  ]
}
```

#### Асинхронная генерация (рекомендуется для production)

```bash
POST /api/generate/async
```

То же тело запроса, но возвращает prediction ID для поллинга.

#### Проверка статуса генерации

```bash
GET /api/generate/status/:predictionId
```

Ответ:
```json
{
  "id": "prediction_id",
  "status": "completed",
  "output": ["url1", "url2", "url3", "url4"]
}
```

### Подписки

- `GET /api/subscriptions/me` - Получить текущую подписку
- `POST /api/subscriptions/checkout` - Создать сессию оплаты
- `POST /api/subscriptions/cancel` - Отменить подписку
- `GET /api/subscriptions/invoices` - История платежей

## Интеграция с FLUX.1

### Как это работает

1. **Промптинг**: Мы строим промпт на основе параметров wizard (название бренда, ниша, стиль, цвета)
2. **API запрос**: Отправляем запрос в Replicate API с моделью FLUX.1 Schnell
3. **Получение результатов**: Получаем сгенерированные изображения
4. **Сохранение**: Сохраняем результаты в базу данных

### Промптинг

Система автоматически строит промпты на основе:

- **Название бренда**: Включается в промпт
- **Ниша**: Маппится на контекстные описания (например, "Технологии" → "tech company, startup, software")
- **Стиль**: Маппится на стильные описания (например, "Минималистичный" → "minimalist logo design, clean lines")
- **Цвета**: Маппится на цветовые описания (например, "#C68DFF" → "purple color scheme")

### Pro Feature: Текстовый промпт

Пользователи с планом Pro могут использовать свои собственные промпты для FLUX.1:

```json
{
  "brandName": "MyBrand",
  "textPrompt": "minimalist logo design for a tech startup, purple gradient, modern vector style"
}
```

### Модель

Мы используем `flux-schnell` (быстрая версия), которая:
- Генерирует изображения за ~3-5 секунд
- Оптимизирована для итераций
- Отлично подходит для прототипирования логотипов

### Конфигурация

В `.env` файле:

```bash
# Replicate API
REPLICATE_API_TOKEN=your_token_here
REPLICATE_MODEL=black-forest-labs/flux-schnell
```

### Получение API токена

1. Перейдите на https://replicate.com/account/api-tokens
2. Создайте новый токен
3. Скопируйте его в `.env` файл

## Планы подписок

### Free (Бесплатный)

- 3 генерации в месяц
- 3 проекта в истории
- PNG 72 dpi
- Без прозрачного фона

### Basic (Базовый) - 490 ₽/мес

- 30 генераций в месяц
- 50 проектов в истории
- PNG, JPG до 300 dpi
- Прозрачный фон
- SVG (разовая покупка)

### Pro (Про) - 1190 ₽/мес

- Безлимит генераций
- Безлимит проектов
- PNG, JPG, SVG до 300 dpi
- Прозрачный фон
- Текстовый промпт FLUX.1
- Приоритетная поддержка

## Структура базы данных

```
users                - Пользователи
subscriptions        - Подписки
projects             - Проекты логотипов
generations          - Записи генераций
logos                - Сгенерированные логотипы
invoices             - Счета
user_sessions        - Сессии пользователей
```

## Развитие

### Запуск в development режиме

```bash
npm run dev
```

### Пересоздание базы данных

```bash
npm run init-db
```

### Проверка миграций

```bash
npm run migrate
```

## Production

Для production:

1. Установите `NODE_ENV=production`
2. Используйте сильный `JWT_SECRET`
3. Настройте HTTPS
4. Настройте процесс-менеджер (PM2)
5. Настройте мониторинг и логирование
6. Используйте внешнюю базу данных
7. Настройте Rate Limiting

## Лицензия

ISC