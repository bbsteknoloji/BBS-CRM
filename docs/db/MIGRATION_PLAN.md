# Migration Planı — BBS CRM Faz 0

**Hedef ortam:** Hostinger VPS · PostgreSQL 15+ · Prisma Migrate

---

## 1. Ön koşullar (VPS)

```bash
# PostgreSQL kurulumu ve veritabanı
sudo -u postgres psql <<'EOF'
CREATE USER bbs_user WITH ENCRYPTED PASSWORD 'GÜÇLÜ_ŞİFRE';
CREATE DATABASE bbs_crm OWNER bbs_user;
CREATE DATABASE bbs_crm_shadow OWNER bbs_user;
GRANT ALL PRIVILEGES ON DATABASE bbs_crm TO bbs_user;
GRANT ALL PRIVILEGES ON DATABASE bbs_crm_shadow TO bbs_user;
EOF
```

- `pg_trgm` extension (arama — Faz 1 SQL migration ile eklenecek):

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## 2. Migration stratejisi

| Ortam | Komut | Not |
|--------|--------|-----|
| **Geliştirme (ilk kurulum)** | `npx prisma migrate dev --name init` | Shadow DB gerekir |
| **Staging / Production** | `npx prisma migrate deploy` | Downtime minimal; backup önce |
| **Schema drift kontrolü** | `npx prisma migrate status` | CI/CD adımı |
| **Client üretimi** | `npx prisma generate` | Her deploy sonrası |

### Migration dosya sırası (önerilen)

| # | Migration adı | İçerik |
|---|----------------|--------|
| `20260101000000_init` | `init` | Tüm tablolar, enumlar, FK, index (schema.prisma) |
| `20260102000000_pg_trgm` | `pg_trgm` | `CREATE EXTENSION pg_trgm` + müşteri arama index (Faz 1) |

Faz 0 yalnızca **`init`** migration üretir.

---

## 3. İlk kurulum adımları (geliştirici)

```bash
# 1. Bağımlılıklar (proje iskeleti eklendikten sonra)
npm install

# 2. Ortam
cp .env.example .env
# DATABASE_URL ve SHADOW_DATABASE_URL düzenleyin

# 3. İlk migration oluştur ve uygula
npx prisma migrate dev --name init

# 4. Seed
npx prisma db seed

# 5. Doğrulama
npx prisma studio
```

---

## 4. Production deploy (Hostinger VPS)

```bash
# Deploy öncesi — zorunlu yedek
pg_dump -U bbs_user -h 127.0.0.1 -Fc bbs_crm > backup_$(date +%Y%m%d_%H%M).dump

# Migration (uygulama durdurulmuş veya maintenance modunda)
npx prisma migrate deploy
npx prisma generate

# Seed — SADECE ilk kurulumda bir kez
# NODE_ENV=production iken SEED çalıştırmayın; manuel admin oluşturun
```

### Rollback politikası

- Prisma **otomatik down migration** üretmez.
- Rollback: önceki `pg_dump` restore veya elle ters migration SQL yazımı.
- Kritik değişiklikler için: staging’de `migrate deploy` test → production.

---

## 5. Soft delete uygulama notu

Aşağıdaki tablolarda `deleted_at IS NULL` filtresi uygulama katmanında zorunlu:

- `users`, `customers`, `customer_contacts`, `customer_addresses`
- `activities`, `tasks`, `products`, `quotes`, `contracts`, `contract_renewals`, `documents`

Prisma middleware (Faz 1):

```ts
// örnek: findMany → where: { deletedAt: null } otomatik
```

---

## 6. Index ve performans kontrol listesi

- [ ] `customers.tax_number` unique — B2B tekillik
- [ ] `customers(deleted_at)`, `quotes(customer_id, status)` composite
- [ ] `contracts(end_date)` — bitiş uyarı sorguları
- [ ] `activities(customer_id, occurred_at DESC)` — timeline
- [ ] `audit_logs(created_at DESC)` — admin log
- [ ] 5.000+ müşteri sonrası: `EXPLAIN ANALYZE` ile liste sorguları

---

## 7. CI/CD önerisi (Faz 1+)

```yaml
# örnek adımlar
- run: npx prisma validate
- run: npx prisma migrate diff --from-migrations ... # drift
- run: npx prisma migrate deploy  # staging only
```

---

## 8. Güvenlik

- `bbs_user` uygulama için minimum yetki (CRUD only, superuser değil)
- `.env` asla repoya commit edilmez
- Production `SEED_ADMIN_PASSWORD` kullanılmaz
- Upload dizini web’den doğrudan servis edilmez (nginx internal alias veya signed route)

---

## 9. Sonraki migration’lar (planlı)

| Faz | Migration | Açıklama |
|-----|-----------|----------|
| 1 | `add_customer_search` | `pg_trgm` + GIN index `legal_name`, `trade_name` |
| 2 | `quote_approval` | Onay tablosu (çok kademeli onay gerekirse) |
| 3 | `notification_outbox` | Async e-posta kuyruğu |
| 4 | `report_jobs` | Büyük export async |

Faz 0 kapsamı **`init` only**.
