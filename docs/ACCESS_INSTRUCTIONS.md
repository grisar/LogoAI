# 🚀 Доступ к LogoAI Frontend

## ✅ Серверы работают!

### Backend (API)
- 📍 URL: http://172.24.254.145:3000/
- 🔌 Port: 3000
- ✅ Статус: Работает

### Frontend (Web UI)
- 📍 URL: http://172.24.254.145:9000/
- 🔌 Port: 9000
- ✅ Статус: Работает

---

## 📱 Как открыть фронтенд

### Способ 1: Через веб-сервер (Рекомендуется)

1. **Запустите фронтенд сервер:**

```bash
cd /var/www/html/frontend
python3 -m http.server 9000 --bind 0.0.0.0
```

2. **Откройте в браузере:**
   - http://172.24.254.145:9000/
   - Или http://localhost:9000/ (если открываете на том же сервере)

### Способ 2: Прямое открытие файла

1. **Откройте файл напрямую:**
   ```bash
   xdg-open /var/www/html/frontend/index.html
   ```

2. **Или скопируйте файл и откройте в браузере:**
   ```bash
   cp /var/www/html/frontend/index.html ~/logoai.html
   cp /var/www/html/frontend/frontend-api.js ~/
   # Откройте ~/logoai.html в браузере
   ```

---

## 🔧 Если сервер не работает

### Проверьте статус:

```bash
# Проверить, запущен ли сервер
ps aux | grep "python3.*9000"

# Проверить порт
ss -tlnp | grep 9000

# Проверить лог
cat /tmp/frontend_persistent.log
```

### Перезапустите сервер:

```bash
# Остановить старый процесс
killall python3

# Запустить новый
cd /var/www/html/frontend
python3 -m http.server 9000 --bind 0.0.0.0
```

### Или используйте скрипт:

```bash
/usr/local/bin/start-frontend.sh
```

---

## 📁 Структура файлов

```
/var/www/html/frontend/
├── index.html           # Главная страница фронтенда
├── frontend-api.js      # API клиент
└── server.js            # Node.js сервер (альтернатива)
```

---

## 🌐 Доступ извне

Если вы хотите получить доступ с другого компьютера:

1. **Проверьте firewall:**
```bash
firewall-cmd --add-port=9000/tcp --permanent
firewall-cmd --reload
```

2. **Используйте публичный IP:**
   - Откройте: http://ВАШ_IP:9000/

---

## 🎨 Функционал

После открытия фронтенда вы сможете:

- ✅ Регистрация и вход
- ✅ Создание логотипов через FLUX.1
- ✅ Управление проектами
- ✅ Избранные логотипы
- ✅ Подписки и тарифы
- ✅ Настройки профиля

---

## 🆘 Возможные проблемы

### Ошибка "Connection refused"
- Убедитесь, что сервер запущен: `ps aux | grep python3`
- Проверьте порт: 9000

### CORS ошибки
- Убедитесь, что backend работает на порту 3000
- Проверьте файл .env: FRONTEND_URL=http://172.24.254.145:9000

### Генерация не работает
- Проверьте REPLICATE_API_TOKEN в backend/.env
- Посмотрите логи backend: tail -f /root/figma/backend/logs/*.log

---

## 📝 Быстрый старт

```bash
# 1. Запустите фронтенд
cd /var/www/html/frontend
python3 -m http.server 9000 --bind 0.0.0.0

# 2. Откройте в браузере
# http://172.24.254.145:9000/

# 3. Зарегистрируйтесь и создавайте логотипы!
```

---

**Создано:** 2025-05-20
**Статус:** ✅ Работает
