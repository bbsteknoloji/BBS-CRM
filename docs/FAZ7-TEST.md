# Faz 7 — Dosya Merkezi test senaryoları

## Ön koşul

- Migration: `20260608120000_faz7_file_permissions_activity`
- `npx prisma generate` + seed (`file:download`, `file:delete`, `FILE_VIEW`, `FILE_DOWNLOAD`)

## Duplicate kontrolü

1. Teklif PDF üret → Dosya Merkezi’nde **tek** satır (modül: Teklif, kaynak `quote_pdf_versions`).
2. Aynı PDF için `DocumentLink(QUOTE)` ana listede **görünmemeli**.

## Yetkiler

| Rol | Liste | İndir | Sil |
|-----|-------|-------|-----|
| ADMIN | ✓ | ✓ | ✓ |
| SALES | Kendi müşteri kapsamı | ✓ | — |
| VIEWER | ✓ | — (403) | — |
| TECHNICIAN | ✓ | ✓ | — |

## Dosya Merkezi `/files`

- Global arama, modül/tür/müşteri/tarih filtreleri
- Cursor “Daha fazla yükle”
- Görüntüle (yeni sekme) → Activity `FILE_VIEW`
- İndir → `file:download` + Activity `FILE_DOWNLOAD`
- Detay panel + bağlı kayda git
- Admin sil → soft delete + audit `entityType: file`

## Upload

- Servis talebi detay → Dosyalar → yükle → `SERVICE_TICKET` link
- Saha ziyareti detay → Dosyalar → yükle → `VISIT` link
- Sözleşme ek yükleme (mevcut) → `document-upload-service` + `/files/` path

## Müşteri sekmesi

- Teklif PDF + sözleşme PDF + müşteri ekleri + sözleşme manuel ekleri bir arada

## Dashboard

- “Son eklenen dosyalar” (5 kayıt) → Dosya Merkezi linki

## Storage adapter

- Varsayılan `local` — `UPLOAD_DIR` veya `storage/uploads`
- Gelecek: `STORAGE_DRIVER` genişletilebilir (`src/lib/storage/index.ts`)

## Build

```bash
npx prisma generate
npm run build
```
