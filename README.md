# LogoAI

Полнофункциональное веб-приложение для создания логотипов с помощью искусственного интеллекта.

## Структура проекта

```
LogoAI/
├── backend/          # Node.js backend server
│   ├── routes/       # API endpoints
│   ├── middleware/   # Auth middleware
│   ├── services/     # Business logic
│   ├── scripts/      # Database scripts
│   └── db.js         # Database connection
├── frontend/         # Frontend files
│   ├── index.html    # Main application
│   ├── frontend-api.js # API client
│   └── server.js     # Static file server
├── docs/             # Documentation
└── .gitignore
```

## Быстрый старт

### Backend

```bash
cd backend
npm install
npm start
```

Backend запустится на `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
node server.js
```

Frontend будет доступен на `http://localhost:9000`

## Документация

Подробная документация доступна в папке `docs/`:
- `QUICK_START.md` - Быстрый старт
- `PROJECT_OVERVIEW.md` - Обзор проекта
- `INTEGRATION_SUMMARY.md` - Интеграция
- `ACCESS_INSTRUCTIONS.md` - Инструкции по доступу

## API

Доступны следующие API endpoints:
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Авторизация
- `GET /api/projects` - Список проектов
- `POST /api/projects` - Создание проекта
- `GET /api/projects/:id` - Детали проекта
- `PUT /api/projects/:id` - Обновление проекта
- `DELETE /api/projects/:id` - Удаление проекта
- `POST /api/projects/:id/favorite` - Добавить в избранное
- `DELETE /api/projects/:id/favorite` - Убрать из избранного

## Технологии

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- База данных: PostgreSQL
- Аутентификация: JWT

## Лицензия

MIT
