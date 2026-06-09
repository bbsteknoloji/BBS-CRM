# BBS CRM — Local Setup

Yerel geliştirme için kurulum ve çalıştırma adımları.

**Gereksinimler:** Node.js 20+, PostgreSQL, npm.

---

## 1. Kurulum

```bash
npm install
```

---

## 2. Prisma

`.env` dosyasında `DATABASE_URL` tanımlı olmalıdır (bkz. Notlar).

```bash
npx prisma generate
npx prisma db push
```

**Opsiyonel** (örnek veri + admin):

```bash
npm run db:seed
```

---

## 3. Çalıştırma

```bash
npm run dev
```

---

## 4. URL

**http://localhost:3000**

Giriş: `/login`

---

## 5. Notlar

- **`.env` / `.env.example`** — Kökte `.env.example` var. Yerelde `.env` oluşturup değerleri doldurun. **Zorunlu:** `DATABASE_URL`, `AUTH_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET` (boşsa terminalde `MissingSecret` — sayfa açılmaz).
- **Site hiç açılmıyorsa** — Terminalde `npm run dev` çalışıyor olmalı; `Ready` yazısını görün. Tarayıcı: `http://localhost:3000` (https değil). `.env` değiştirdikten sonra dev sunucusunu **Ctrl+C** ile durdurup yeniden başlatın.
- **PostgreSQL** — Veritabanı sunucusu çalışır olmalı; `DATABASE_URL` ile erişilebilir bir `bbs_crm` (veya seçtiğiniz) veritabanı gerekir.
- **`/public/logo.png`** — Şu an repo içinde **yok**. PDF ve marka görünümü için dosyayı `public/logo.png` olarak eklemeniz gerekir; yoksa logo PDF’te görünmez (metin alanları çalışmaya devam eder).
- **Paket yöneticisi** — Ana akış **npm** (`package-lock.json`). **npm ve pnpm birlikte kullanmayın**; karışınca `node_modules/.ignored` oluşur ve Tailwind/CSS yüklenmez (sayfa düz HTML gibi görünür).
- **CSS düz / menü üst üste** — `npm run dev` durdurun → `node_modules` ve `.next` klasörlerini silin → yalnızca `npm install` → `npx prisma generate` → `npm run dev`.
- **`dev` script** — `package.json` içinde `"dev": "next dev"` tanımlı; doğru, değiştirmeyin.

Bu README local setup ve production deployment bilgilerini içerir; PDF pipeline, UI ve uygulama mimarisine dokunmaz.

---

## 6. Scripts bilgisi (`package.json`)

### Geliştirme

| Script | Komut |
|--------|--------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `next lint` |

### Veritabanı (`db:*`)

| Script | Komut |
|--------|--------|
| `db:generate` | `prisma generate` |
| `db:migrate` | `prisma migrate dev` |
| `db:migrate:deploy` | `prisma migrate deploy` |
| `db:seed` | `prisma db seed` |
| `db:studio` | `prisma studio` |
| `db:validate` | `prisma validate` |

---

## Hızlı başlangıç

```bash
npm install
# .env.example → .env düzenleyin
npx prisma generate
npx prisma db push
npm run db:seed    # opsiyonel
npm run dev
```

Tarayıcı: **http://localhost:3000**

---

## 7. Production Deployment (VPS + PostgreSQL)

### Gereksinimler

- Ubuntu 22.04 VPS (Hostinger veya benzeri)
- Node.js 20+ (LTS)
- PostgreSQL 15+
- LibreOffice (DOCX→PDF dönüşümü için)
- PM2 (`npm install -g pm2`)

### Adımlar

```bash
# 1. Repoyu VPS'e klonla
git clone <repo-url> /var/www/bbs-crm
cd /var/www/bbs-crm

# 2. Bağımlılıkları yükle
npm install --omit=dev

# 3. .env oluştur ve doldur
cp .env.example .env
nano .env   # DATABASE_URL, AUTH_SECRET, NEXTAUTH_SECRET, APP_URL zorunlu

# 4. Prisma client üret ve migration uygula
npx prisma generate
npx prisma migrate deploy

# 5. Admin kullanıcı oluştur (ilk kurulumda)
npm run db:seed

# 6. Build al
npm run build

# 7. PM2 ile başlat
pm2 start npm --name bbs-crm -- start
pm2 save
pm2 startup

# 8. Nginx reverse proxy (port 3000 → 80/443)
# /etc/nginx/sites-available/bbs-crm
# proxy_pass http://127.0.0.1:3000;
```

### Zorunlu ENV değerleri (production)

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | PostgreSQL bağlantı URL'i |
| `AUTH_SECRET` | Güçlü rastgele string (min 32 karakter) |
| `NEXTAUTH_SECRET` | AUTH_SECRET ile aynı değer |
| `AUTH_URL` | Uygulamanın tam URL'i (https://...) |
| `NEXTAUTH_URL` | AUTH_URL ile aynı değer |
| `APP_URL` | Uygulamanın tam URL'i |
| `UPLOAD_DIR` | Mutlak dosya yolu, web root dışında |

### AUTH_SECRET üretmek için

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### LibreOffice kurulumu (Ubuntu)

```bash
sudo apt update && sudo apt install -y libreoffice
```

### Güncelleme

```bash
git pull
npm install --omit=dev
npx prisma migrate deploy
npm run build
pm2 restart bbs-crm
```
