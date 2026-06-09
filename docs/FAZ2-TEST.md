# Faz 2 — Müşteri Modülü Test Senaryoları

## Ön koşul

```bash
npx prisma db seed
npm run dev
```

| Hesap | E-posta | Şifre |
|-------|---------|-------|
| Admin | SEED_ADMIN_EMAIL (.env) | SEED_ADMIN_PASSWORD |
| Satış | satis@sirketiniz.com | Sales123! |

---

## 1. Liste ve filtreler

1. `/customers` — 8 demo müşteri görünmeli.
2. Toplam kayıt sayısı üstte doğru olmalı.
3. Arama: `Anadolu` → tek kayıt.
4. Durum: `Aktif` → filtrelenmiş liste.
5. Şehir: `İstanbul` → filtre.
6. Sorumlu: Admin veya Satış temsilcisi.
7. **Daha fazla yükle** — cursor pagination (20+ kayıt ekledikten sonra test edin).
8. **Temizle** — filtreler sıfırlanmalı.

## 2. Oluşturma

1. `customer:write` ile **Yeni müşteri**.
2. Zorunlu alanları boş bırak → toast / validasyon hatası.
3. Geçersiz vergi no (harf) → hata.
4. Geçerli form → detay sayfasına yönlendirme.
5. Aktivite sekmesinde «Müşteri oluşturuldu» görünmeli.

## 3. Detay sekmeleri

1. **Genel** — firma bilgileri.
2. **İletişim** — kişi ekle / sil (birincil hariç).
3. **Görevler** — görev oluştur → timeline’da «Görev oluşturuldu».
4. **Aktivite** — kronolojik liste.
5. **Teklifler / Sözleşmeler** — boş mesaj veya kayıtlar.
6. **Dosyalar** — boş veya liste.

## 4. Güncelleme ve arşiv

1. **Düzenle** — alanları değiştir, kaydet.
2. Aktivite: «Müşteri güncellendi».
3. **Arşivle** — onay → `/customers` listesinde kayıt yok.

## 5. Yetkilendirme

1. **VIEWER** — liste/detay okur, «Yeni müşteri» yok.
2. **SALES** (`satis@`) — yalnızca kendine atanan + oluşturduğu müşteriler (row-level).

## 6. Mobil

1. Dar ekranda filtreler alt alta, tablo yatay kaydırma.
2. Detay sekmeleri yatay scroll.

---

## AuditLog doğrulama

```sql
SELECT action, entity_type, entity_id, created_at
FROM audit_logs
WHERE entity_type = 'customer'
ORDER BY created_at DESC
LIMIT 10;
```

Beklenen: `CREATE`, `UPDATE`, `SOFT_DELETE` (arşiv).
