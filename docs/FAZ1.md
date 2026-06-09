# Faz 1 — Auth & Dashboard Shell

## Çalıştırma

```bash
cp .env.example .env
# DATABASE_URL, AUTH_SECRET düzenleyin

npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed

npm run dev
```

Giriş: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (.env)

## Test hesapları

Seed sonrası süper admin ile giriş. Diğer roller için kullanıcı + `user_roles` ekleyin.

## Route koruması

- Middleware: `/dashboard`, `/customers`, `/quotes`, `/contracts`, `/tasks`, `/reports`, `/settings`
- Sayfa: `requireAuth()` / `requirePermission()`
