# Faz 5.2 — Saha Ziyaretleri test senaryoları

## Ön koşul

- Migration: `20260607120000_visit_no_ticket`
- `npx prisma generate`
- Dev seed: `VIS-2026-0001` (demo müşteri + SRV-2026-0001 bağlı)

## Yetkiler

| Rol | visit:read | visit:write |
|-----|------------|-------------|
| ADMIN | ✓ | ✓ |
| SALES | ✓ | — |
| TECHNICIAN / FIELD_OPS | ✓ | ✓ |
| VIEWER | ✓ | — |

## Liste `/visits`

1. ADMIN ile giriş → liste, filtre, “Yeni ziyaret” görünür.
2. SALES ile giriş → liste okunur, oluştur butonu yok.
3. Arama (visit no / müşteri adı) sonuç döndürür.
4. `?upcoming=1` → `nextVisitDate >= bugün` kayıtlar.
5. Cursor “Daha fazla yükle” ikinci sayfa getirir.

## CRUD

1. Yeni ziyaret → numara `VIS-YYYY-NNNN`, detay sayfası açılır.
2. Sözleşme + servis talebi seçimi (aynı müşteri) kaydedilir.
3. Sonraki ziyaret tarihi < ziyaret tarihi → form hatası.
4. Düzenle → alanlar güncellenir, audit + aktivite oluşur.

## Entegrasyon

1. Müşteri detay → sekme **Saha Ziyaretleri** (tarih, personel, sonuç, sonraki).
2. Servis talebi detay → sekme **Saha Ziyaretleri** (talebe bağlı kayıtlar).
3. Ana panel → **Son saha ziyaretleri** ve **Planlanan ziyaretler** widget’ları.

## Regresyon (dokunulmayan modüller)

- Giriş / müşteri / teklif / sözleşme / servis talepleri listeleri çalışır.
- Mevcut menü sırası değişmedi (Saha Ziyaretleri zaten tanımlıydı).

## Build

```bash
npx prisma generate
npm run build
```
