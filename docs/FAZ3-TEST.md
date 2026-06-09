# Faz 3 — Teklif Modülü Test Senaryoları

## Kurulum

```bash
npx prisma migrate deploy   # veya migrate dev
npx prisma generate
npx prisma db seed
npm run dev
```

`public/logo.png` ekleyerek PDF’te firma logosu görünür (opsiyonel).

---

## Durum geçişleri

| Mevcut | İzin | Aksiyon | Yeni |
|--------|------|---------|------|
| DRAFT | write | Gönder | SENT |
| SENT | approve | Onayla | APPROVED |
| SENT | approve | Reddet | REJECTED |
| SENT | write | Revizyona al | REVISION |
| REVISION | write | Yeniden gönder | SENT |
| APPROVED | approve | Sözleşmeye dönüştür | CONVERTED |

Geçersiz geçişler hata mesajı döner.

---

## Test akışı (admin)

1. `/quotes` — demo teklif `TEK-2026-0001` (SENT).
2. Detay → **Onayla** → APPROVED.
3. **PDF oluştur** → Dosyalar sekmesinde sürüm listesi.
4. **PDF önizle** — yeni sekmede PDF.
5. **Sözleşmeye dönüştür** → sözleşme no üretilir (Faz 4 detay sayfası sonra).
6. Teklif durumu CONVERTED, sözleşme linki görünür.

## Yeni teklif

1. `/quotes/new` — müşteri + kalemler.
2. Otomatik toplam hesaplama.
3. Kaydet → DRAFT detay.
4. Gönder → SENT.

## Revizyon

1. SENT teklif → **Revizyona al** → REVISION, v+1.
2. Düzenle → kalemleri değiştir.
3. **Yeniden gönder** → SENT.
4. Revizyonlar sekmesinde snapshot.

---

## Yetkiler

- `quote:read` — liste/detay/PDF önizle
- `quote:write` — oluştur, düzenle, gönder, revizyon, PDF üret
- `quote:approve` — onay, red, dönüştürme
