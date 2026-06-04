# Интеграция Frontend с Backend API

## Обзор

Данный документ описывает, как интегрировать существующий HTML-фронтенд с созданным бэкендом API для LogoAI.

## Шаги интеграции

### 1. Добавить скрипт API в HTML

Добавьте следующую строку в `<head>` вашего HTML файла (перед существующим скриптом):

```html
<script src="backend-api.js"></script>
```

### 2. Обновить функции генерации

Замените существующие функции на новые, использующие API:

#### Заменить `startGen()` на:

```javascript
async function startGen() {
  if (!isAuthenticated()) {
    toast('Сначала войдите в аккаунт');
    show('auth');
    return;
  }

  try {
    await startLogoGeneration();
  } catch (error) {
    console.error('Generation error:', error);
    toast('Ошибка: ' + error.message);
  }
}
```

#### Заменить `saveDraft()` на:

```javascript
async function saveDraft() {
  if (!isAuthenticated()) {
    toast('Сначала войдите в аккаунт');
    show('auth');
    return;
  }

  try {
    const params = getWizardParams();
    await createProject(params);
    toast('Черновик сохранён в Мои проекты');
    setTimeout(() => show('dashboard'), 900);
  } catch (error) {
    console.error('Save draft error:', error);
    toast('Ошибка при сохранении черновика');
  }
}
```

### 3. Обновить форму входа

Замените `onclick="show('dashboard')"` на:

```javascript
async function handleLogin() {
  const email = document.getElementById('em').value;
  const password = document.getElementById('pw').value;

  try {
    const data = await login(email, password);
    toast('Добро пожаловать, ' + data.user.name + '!');
    show('dashboard');
    loadDashboardProjects();
  } catch (error) {
    toast('Ошибка входа: ' + error.message);
  }
}
```

И обновите HTML:

```html
<button class="btn btn-violet btn-block" onclick="handleLogin()">Войти</button>
```

### 4. Обновить навигацию

Добавьте проверку авторизации для защищенных страниц:

```javascript
// В начале show() функции
if (['dashboard', 'favorites', 'profile', 'subscription', 'tariffs'].includes(v)) {
  if (!isAuthenticated()) {
    show('auth');
    return;
  }

  // Load data for specific pages
  if (v === 'dashboard') {
    loadDashboardProjects();
  } else if (v === 'favorites') {
    loadFavorites();
  }
}
```

### 5. Обновить renderProjects()

Замените всю функцию `renderProjects()` на:

```javascript
async function renderProjects() {
  try {
    const projects = await getProjects({
      status: currentTab === 'all' ? undefined : currentTab,
      search: searchQuery || undefined,
      favorites: currentTab === 'favorites' ? true : undefined,
    });

    renderProjectsGrid(projects);
  } catch (error) {
    console.error('Render projects error:', error);
    const grid = document.getElementById('proj-grid');
    if (grid) {
      grid.innerHTML = '<p>Ошибка при загрузке проектов</p>';
    }
  }
}
```

### 6. Обновить toggleFav()

Замените на:

```javascript
async function toggleFav(id) {
  try {
    const newState = await toggleFavorite(id);
    await renderProjects();
    toast(newState ? 'Добавлено в избранное' : 'Убрано из избранного');
  } catch (error) {
    console.error('Toggle favorite error:', error);
    toast('Ошибка при обновлении избранного');
  }
}
```

### 7. Обновить renderFavorites()

Замените на:

```javascript
async function renderFavorites() {
  try {
    const projects = await getProjects({ favorites: true });
    const grid = document.getElementById('fav-grid');

    if (!grid) return;

    if (!projects || projects.length === 0) {
      grid.innerHTML = `
        <div class="fav-empty" style="grid-column:1/-1">
          <svg class="fav-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <h3 style="font-family:var(--font-d);font-size:var(--lg);margin-bottom:var(--s2)">Пока пусто</h3>
          <p style="color:var(--muted);margin-bottom:var(--s6)">Отмечайте логотипы сердечком — они появятся здесь.</p>
          <button class="btn btn-violet" onclick="show('dashboard')">К моим проектам</button>
        </div>`;
      return;
    }

    grid.innerHTML = projects.map((p, i) => `
      <div class="proj-card" onclick="openProject('${p.id}')" style="animation-delay:${i * 50}ms">
        <div class="proj-thumb" style="background:${p.bg || '#F4F4F6'}">
          <button class="proj-fav on" onclick="event.stopPropagation();handleFavorite('${p.id}', ${p.isFavorite})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          ${p.logos && p.logos.length > 0 ? `
            <img src="${p.logos[0].url}" alt="${p.name}" style="width:70%;height:70%;object-fit:contain">
          ` : `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:70%;height:70%;opacity:0.3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          `}
        </div>
        <div class="proj-meta">
          <div class="proj-name">${p.name}</div>
          <div class="proj-date">${formatDate(p.updatedAt)}</div>
          <div class="proj-acts">
            <span class="badge ${p.status === 'done' ? 'badge-ok' : 'badge-draft'}">${p.status === 'done' ? 'Готов' : 'Черновик'}</span>
            <button class="btn btn-sm btn-ghost">${p.status === 'done' ? 'Скачать' : 'Открыть'}</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Render favorites error:', error);
    const grid = document.getElementById('fav-grid');
    if (grid) {
      grid.innerHTML = '<p>Ошибка при загрузке избранного</p>';
    }
  }
}
```

### 8. Добавить обработчик для выхода

```javascript
function handleLogout() {
  logout();
}
```

И обновите кнопку в сайдбаре:

```html
<div class="nav-it" data-nav="logout" onclick="handleLogout()">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  Выйти
</div>
```

### 9. Обновить UI для статуса подписки

Загрузите информацию о подписке при загрузке профиля:

```javascript
async function loadSubscriptionInfo() {
  try {
    const subscription = await getSubscription();

    // Update UI elements
    const planWidget = document.querySelector('.plan-widget');
    if (planWidget && subscription.limits) {
      const { limits, stats } = subscription;

      planWidget.innerHTML = `
        <div class="plan-w-title">✦ ${getPlanName(subscription.planType)}</div>
        <div class="plan-w-sub">${limits.generationsPerMonth === -1 ? 'Безлимит' : `${stats.monthGenerations} из ${limits.generationsPerMonth}`} генераций использовано</div>
        <div class="prog-track">
          <div class="prog-fill" style="width:${getProgressPercentage(limits.generationsPerMonth, stats.monthGenerations)}%"></div>
        </div>
        ${subscription.planType !== 'pro' ? `
          <button class="btn btn-violet btn-sm btn-block" style="margin-top:var(--s3)" onclick="show('tariffs')">Перейти на ${subscription.planType === 'free' ? 'Базовый' : 'Про'}</button>
        ` : ''}
      `;
    }

    // Update user plan in sidebar
    const userPlan = document.querySelector('.u-plan');
    if (userPlan && subscription.limits) {
      const { limits, stats } = subscription;
      const genText = limits.generationsPerMonth === -1 ? 'безлимит' : `${stats.monthGenerations}/${limits.generationsPerMonth}`;
      userPlan.textContent = `${getPlanName(subscription.planType)} · ${genText}`;
    }
  } catch (error) {
    console.error('Load subscription error:', error);
  }
}

function getPlanName(planType) {
  const names = {
    free: 'Бесплатный план',
    basic: 'Базовый',
    pro: 'Про',
  };
  return names[planType] || 'Бесплатный план';
}

function getProgressPercentage(limit, used) {
  if (limit === -1) return 100;
  return Math.min((used / limit) * 100, 100);
}
```

Вызовите эту функцию при загрузке защищенных страниц:

```javascript
if (v === 'dashboard' || v === 'profile' || v === 'subscription') {
  loadSubscriptionInfo();
}
```

## Развертывание

### Backend

1. Запустите бэкенд:

```bash
cd backend
npm start
```

2. Бэкенд будет доступен на `http://localhost:3000`

### Frontend

1. Скопируйте `frontend-api.js` в ту же директорию, где находится ваш HTML файл
2. Добавьте ссылку на скрипт в HTML:

```html
<script src="frontend-api.js"></script>
```
```

3. Откройте HTML файл в браузере или через httpd

### Конфигурация

Убедитесь, что `.env` файл настроен правильно:

```bash
# Backend URL (для фронтенда)
API_BASE_URL=http://localhost:3000

# Backend конфигурация
DB_HOST=localhost
DB_PORT=5432
DB_NAME=logoai
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-secret-key
REPLICATE_API_TOKEN=your-replicate-token
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

## Тестирование

1. Откройте HTML страницу в браузере
2. Нажмите "Войти" или "Начать бесплатно"
3. Зарегистрируйтесь или войдите
4. Перейдите к генерации логотипов
5. Заполните форму (название бренда, ниша, стиль, цвета)
6. Нажмите "Сгенерировать"
7. Подождите завершения генерации
8. Выберите понравившийся вариант
9. Сохраните в избранное
10. Перейдите в "Мои проекты" и убедитесь, что логотип там отображается

## Возможные проблемы

### CORS ошибки

Если возникают CORS ошибки, убедитесь, что:
- `FRONTEND_URL` в `.env` соответствует вашему фронтенду
- Бэкенд запущен и доступен

### Ошибка аутентификации

Если возникает 401 ошибка:
- Убедитесь, что токен сохранен в localStorage
- Проверьте консоль на наличие ошибок API
- Проверьте JWT_SECRET в `.env`

### Ошибка генерации

Если генерация не работает:
- Убедитесь, что `REPLICATE_API_TOKEN` валиден
- Проверьте баланс аккаунта Replicate
- Посмотрите логи бэкенда на наличие ошибок

## Дополнительные функции

### Real-time обновления

Для real-time обновлений генерации можно использовать WebSocket (реализовано в будущем):

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'generation_progress') {
    updateProgress(data.progress, data.status);
  } else if (data.type === 'generation_complete') {
    renderResults(data.logos);
  }
};
```

### Автосохранение

Можно добавить автосохранение черновиков при изменении параметров wizard:

```javascript
let saveTimeout;

function autoSaveDraft() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    if (isAuthenticated()) {
      const params = getWizardParams();
      if (params.brandName) {
        try {
          await createProject(params);
          console.log('Draft auto-saved');
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }
    }
  }, 3000); // Save after 3 seconds of inactivity
}

// Add to wizard input listeners
document.querySelectorAll('#ws1 input').forEach((input) => {
  input.addEventListener('input', autoSaveDraft);
});
```

## Поддержка

Если возникнут вопросы или проблемы, проверьте:
1. Логи бэкенда в терминале
2. Консоль браузера на фронтенде
3. Сетевые запросы в DevTools
4. Документацию API в `API_EXAMPLES.md`