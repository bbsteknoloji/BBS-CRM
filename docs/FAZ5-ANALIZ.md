# Faz 5 — BBS Operasyon Platformu Analiz Raporu

**Tarih:** 2026-06-04  
**Durum:** Analiz / onay bekliyor — **kod yazılmayacak** (bu faz onayı sonrası)  
**Hazırlayan:** Mevcut kod tabanı incelemesi (Faz 0–4 tamamlanmış)

---

## 0. Ürün vizyonu güncellemesi

### Eski vizyon (Faz 0–4)
Klasik B2B CRM: müşteri → teklif → sözleşme → PDF → dashboard.

### Yeni vizyon (Faz 5+)
**BBS Teknoloji Operasyon Platformu** — satış döngüsinin ötesinde saha ve teknik servis operasyonlarını tek çatı altında yöneten kurumsal SaaS.

| Operasyon kolonu | Şirket faaliyeti örneği | Mevcut durum | Faz 5 hedefi |
|------------------|-------------------------|--------------|--------------|
| Ticari | Bakım anlaşması, BT danışmanlık | Müşteri, Teklif, Sözleşme | Koru + geliştir |
| Teknik servis | Teknik servis, sunucu/network | Yok | **Servis Talepleri** |
| Saha | Saha operasyonları, kablolama, kamera | Yok | **Saha Ziyaretleri** |
| İç operasyon | Görev, doküman, rapor | Kısmi / placeholder | Tam modül |
| İçgörü | Müşteri sağlığı, KPI | Sadece sözleşme KPI | **Sağlık skoru + dashboard** |

**Kritik ilke:** Auth, Müşteri, Teklif, Sözleşme modülleri **regresyon yapılmadan** genişletilecek; yeni modüller aynı mimari kalıba oturacak (Server Actions, Prisma, Zod, AuditLog, Activity, cursor pagination).

---

## 1. Mevcut sistem envanteri (gerçek kod durumu)

### 1.1 Üretimde çalışan modüller
| Modül | Route | Servis / UI | Not |
|-------|-------|-------------|-----|
| Auth | `/login`, middleware | NextAuth JWT + RBAC | Edge-safe `auth.config.ts` |
| Müşteri | `/customers/*` | `customer-service`, detay sekmeleri | Görev oluşturma **müşteri detayında** var |
| Teklif | `/quotes/*` | state machine, PDF, dönüşüm | Tam |
| Sözleşme | `/contracts/*` | state machine, yenileme, PDF, dosya | Tam |
| Dashboard | `/dashboard` | `contract-dashboard-service` + widget | Kısmi KPI (sözleşme ağırlıklı) |

### 1.2 Şema var, UI placeholder
| Modül | Şema | UI |
|-------|------|-----|
| Görev (`Task`) | Tam model + indeksler | `/tasks` → PlaceholderPage |
| Rapor | `report:*` izinleri | `/reports` → PlaceholderPage |
| Bildirim (`Notification`) | Model + enum | Menüde yok, UI yok |

### 1.3 Paylaşılan altyapı (yeniden kullanılacak)
- **Activity** — müşteri timeline; `quoteId`, `contractId`, `taskId` FK
- **AuditLog** — `entityType` string (esnek)
- **Document + DocumentLink** — `CUSTOMER | QUOTE | CONTRACT | TASK`
- **NumberSequence** — `QUOTE`, `CONTRACT` (yeni: `SERVICE` önerilir)
- **Notification** — in-app hazır, kanal enum
- **local-storage** — Hostinger VPS uyumlu dosya yolu
- **Row-level erişim** — SALES: `assignedToId` / `createdById` (müşteri, teklif, sözleşme)

### 1.4 Türkçe / locale durumu
| Alan | Durum | Faz 5 gereksinimi |
|------|--------|-------------------|
| Menü | Türkçe ama "Dashboard" (İngilizce) | **Ana Panel** vb. |
| Form / toast | Çoğunlukla Türkçe | Tam audit gerekir |
| Tarih | `tr-TR`, `Europe/Istanbul` | `date`: ay adıyla; spec **dd.MM.yyyy** → `format` güncellemesi |
| Para | `TRY` + `toLocaleString` | Spec **₺** sembolü → `formatMoney()` merkezi helper |
| PDF | Türkçe içerik | Korunacak |
| Kod / DB enum | İngilizce | Değişmez (UI label map Türkçe) |

### 1.5 Tasarım sistemi
`globals.css`: slate tonları (--primary ~ #0F172A uyumlu). Spec accent `#0EA5E9` henüz token olarak yok. Faz 5’te **token güncellemesi** ayrı iş paketi (mevcut bileşenleri bozmamak için kademeli).

---

## 2. Boşluk analizi (hedef vs mevcut)

| Faz 5 hedefi | Mevcut | Boşluk |
|--------------|--------|--------|
| Servis Talepleri | Yok | Yeni model + modül + numara serisi |
| Saha Ziyaretleri | Yok | Yeni model + modül |
| Dosya Merkezi | Dağınık (modül detaylarında) | Birleşik arama/filtre UI |
| Müşteri sağlık skoru | Yok | Hesaplama servisi + UI |
| Dashboard yeniden tasarım | 3 kart + sözleşme widget | 6 KPI + 8 widget |
| Görev yönetimi (platform) | Müşteri alt paneli + placeholder `/tasks` | Tam liste/CRUD/durum |
| Raporlama | Placeholder | Operasyon raporları |
| Bildirimler menüsü | DB hazır | Liste + okundu işareti |
| Menü yapısı (11 madde) | 7 madde | 4 yeni route + yeniden adlandırma |

---

## 3. Yeni veritabanı analizi

### 3.1 Etkilenen mevcut tablolar (genişletme, kırılma riski düşük)

**`Activity`**
- Yeni opsiyonel FK: `serviceTicketId`, `visitRecordId`
- Yeni `ActivityType` değerleri (örnek):
  - `SERVICE_TICKET_CREATED`, `SERVICE_TICKET_UPDATED`, `SERVICE_TICKET_STATUS_CHANGED`, `SERVICE_TICKET_CLOSED`
  - `VISIT_RECORDED`, `VISIT_UPDATED`
- İndeks: `(customerId, occurredAt)`, `(serviceTicketId)`, `(visitRecordId)`

**`DocumentEntityType`**
- `SERVICE_TICKET` (zorunlu)
- `VISIT` (opsiyonel — ziyaret ekleri için)

**`NumberSequenceType`**
- `SERVICE` → önek öneri: `SRV` veya spec uyumu `SERVIS` (UI’da “Servis No”)

**`NotificationType`**
- `SERVICE_TICKET_ASSIGNED`, `SERVICE_TICKET_STATUS`, `VISIT_SCHEDULED`, `CUSTOMER_HEALTH_RISK` (öneri)

**`Customer`**
- Opsiyonel cache (performans): `healthStatus`, `healthScore`, `healthComputedAt`  
  Alternatif: sadece runtime hesaplama (Faz 5.5’te karar)

**`User`**
- Yeni relation: `assignedServiceTickets`, `visitRecords`

### 3.2 Yeni tablo: `ServiceTicket` (`service_tickets`)

| Alan | Tip | Kurallar |
|------|-----|----------|
| id | UUID PK | |
| ticketNo | VARCHAR(30) UNIQUE | `SRV-{yıl}-{0001}` seri |
| customerId | UUID FK → Customer | RESTRICT |
| contractId | UUID? FK → Contract | SetNull; aktif bakım anlaşması |
| title | VARCHAR(255) | |
| description | TEXT? | |
| priority | Enum | LOW, MEDIUM, HIGH, URGENT (`TaskPriority` ile hizalanabilir) |
| status | Enum | OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED |
| assignedUserId | UUID? FK → User | SetNull |
| openedAt | TIMESTAMPTZ | default now |
| closedAt | TIMESTAMPTZ? | CLOSED/RESOLVED’da set |
| + audit | soft delete, created/updated by | Mevcut convention |

**Durum makinesi (önerilen geçişler)**

```
OPEN → IN_PROGRESS
IN_PROGRESS → WAITING_CUSTOMER | RESOLVED
WAITING_CUSTOMER → IN_PROGRESS | RESOLVED
RESOLVED → CLOSED
CLOSED → (terminal)
```

**İndeksler (performans)**
- `(customerId, status)`
- `(assignedUserId, status)`
- `(status, openedAt DESC)`
- `(contractId)`
- `(deletedAt)`

### 3.3 Yeni tablo: `VisitRecord` (`visit_records`)

| Alan | Tip | Kurallar |
|------|-----|----------|
| id | UUID PK | |
| customerId | UUID FK | RESTRICT |
| contractId | UUID? FK | SetNull |
| userId | UUID FK → User | Saha/teknisyen |
| visitDate | DATE | Ziyaret tarihi |
| description | TEXT | Rapor gövdesi |
| result | TEXT? | Sonuç özeti |
| nextVisitDate | DATE? | Planlama |
| + audit | soft delete, created/updated by | |

**İndeksler**
- `(customerId, visitDate DESC)`
- `(userId, visitDate DESC)`
- `(nextVisitDate)` — dashboard “yaklaşan ziyaretler”
- `(contractId)`

### 3.4 Dosya merkezi — yeni tablo gerekmez (Faz 5.4)
Mevcut `documents` + `document_links` + `quote_pdf_versions` + `contract_pdf_versions` **birleşik görünüm** ile sunulur.

Önerilen read model:
- View veya servis katmanında `UNION`-tipi sorgular (entity type, id, label, path, tarih)
- Arama: `originalName`, `label`, müşteri adı (join)

### 3.5 Müşteri sağlık skoru — mantık (DB opsiyonel)

**Girdiler (mevcut tablolardan)**

| Sinyal | Kaynak | Eşik örneği |
|--------|--------|-------------|
| Aktif sözleşme | `contracts` status=ACTIVE | 0 → risk |
| Açık servis | `service_tickets` ∉ {CLOSED, RESOLVED} | ≥3 → risk; ≥1 → dikkat |
| Son saha ziyareti | `visit_records` max(visitDate) | >90 gün → dikkat; >180 → risk |
| Geciken görev | `tasks` dueAt < today, status ∉ completed | ≥1 → dikkat |
| Yaklaşan bitiş | `contracts` endDate | ≤30 gün → dikkat |

**Çıktı enum:** `HEALTHY` | `WARNING` | `RISK`  
**UI:** Sağlıklı | Dikkat | Riskli

**Öneri:** İlk sürümde **hesaplanmış alan** (servis); müşteri listesinde N+1 önlemek için batch hesaplama veya `Customer.metadata.health` JSON cache (saatlik invalidation).

### 3.6 Migration riskleri
- PostgreSQL `ALTER TYPE ... ADD VALUE` (Activity, DocumentEntityType, NumberSequence) — Faz 3/4 ile aynı pattern
- Mevcut veriye dokunulmaz; seed demo servis + ziyaret (dev)

---

## 4. Menü etkileri

### 4.1 Hedef menü (spec) vs mevcut

| Spec (TR) | Mevcut | Route önerisi | Onay |
|-----------|--------|---------------|------|
| Ana Panel | Dashboard | `/dashboard` | Başlık değişimi |
| Müşteriler | Müşteriler | `/customers` | Aynı |
| Teklifler | Teklifler | `/quotes` | Aynı |
| Sözleşmeler | Sözleşmeler | `/contracts` | Aynı |
| Servis Talepleri | — | `/service-tickets` veya `/servis` | **Yeni** |
| Saha Ziyaretleri | — | `/visits` veya `/saha-ziyaretleri` | **Yeni** |
| Görevler | Görevler (placeholder) | `/tasks` | Implement |
| Dosya Merkezi | — | `/files` | **Yeni** |
| Raporlar | Raporlar (placeholder) | `/reports` | Implement |
| Bildirimler | — | `/notifications` | **Yeni** |
| Ayarlar | Ayarlar | `/settings` | Aynı |

**Kural hatırlatması:** `navigation.ts` değişikliği kullanıcı onayı gerektirir (mevcut proje kuralı). Bu rapor onaylandıktan sonra tek commit ile yapılmalı.

### 4.2 Middleware
`PROTECTED_PREFIXES` genişletilmeli:
`/service-tickets`, `/visits`, `/files`, `/notifications`

### 4.3 Müşteri detay sekmeleri (öneri, onaylı diff)
Mevcut: Genel, İletişim, Görevler, Aktivite, Teklifler, Sözleşmeler, Dosyalar  
Eklenebilir (bozmadan):
- **Servis Talepleri** (liste + hızlı aç)
- **Saha Ziyaretleri**
- **Sağlık özeti** (Genel sekmesinde rozet veya ayrı mini kart)

---

## 5. Yetkilendirme etkileri

### 5.1 Yeni izinler (seed + `lib/permissions/types.ts`)

| Slug | Açıklama (TR seed name) |
|------|-------------------------|
| `service:read` | Servis talebi görüntüle |
| `service:write` | Servis talebi oluştur / düzenle |
| `service:assign` | Personel ata |
| `service:close` | Kapat / çözüldü işaretle |
| `visit:read` | Saha ziyareti görüntüle |
| `visit:write` | Saha ziyareti oluştur / düzenle |
| `file:read` | Dosya merkezi (birleşik) |
| `notification:read` | Bildirimler |

**Not:** `lib/permissions/types.ts` şu an seed’in **alt kümesi** (ör. `document:*`, `task:delete` JWT’de yok). Faz 5’te **types.ts ↔ seed tam senkron** yapılmalı.

### 5.2 Rol matrisi önerisi

| Rol | Faz 5 operasyon profili |
|-----|-------------------------|
| SUPER_ADMIN | Tümü |
| ADMIN | Tüm operasyon + rapor |
| SALES | Müşteri, teklif, sözleşme, görev; servis **read**; ziyaret **read** (opsiyonel) |
| **TECHNICIAN** (yeni, öneri) | `service:*`, `visit:*`, `customer:read`, `contract:read`, `task:read`, `file:read` |
| **FIELD_OPS** (yeni, öneri) | `visit:write`, `service:read`, `customer:read`, `contract:read` |
| VIEWER | Salt okunur genişletme |

**Karar noktası (onay):** Yeni roller mi, yoksa mevcut SALES/ADMIN genişletmesi mi?

### 5.3 Row-level güvenlik (servis / saha)
Müşteri/teklif/sözleşme ile **aynı SALES filtresi**:
- Teknisyen: `assignedUserId = me` OR müşteri atanmışlık
- Admin: filtre yok

---

## 6. Dashboard etkileri

### 6.1 Mevcut
- Hoş geldin / rol / izin sayısı kartları (düşük iş değeri)
- `ContractDashboardWidgets`: aktif, bu ay bitecek, süresi geçen, yenilenen, 90–7 gün kovaları

### 6.2 Hedef KPI (üst sıra — tek `Promise.all` batch)

| KPI | Veri kaynağı | Servis önerisi |
|-----|--------------|----------------|
| Toplam müşteri | `customers` deletedAt null | `dashboard-kpi-service` |
| Aktif sözleşme | `contracts` ACTIVE | mevcut contract stats |
| Bu ay bitecek sözleşmeler | `contracts` endDate in month | mevcut |
| Açık servis talepleri | `service_tickets` OPEN/IN_PROGRESS/WAITING | yeni |
| Bekleyen teklifler | `quotes` SENT (+ REVISION?) | yeni |
| Aylık sözleşme geliri | SUM(active `total`) veya aylık faturalama kuralı | **İş kuralı onayı** |

**Gelir KPI notu:** Sözleşme `total` tek seferlik mi, aylık mı? Bakım anlaşmalarında genelde **aylık MRR** gerekir. Onayda seçenek:
- A) Aktif sözleşme toplamlarının toplamı (basit)
- B) `lineItems` + süre ile normalize edilmiş aylık gelir (doğru, daha ağır)

### 6.3 Widget grid (8 blok)

| Widget | Öncelik | Bağımlılık |
|--------|---------|------------|
| Sözleşme yenileme takvimi | P1 | contracts endDate |
| Yaklaşan bitişler | P1 | mevcut |
| Son aktiviteler | P1 | activities limit 15 |
| Bekleyen teklifler | P1 | quotes |
| Açık görevler | P2 | tasks modülü |
| Servis talepleri | P1 | service_tickets |
| Riskli müşteriler | P2 | health score |
| Son saha ziyaretleri | P1 | visit_records |

**Performans:** Tek dashboard endpoint’i veya sayfa içi `Promise.all` max ~12 count/list sorgusu; her biri `select` minimal + limit.

---

## 7. Performans etkileri

| Risk | Etki | Önlem |
|------|------|-------|
| Sağlık skoru müşteri listesinde | N+1 | Batch job veya cache JSON |
| Dosya merkezi birleşik liste | Ağır join | Cursor pagination, entity type filtresi zorunlu |
| Dashboard 12+ sorgu | TTFB | `dashboard-summary-service` tek aggregate; Redis **Faz 6** |
| Activity timeline büyümesi | Yavaş müşteri detay | `take: 50`, arşiv politikası (ileri faz) |
| Enum migration | Deploy sırası | Additive migration, zero-downtime |

**İndeks özeti (yeni):** Yukarıdaki service + visit indeksleri yeterli başlangıç; 10k+ ticket sonrası `(status, priority, openedAt)` composite değerlendirilir.

---

## 8. Geliştirme sırası (onay sonrası alt fazlar)

```
5.0  Temel hazırlık (BLOCKER)
     ├─ Schema + migration + seed izinleri
     ├─ permissions types ↔ seed sync
     ├─ middleware routes
     ├─ formatMoney (₺), formatDate (dd.MM.yyyy)
     └─ Menü güncellemesi (ONAYLI)

5.1  Servis Talepleri (kritik yol)
     ├─ state machine, service, validations, actions
     ├─ Liste / detay / oluştur / durum / ata / kapat
     ├─ Activity + AuditLog
     └─ Müşteri detay sekmesi + dashboard widget

5.2  Saha Ziyaretleri
     ├─ CRUD + timeline Activity
     └─ Dashboard “son ziyaretler” + müşteri sekme

5.3  Görev modülü (platform)
     ├─ /tasks tam CRUD (müşteri paneli ile paylaşılan servis)
     └─ Dashboard açık görevler

5.4  Dosya Merkezi
     ├─ Birleşik liste API/servis
     └─ Arama, filtre, versiyon gösterimi (PDF sürümleri dahil)

5.5  Müşteri sağlık skoru
     ├─ health-service + kurallar
     └─ Liste kolonu + detay rozet + riskli müşteriler widget

5.6  Dashboard v2
     ├─ 6 KPI + 8 widget layout
     ├─ Tasarım tokenları (accent, success, warning, danger)
     └─ Eski düşük değerli kartların kaldırılması

5.7  Raporlar + Bildirimler UI
     ├─ Operasyon özet raporları (CSV export mevcut izin)
     └─ /notifications okundu işareti

5.8  Türkçe UI denetimi
     ├─ Menü, metadata title, toast, zod mesajları
     └─ PDF/rapor etiketleri

5.9  Test dokümantasyonu (FAZ5-TEST.md) + demo seed
```

**Bağımlılık grafiği:** 5.0 → 5.1 → 5.2 → 5.5 → 5.6; 5.3 paralel 5.1 sonrası; 5.4 paralel; 5.7 en son.

---

## 9. Tahmini iş yükü

| Alt faz | Kapsam | Tahmin (kişi-gün) |
|---------|--------|-------------------|
| 5.0 Temel | DB, izin, locale, menü | 2–3 |
| 5.1 Servis | Faz 4 sözleşme benzeri tam modül | 6–8 |
| 5.2 Saha | Orta modül | 3–4 |
| 5.3 Görev | Placeholder → tam | 4–5 |
| 5.4 Dosya merkezi | Read-heavy aggregate UI | 3–4 |
| 5.5 Sağlık skoru | Kural + UI | 2–3 |
| 5.6 Dashboard v2 | Layout + 12 veri kaynağı | 4–5 |
| 5.7 Rapor + bildirim | MVP | 5–6 |
| 5.8 TR denetim | Tüm yüzey | 2–3 |
| 5.9 Test + seed | | 1–2 |
| **Toplam** | | **32–43 kişi-gün** |

**Takvim:** 1 full-stack geliştirici ≈ **7–9 hafta**; 2 geliştirici ≈ **4–5 hafta** (paralel 5.1 + 5.3/5.4).

---

## 10. Onay gerektiren kararlar

1. **Route slug:** `/service-tickets` (EN) vs `/servis-talepleri` (TR URL) — SEO/okunabilirlik.
2. **Servis numarası öneki:** `SRV` vs `SERVIS`.
3. **Yeni roller:** TECHNICIAN / FIELD_OPS eklenmeli mi?
4. **Aylık sözleşme geliri KPI** hesaplama kuralı (A veya B).
5. **Menü sırası ve “Dashboard” → “Ana Panel”** — resmi onay.
6. **Sağlık skoru eşikleri** — tablo bu rapordaki örnekler mi, BBS iş kuralları mı?
7. **Görev vs servis talebi ayrımı:** İç iş görevi (`Task`) ile müşteri şikayeti (`ServiceTicket`) süreç tanımı.

---

## 11. Regresyon koruma listesi

Faz 5 geliştirmesinde **dokunulmayacak / bozulmayacak** davranışlar:

- [ ] Login / JWT / middleware auth akışı
- [ ] Müşteri CRUD, arşiv, kişiler, row-level SALES
- [ ] Teklif durum makinesi ve PDF
- [ ] Sözleşme durum makinesi, yenileme, PDF, dosya yükleme
- [ ] Teklif → sözleşme dönüşümü
- [ ] Mevcut demo seed (TEK/SOZ) geriye uyumlu migration

---

## 12. Sonuç

Mevcut kod tabanı Faz 5 için **sağlam bir omurgaya** sahip (Activity, Audit, Document, RBAC, operasyon modülü kalıbı). Eksik olan parçalar **servis**, **saha**, **birleşik dosya**, **sağlık skoru** ve **operasyon odaklı dashboard**; görev ve rapor ise şemada hazır ama UI’da tamamlanmamış.

**Önerilen başlangıç:** Alt faz **5.0 + 5.1** (servis talepleri) — BBS’nin teknik servis ve bakım anlaşması operasyonuna doğrudan değer katar; saha ve dashboard bu omurgaya bağlanır.

---

*Bu belge onaylandıktan sonra kod geliştirmesine geçilecektir.*
