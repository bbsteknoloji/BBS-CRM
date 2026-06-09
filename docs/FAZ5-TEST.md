# Faz 5 — Test Senaryoları

## Kurulum

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev
```

## Faz 5.0 — Temel

- [ ] Menü Türkçe: Ana Panel, Servis Talepleri, Saha Ziyaretleri, Dosya Merkezi, Bildirimler
- [ ] Tarih formatı `dd.MM.yyyy` (liste/detay)
- [ ] Para formatı `₺` (Ana Panel gelir KPI)
- [ ] Yeni roller seed: Teknisyen, Saha Operasyon
- [ ] Ana Panel: 6 KPI + widget’lar

## Faz 5.1 — Servis Talepleri

### Liste `/service-tickets`

- [ ] Demo `SRV-2026-0001` görünür
- [ ] Filtre: durum, öncelik, müşteri, arama
- [ ] Cursor pagination

### Oluşturma

- [ ] `/service-tickets/new` — otomatik SRV-2026-0002
- [ ] Müşteri detay → Servis Talepleri → Yeni servis talebi

### Durum akışı

| Mevcut | Aksiyon | Yeni |
|--------|---------|------|
| OPEN | İşleme al | IN_PROGRESS |
| IN_PROGRESS | Müşteri bekle | WAITING_CUSTOMER |
| WAITING_CUSTOMER | Devam et | IN_PROGRESS |
| IN_PROGRESS | Çözüldü | RESOLVED |
| RESOLVED | Kapat | CLOSED |

### Diğer

- [ ] Personel ata (`service:assign`)
- [ ] Activity + Audit sekmeleri
- [ ] Müşteri sağlık skoru servis sonrası güncellenir

## Yetkiler

- `service:read` — liste/detay
- `service:write` — oluştur, düzenle, durum (kapat hariç)
- `service:assign` — personel ata
- `service:close` — RESOLVED → CLOSED

Satış: read/write/assign. Teknisyen: tam servis + saha yazma.

## Regresyon

- [ ] Müşteri / Teklif / Sözleşme CRUD ve PDF çalışır
- [ ] Teklif → sözleşme dönüşümü
