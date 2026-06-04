# LogoAI - Полное решение

## Что реализовано

### ✅ Backend API (Node.js 20 LTS + Express.js)

- **Аутентификация**: JWT + bcrypt, регистрация, вход, выход
- **Пользователи**: управление профилем, настройками, темой
- **Проекты**: CRUD операции, избранное, поиск, фильтрация
- **Генерация логотипов**: интеграция с FLUX.1 через Replicate API
- **Подписки**: 3 плана (Free, Basic, Pro), лимиты, история платежей
- **Валидация**: Zod для всех запросов
- **База данных**: PostgreSQL 16 с полным schema

### ✅ FLUX.1 Интеграция

- **Автоматический промптинг**: на основе параметров wizard
- **Синхронная генерация**: мгновенный результат
- **Асинхронная генерация**: с поллингом статуса
- **Pro feature**: кастомные текстовые промпты
- **Модель**: FLUX.1 Schnell (быстрая, ~3-5 сек)

### ✅ Frontend API Scripts

- **Полный API клиент**: все функции для работы с бэкендом
- **Автоматическая аутентификация**: токены, обновление
- **Интеграция с UI**: функции для dashboard, wizard, favorites
- **Обработка ошибок**: дружественные сообщения

## Структура проекта

```
/root/figma/
├── logoai-prototype-2.html     # Frontend (HTML/CSS/JS)
├── backend/
│   ├── server.js               # Express сервер
│   ├── db.js                   # PostgreSQL connection
│   ├── schema.sql              # Database schema
│   ├── .env                    # Environment variables
│   ├── .env.example            # Environment template
│   ├── package.json            # Dependencies
│   ├── README.md               # Backend documentation
│   ├── API_EXAMPLES.md         # API examples
│   ├── FRONTEND_INTEGRATION.md # Frontend integration guide
│   ├── frontend-api.js         # Frontend API client
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── users.js            # User routes
│   │   ├── projects.js         # Project routes
│   │   ├── generate.js         # Generation routes
│   │   └── subscriptions.js    # Subscription routes
│   └── services/
│       └── fluxGenerator.js    # FLUX.1 integration
└── scripts/
    └── init-db.js              # Database initialization
```

## Быстрый старт

### 1. Настроить окружение

```bash
# Установить Node.js 20 и PostgreSQL 16 (уже установлено)
node --version  # v20.20.2
psql --version  # PostgreSQL 16.14
```

### 2. Настроить бэкенд

```bash
cd backend

# Скопировать .env.example в .env
cp .env.example .env

# Редактировать .env и добавить:
# - REPLICATE_API_TOKEN (получить на https://replicate.com/account/api-tokens)
# - JWT_SECRET (любой секретный ключ)
```

### 3. Инициализировать базу данных

```bash
npm run init-db
```

### 4. Запустить бэкенд

```bash
npm start
```

Бэкенд будет доступен на `http://localhost:3000`

### 5. Интегрировать фронтенд

Скопируйте `frontend-api.js` в директорию с HTML файлом и добавьте в HTML:

```html
<script src="frontend-api.js"></script>
```

Следуйте инструкциям в `FRONTEND_INTEGRATION.md` для полной интеграции.

## API Эндпоинты

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход

### Пользователи
- `GET /api/users/me` - Профиль
- `PATCH /api/users/me` - Обновление профиля
- `DELETE /api/users/me` - Удаление аккаунта

### Проекты
- `GET /api/projects` - Список проектов
- `GET /api/projects/:id` - Детали проекта
- `POST /api/projects` - Создать проект
- `PATCH /api/projects/:id` - Обновить проект
- `DELETE /api/projects/:id` - Удалить проект
- `POST /api/projects/:id/favorite` - Избранное

### Генерация
- `POST /api/generate/sync` - Синхронная генерация
- `POST /api/generate/async` - Асинхронная генерация
- `GET /api/generate/status/:predictionId` - Статус генерации
- `DELETE /api/generate/cancel/:predictionId` - Отмена генерации

### Подписки
- `GET /api/subscriptions/me` - Текущая подписка
- `POST /api/subscriptions/checkout` - Создать оплату
- `POST /api/subscriptions/cancel` - Отменить подписку
- `GET /api/subscriptions/invoices` - История платежей

## FLUX.1 Генерация

### Как работает

1. **Параметры**: Название бренда, ниша, стиль, цвета
2. **Промпт**: Автоматическое построение промпта
3. **API запрос**: Replicate API → FLUX.1 Schnell
4. **Результат**: 4 варианта логотипов

### Пример промпта

```
Professional logo design for "TechFlow",
tech company, startup, software, IT, technology,
minimalist logo design, clean lines, simple shapes,
modern, professional, purple color scheme,
white color scheme, vector style, clean,
white background, high quality, professional logo design
```

### Pro Feature

Пользователи с планом Pro могут использовать свои промпты:

```javascript
{
  "brandName": "MyBrand",
  "textPrompt": "minimalist logo design for a tech startup, purple gradient, modern vector style"
}
```

## Планы подписок

| Feature | Free | Basic (490 ₽) | Pro (1190 ₽) |
|---------|------|---------------|--------------|
| Генераций в месяц | 3 | 30 | Безлимит |
| Проектов в истории | 3 | 50 | Безлимит |
| PNG dpi | 72 | 300 | 300 |
| Прозрачный фон | ❌ | ✅ | ✅ |
| SVG | ❌ | ✅ (разово) | ✅ |
| Текстовый промпт | ❌ | ❌ | ✅ |

## Технический стек

### Backend
- Node.js 20 LTS
- Express.js
- PostgreSQL 16
- JWT + bcrypt
- Zod
- Replicate SDK
- Axios

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API

### AI Model
- FLUX.1 Schnell (via Replicate)

## Следующие шаги

### Для production

1. **Безопасность**
   - Заменить `JWT_SECRET` на сильный ключ
   - Использовать HTTPS
   - Настроить Rate Limiting
   - Добавить CSRF защиту

2. **Масштабирование**
   - Использовать PM2 или Docker
   - Настроить нагрузочное тестирование
   - Добавить кэширование (Redis)

3. **Мониторинг**
   - Логирование (Winston, Pino)
   - Метрики (Prometheus)
   - APM (New Relic, Datadog)

4. **Платежи**
   - Интегрировать Stripe
   - Настроить webhooks
   - Добавить рекуррентные платежи

5. **Дополнительно**
   - WebSocket для real-time обновлений
   - Email уведомления (Nodemailer)
   - Загрузка аватаров (Multer + S3)
   - SVG векторизация (Potrace)
   - 2FA (TOTP)

### Для разработки

1. **Тесты**
   - Unit тесты (Jest)
   - Integration тесты
   - E2E тесты (Playwright)

2. **Документация**
   - Swagger/OpenAPI
   - JSDoc комментарии
   - README для каждой модели

3. **Инструменты**
   - ESLint + Prettier
   - Husky + lint-staged
   - GitHub Actions CI/CD

## Поддержка

### Документация

- `backend/README.md` - Backend документация
- `backend/API_EXAMPLES.md` - Примеры API запросов
- `backend/FRONTEND_INTEGRATION.md` - Интеграция фронтенда

### Контакты

Для вопросов и поддержки:
- GitHub Issues
- Email: support@logoai.example.com

## Лицензия

ISC

---

**Создано с использованием FLUX.1 от Black Forest Labs** 🎨