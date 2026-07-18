# Деплой

API + PostgreSQL + Caddy живут на VPS в Docker; web — статика на Vercel. `app.your-domain.com` и `api.your-domain.com` должны быть поддоменами **одного** домена — refresh-cookie выставлен с `sameSite: 'strict'`, а это требование одного registrable domain (кросс-доменные поддомены — ок, кросс-сайтовые домены — нет).

## 1. VPS: сервер и DNS

1. Поднять VPS (Ubuntu 22.04+), установить Docker и Docker Compose plugin:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
2. В DNS-панели домена добавить A-записи, указывающие на IP VPS:
   - `api.your-domain.com` → `<VPS_IP>`
3. Открыть порты 80 и 443 в файрволе VPS (нужны Caddy для HTTP-01/TLS):
   ```bash
   ufw allow 80,443/tcp
   ```

## 2. API + DB на VPS

```bash
git clone <repo-url> && cd webstudio-crm
cp .env.prod.example .env.prod
nano .env.prod   # POSTGRES_*, JWT_*_SECRET (openssl rand -hex 64), API_DOMAIN, CORS_ORIGIN
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Что происходит при старте:

- `db` — Postgres 16 с volume `db_data` (данные переживают пересоздание контейнера).
- `api` — собирается multi-stage Dockerfile'ом (`apps/api/Dockerfile`); `docker-entrypoint.sh` перед запуском накатывает `prisma migrate deploy`, затем стартует `node dist/main.js`.
- `caddy` — слушает 80/443, сам получает и продлевает TLS-сертификат для `API_DOMAIN`, проксирует на `api:3000`.

Проверить:

```bash
curl https://api.your-domain.com/api/health
```

Обновление после `git pull`:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build api
```

Первичные данные (демо-пользователи и т.д.), если нужны на проде — `prisma db seed` рассчитан на `ts-node` и исходники, которых в слим-раннтайме нет, поэтому в проде запускаем уже скомпилированный сид напрямую:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api node dist/prisma/seed.js
```

## 3. Web на Vercel

1. Импортировать репозиторий в Vercel, **Root Directory** — `apps/web`. Vercel сам определит Vite-проект (`build`, `dist`).
2. Project Settings → Environment Variables:
   - `VITE_API_URL` = `https://api.your-domain.com/api`
3. Project Settings → Domains: добавить `app.your-domain.com`, указать CNAME на `cname.vercel-dns.com` в DNS-панели домена.
4. Задеплоить (push в `main` триггерит прод-деплой; PR получают preview-деплои автоматически).

`apps/web/vercel.json` уже настроен на SPA-фолбэк (все пути отдают `index.html` — иначе прямые ссылки на `/deals/:id` будут 404).

## 4. Локальная проверка прод-стека

Без реального домена: Caddy на `localhost` сам выдаёт себя внутренний (self-signed) сертификат вместо публичного.

```bash
cp .env.prod.example .env.prod
# в .env.prod: API_DOMAIN=localhost, CORS_ORIGIN=https://localhost
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
curl -k https://localhost/api/health
```

## Секреты в GitHub

Для CI секреты не нужны — тесты используют временную Postgres-service и тестовые JWT-секреты, деплой в этом workflow не выполняется. Если позже добавите auto-deploy по SSH, секреты (`VPS_HOST`, `VPS_SSH_KEY`, …) кладите в Settings → Secrets and variables → Actions.
