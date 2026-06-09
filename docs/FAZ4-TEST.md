# Faz 4 — Sözleşme Modülü Test Senaryoları

## Kurulum

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev
```

Demo kayıtlar (dev seed):

- `SOZ-2026-0001` — ACTIVE, ~25 gün içinde bitecek (dashboard uyarıları)
- `SOZ-2026-0002` — DRAFT

---

## Durum geçişleri

| Mevcut | İzin | Aksiyon | Yeni |
|--------|------|---------|------|
| DRAFT | contract:write | Aktifleştir | ACTIVE |
| ACTIVE | contract:write | Askıya al | SUSPENDED |
| SUSPENDED | contract:write | Devam ettir | ACTIVE |
| ACTIVE | contract:write | Süresi doldu | EXPIRED |
| ACTIVE | contract:terminate | Feshet | TERMINATED |
| ACTIVE | contract:renew | Yenile | RENEWED (+ yeni DRAFT sözleşme) |

Geçersiz geçişler servis katmanında reddedilir.

---

## Liste ve filtreler

1. `/contracts` — cursor pagination, arama, durum, müşteri.
2. Süre filtresi: `expiringWithinDays=30` (aktif, 30 gün içinde bitecek).
3. **Yeni sözleşme** → form, otomatik `SOZ-{yıl}-{sıra}`.

---

## Detay sekmeleri

1. **Genel** — müşteri, tarihler, teklif bağlantısı, açıklama.
2. **Kalemler** — satır toplamları ve genel toplam.
3. **Dosyalar** — PDF üret/görüntüle/indir (sürüm), PDF/DOCX yükle (versiyon etiketi).
4. **Yenilemeler** — yenileme sonrası kayıt ve yeni sözleşme linki.
5. **Aktivite** — CONTRACT_* olayları.
6. **Audit** — CREATE, UPDATE, STATUS_CHANGE, RENEW.

---

## PDF

1. Detay → **PDF oluştur** → Dosyalar’da sürüm artar.
2. **PDF görüntüle** — `/api/contracts/[id]/pdf?inline=1`
3. **PDF indir** — attachment
4. Eski sürüm: `?versionId=...`

---

## Yenileme

1. ACTIVE `SOZ-2026-0001` → **Yenile**.
2. Yeni başlangıç/bitiş gir → yeni DRAFT sözleşme oluşur.
3. Eski kayıt RENEWED; Yenilemeler sekmesinde zincir.

---

## Teklif entegrasyonu

1. Faz 3: teklifi APPROVED → **Sözleşmeye dönüştür** → DRAFT sözleşme + quote CONVERTED.
2. Bağımsız: `/contracts/new` + opsiyonel teklif seçimi.

---

## Dashboard

1. `/dashboard` — aktif sayısı, bu ay bitecekler, süresi geçen (aktif), yenilenenler.
2. 90/60/30/15/7 gün kovaları — ilgili listeye link.

---

## Yetkiler

- `contract:read` — liste, detay, PDF görüntüleme, indirme
- `contract:write` — CRUD (taslak), durum (aktif/askı/süre doldu), PDF üret, dosya yükle
- `contract:renew` — yenileme
- `contract:terminate` — fesih

Satış rolü: read, write, renew (terminate yok — admin gerekir).

---

## API uçları

- `GET /api/contracts/[id]/pdf`
- `GET /api/contracts/[id]/documents/[documentId]`
