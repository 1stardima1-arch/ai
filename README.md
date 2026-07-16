# Балл — подготовка к ЕГЭ и ОГЭ с ИИ

Веб-приложение для подготовки к ЕГЭ и ОГЭ: задания в формате открытого банка ФИПИ,
понятная теория, ИИ-репетитор («Тьютор Макс»), аналитика прогресса, разбор ошибок,
пробные экзамены и геймификация (стрики, XP, достижения).

**Стек:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + PostgreSQL ·
Auth.js v5 (Google + VK) · Google Gemini (бесплатный ИИ) · Recharts · Framer Motion.

---

## 1. Быстрый старт (локально)

### Что понадобится

- Node.js 20+
- PostgreSQL (локально или бесплатная база в облаке — см. ниже)

### Установка

```bash
npm install
cp .env.example .env
```

Заполни `.env` (подробности по каждому пункту — в разделах ниже):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/examapp"
AUTH_SECRET="сгенерируй: openssl rand -base64 33"
NEXTAUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

VK_CLIENT_ID=""
VK_CLIENT_SECRET=""

GEMINI_API_KEY=""

ENABLE_DEMO_LOGIN="true"
```

Примени схему БД и загрузи задания:

```bash
npm run db:push
npm run db:seed
```

Запусти:

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000). Пока не настроены Google/VK,
можно войти через **демо-вход** (просто имя, без пароля) — так работает весь функционал:
прогресс, аналитика, разбор ошибок, пробные экзамены. ИИ-репетитор ответит настоящим ИИ,
как только добавишь `GEMINI_API_KEY` (см. ниже — это бесплатно и займёт 2 минуты).

Перед продакшн-деплоем поставь `ENABLE_DEMO_LOGIN="false"`, чтобы отключить демо-вход.

---

## 2. База данных (Postgres)

Нужен адрес подключения (`DATABASE_URL`). Проще всего — бесплатный облачный Postgres:

- **[Neon](https://neon.tech)** — бесплатный тариф, 2 минуты на регистрацию, готовая строка подключения в духе `postgresql://...`.
- **[Supabase](https://supabase.com)** → Project Settings → Database → Connection string.

Вставь полученную строку в `DATABASE_URL` в `.env`, затем `npm run db:push && npm run db:seed`.

---

## 3. ИИ-репетитор — Google Gemini (бесплатно)

1. Зайди на **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** и войди с Google-аккаунтом.
2. Нажми **Create API key** (можно в новом проекте).
3. Скопируй ключ и вставь в `.env`:
   ```
   GEMINI_API_KEY="твой_ключ"
   ```
4. Перезапусти `npm run dev`.

Бесплатный тариф Gemini имеет лимиты по запросам в минуту — для одного пользователя
и учебных целей этого достаточно с запасом. Модель задаётся через `GEMINI_MODEL`
(по умолчанию `gemini-2.5-flash` — быстрая и достаточно умная для объяснений).

Без ключа приложение продолжает работать: ИИ-репетитор просто отвечает вежливым
сообщением о том, что ключ не настроен — весь остальной функционал (задания, прогресс,
аналитика) не зависит от ИИ.

---

## 4. Авторизация через Google

1. Открой **[console.cloud.google.com](https://console.cloud.google.com/)** → создай новый проект (или выбери существующий).
2. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - Заполни название приложения, email — сохрани.
   - На шаге Scopes ничего добавлять не нужно (достаточно базовых `email`, `profile`).
   - Добавь себя в Test users, пока приложение не прошло верификацию Google (иначе входить смогут только тестовые аккаунты).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs — добавь:
     - для локальной разработки: `http://localhost:3000/api/auth/callback/google`
     - для продакшена: `https://твой-домен.ru/api/auth/callback/google`
4. Скопируй **Client ID** и **Client Secret** в `.env`:
   ```
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```
5. Перезапусти сервер — на `/login` появится рабочая кнопка «Продолжить с Google».

> Пока приложение не прошло верификацию Google (для этого понадобится политика
> конфиденциальности и т.д.), входить смогут только email-адреса, добавленные
> в Test users на шаге 2. Для реального запуска на пользователей — подай заявку
> на верификацию в том же разделе OAuth consent screen.

---

## 5. Авторизация через VK (VK ID)

VK в 2024–2025 годах перевёл вход через VK на новый протокол **VK ID**
(OAuth 2.1 + PKCE) — именно под него написан провайдер в этом проекте
(`src/lib/vk-provider.ts`).

1. Зайди на **[id.vk.com/business/go](https://id.vk.com/business/go)** и войди через VK.
2. Создай приложение (**Создать приложение → Веб-сайт**).
3. В настройках приложения:
   - Укажи домен сайта (для локальной разработки можно `localhost`).
   - Добавь **Redirect URL**:
     - `http://localhost:3000/api/auth/callback/vk` (разработка)
     - `https://твой-домен.ru/api/auth/callback/vk` (продакшен)
   - Включи скоуп **email**, если хочешь получать email пользователя.
4. Скопируй **Client ID** (`app id`) и **Secure key / Client Secret** в `.env`:
   ```
   VK_CLIENT_ID="..."
   VK_CLIENT_SECRET="..."
   ```
5. Перезапусти сервер — на `/login` появится кнопка «Продолжить с VK».

> ⚠️ VK периодически меняет детали VK ID API. Если вход через VK перестанет
> работать, в первую очередь проверь актуальные названия полей/эндпоинтов в
> [документации VK ID](https://id.vk.com/business/go/docs/vkid/latest/methods-reference/auth/auth-oauth2)
> и сверь с `src/lib/vk-provider.ts` — вся логика обмена кода на токен и
> получения профиля собрана в одном файле.

---

## 6. Деплой в продакшен

Проще всего — **[Vercel](https://vercel.com)**:

1. Запушь репозиторий на GitHub (уже сделано в этой ветке).
2. Импортируй проект в Vercel.
3. Добавь все переменные окружения из `.env` в Vercel → Project Settings → Environment Variables
   (используй продакшен `DATABASE_URL`, реальный `NEXTAUTH_URL` = адрес продакшена,
   `ENABLE_DEMO_LOGIN="false"`).
4. Не забудь добавить продакшен-домен в **Redirect URIs** у Google и VK (см. разделы выше).
5. После первого деплоя один раз выполни `npm run db:push && npm run db:seed`
   локально, указав в `DATABASE_URL` продакшен-базу (или настрой это как
   отдельный шаг в CI).

---

## 7. Структура проекта

```
prisma/schema.prisma        — модели БД (пользователи, предметы, задания, попытки, ...)
prisma/seed-data.ts         — контент: темы, теория, задания (ЕГЭ/ОГЭ математика и русский)
prisma/seed.ts              — загрузчик seed-данных в БД

src/auth.ts                 — конфигурация Auth.js (Google, VK, демо-вход)
src/lib/vk-provider.ts      — кастомный провайдер VK ID для Auth.js
src/lib/gemini.ts           — обёртка над Google Gemini (ИИ-репетитор)
src/lib/grading.ts          — проверка ответов
src/lib/gamification.ts     — XP, уровни, стрики
src/lib/stats.ts            — запросы для дашборда и аналитики

src/app/(marketing)         — лендинг (страница `/`)
src/app/login               — страница входа
src/app/app/*                — основное приложение (дашборд, предметы, практика,
                                пробные экзамены, разбор ошибок, аналитика, ИИ-чат, профиль)
src/app/api/ai/chat         — стриминговый эндпоинт ИИ-репетитора
```

## 8. Как добавить больше предметов и заданий

Задания хранятся структурированно в `prisma/seed-data.ts` — добавь новый объект
`SubjectSeed` (предмет → темы → задания) по образцу уже существующих и запусти
`npm run db:seed` заново. Формат заданий (номер, тип, условие, варианты ответа,
правильный ответ, объяснение) сделан максимально близким к реальному открытому
банку ФИПИ, чтобы туда было легко добавлять настоящие задания вручную.

## 9. Полезные команды

```bash
npm run dev        # разработка
npm run build       # прод-сборка
npm run db:push     # применить schema.prisma к базе
npm run db:seed     # загрузить/обновить контент
npm run db:studio   # визуальный просмотр базы (Prisma Studio)
```
