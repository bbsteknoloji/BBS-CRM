# Veritabanı Yapısı — BBS CRM

## Modül haritası

```
┌─────────────────────────────────────────────────────────────────┐
│                         AUTH & RBAC                              │
│  users ──┬── user_roles ── roles ── role_permissions ── permissions │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────┐
│              CRM (B2B)            │                             │
│  customers ──┬── customer_contacts                              │
│              ├── customer_addresses                             │
│              ├── activities (TIMELINE)                          │
│              └── tasks                                          │
└───────────────────────────────────┼─────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │         SALES             │         CONTRACTS          │
        │  products                 │  contracts                   │
        │  quotes ── quote_line_items│  ├── contract_line_items   │
        │       │                   │  ├── contract_renewals       │
        │       └──[CONVERT]───────►│  └── (optional quoteId)    │
        └───────────────────────────┴───────────────────────────┘
                                    │
┌───────────────────────────────────┴─────────────────────────────┐
│  documents ── document_links (polymorphic)                     │
│  notifications · audit_logs · number_sequences · settings      │
└─────────────────────────────────────────────────────────────────┘
```

## Tablo listesi (22 tablo)

| Tablo | Amaç |
|-------|------|
| `users` | Email + şifre kimlik doğrulama |
| `roles` | SUPER_ADMIN, ADMIN, SALES, VIEWER |
| `permissions` | İnce taneli izin slug |
| `user_roles` | Kullanıcı ↔ rol |
| `role_permissions` | Rol ↔ izin |
| `customers` | B2B firma (tax_number unique) |
| `customer_contacts` | İletişim kişileri |
| `customer_addresses` | Adresler |
| `activities` | Timeline (tüm modüller) |
| `tasks` | Görev yönetimi |
| `products` | Teklif/sözleşme kataloğu |
| `quotes` | Satış teklifi |
| `quote_line_items` | Teklif kalemleri |
| `contracts` | Sözleşme (bağımsız veya tekliften) |
| `contract_line_items` | Sözleşme kalemleri |
| `contract_renewals` | Yenileme kayıtları |
| `documents` | Dosya metadata (local path) |
| `document_links` | Dosya ↔ entity bağlantısı |
| `notifications` | In-app bildirim |
| `audit_logs` | Değişiklik izi |
| `number_sequences` | TEK-2026-0001 üretimi |
| `settings` | Sistem ayarları (key-value) |

## İş kuralları (DB düzeyi)

| Kural | Uygulama |
|-------|----------|
| Sadece B2B | `customers`: legal_name + tax_number zorunlu; bireysel tip yok |
| Teklif → sözleşme | `quotes.converted_contract_id` ↔ `contracts` (1:0..1) |
| Bağımsız sözleşme | `contracts.quote_id` nullable (şemada sourceQuote ilişkisi) |
| Timeline | `activities.customer_id` zorunlu; quote/contract/task opsiyonel FK |
| Soft delete | `deleted_at` + uygulama filtresi |
| Audit | `created_by_id`, `updated_by_id`, `created_at`, `updated_at` |
| Dosya | `documents.relative_path` + `storage_key` (VPS local) |
| Numara | `number_sequences` (type + year unique) |

## Enum özeti (18)

`UserStatus`, `RoleCode`, `CustomerStatus`, `AddressType`, `ActivityType`, `TaskStatus`, `TaskPriority`, `QuoteStatus`, `ContractStatus`, `ContractRenewalStatus`, `ProductType`, `Currency`, `DocumentStatus`, `DocumentEntityType`, `NotificationType`, `NotificationChannel`, `NumberSequenceType`, `SettingValueType`, `AuditAction`

## Local storage dizin yapısı (VPS)

```
/var/www/bbs-crm/storage/uploads/
├── customers/{customerId}/{uuid}-{filename}
├── quotes/{quoteId}/{uuid}-{filename}
├── contracts/{contractId}/{uuid}-{filename}
└── tasks/{taskId}/{uuid}-{filename}
```

`documents.storage_key` = benzersiz anahtar  
`documents.relative_path` = `customers/...` göreli yol

## Rol → izin matrisi (seed)

| Permission | SUPER_ADMIN | ADMIN | SALES | VIEWER |
|------------|:-----------:|:-----:|:-----:|:------:|
| customer:* | ✓ | ✓ | read/write* | read |
| quote:* | ✓ | ✓ | read/write/send | read |
| contract:* | ✓ | ✓ | read/write | read |
| task:* | ✓ | ✓ | read/write | read |
| document:upload | ✓ | ✓ | ✓ | — |
| report:export | ✓ | ✓ | — | — |
| settings:manage | ✓ | partial | — | — |
| audit:read | ✓ | ✓ | — | — |
| user:manage | ✓ | — | — | — |

\* SALES: uygulama katmanında row-level (`assigned_to_id`) — Faz 1

## İlişki kartları

- **Customer 1—N** Quote, Contract, Activity, Task, Contact, Address  
- **Quote 1—N** QuoteLineItem · **0..1** Contract (converted)  
- **Contract N—1** Customer · **0..1** source Quote · **0..1** parent Contract  
- **Document N—N** Entity via DocumentLink (polymorphic entityType + entityId)
