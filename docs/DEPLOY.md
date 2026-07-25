# Deploy — VPS + Docker

Stack: **Caddy** (HTTPS) → **Next.js** → **PostgreSQL**. Domain contoh: `smhcloud.my.id`.

## Prasyarat VPS

- Ubuntu 22.04/24.04, **minimal 2 GB RAM**
- DNS: `A` record `smhcloud.my.id` (+ `www`) → IP VPS
- Port **80** dan **443** terbuka
- Docker Engine + Compose plugin

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# logout/login
docker compose version
```

## Deploy pertama

```bash
git clone <repo-url> smh && cd smh
cp .env.example .env
nano .env   # POSTGRES_PASSWORD, API_KEY_SECRET, SEED_*
```

Password di `DATABASE_URL` harus sama dengan `POSTGRES_PASSWORD`.

Edit `docker/Caddyfile` jika domain bukan `smhcloud.my.id`.

```bash
docker compose up -d --build
docker compose logs -f web
```

Buka: `https://smhcloud.my.id`

### Seed admin (sekali)

```bash
docker compose run --rm migrate npx tsx prisma/seed.ts
```

## Update

```bash
git pull
docker compose up -d --build
```

Service `migrate` menjalankan `prisma migrate deploy` sebelum `web` start.

## EA / Controller

- `ApiBaseUrl` = `https://smhcloud.my.id`
- MT5 → Allow WebRequest → `https://smhcloud.my.id`

## Backup DB

```bash
docker compose exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
```

## Perintah berguna

| Perintah | Fungsi |
|----------|--------|
| `docker compose ps` | Status |
| `docker compose logs -f web` | Log app |
| `docker compose restart web` | Restart app |
| `docker compose down` | Stop (volume tetap) |

## Catatan

- Volume: `postgres_data`, `app_data` (banner JSON), `app_banners` (upload)
- Jangan commit `.env`
- Checklist go-live: `docs/HANDOFF.md` §4.3
