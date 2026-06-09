# FAZ 8.1 — BBS Teknoloji Premium UI: Bileşen Haritalandırması

**Durum:** Onay bekliyor — bu doküman onaylanmadan kod yazılmayacak.

**Kapsam:** Yalnızca UI/UX. Dokunulmayacak: Prisma, migration, `services/*`, server action mantığı, Zod, RBAC, Auth, API iş mantığı.

---

## 0. Kurumsal kimlik entegrasyonu (FAZ 8 öncesi)

Paylaşılacak materyaller (henüz zorunlu değil):

| Dosya / bilgi | Konum (hedef) | Zorunluluk |
|---------------|---------------|------------|
| `logo.png` | `public/logo.png` | Opsiyonel |
| `logo-dark.png` | `public/logo-dark.png` | Opsiyonel |
| Kurumsal renkler (HEX/HSL) | `src/config/brand.ts` veya `globals.css` token | FAZ 8.1’de paylaşılınca uygulanır |
| Kartvizit / antet örneği | Referans (tasarım tonu, tipografi, boşluk) | Görsel rehber |

**Kurallar:**

- Logo entegrasyonu **zorunlu değil**. Dosya yoksa `BbsLogo` → metin fallback **"BBS Teknoloji"** (mevcut `siteConfig` ile uyumlu).
- PDF üretimi logo olmadan çalışmaya devam eder (`logoPath: null` — servis katmanına dokunulmaz).
- Premium UI, paylaşılan renkler gelene kadar **geçici NOC paleti** (`#0F172A`, `#1E293B`) ile başlayabilir; kurumsal renkler geldiğinde yalnızca token güncellemesi yeterli olacak şekilde tasarlanır.
- Tasarım dili: kurumsal BT operasyon merkezi (network, sistem, sunucu, kamera, kablolama, hotspot, teknik servis, bakım sözleşmeleri) — marka bağımsız, neon/siber punk yok.

**Uygulama sırası (güncel):**

1. Kurumsal dosyalar paylaşıldığında → `brand.ts` + `public/` + token eşlemesi (UI only)
2. FAZ 8.1 `globals.css` + `components/premium/*`
3. Modül modül görsel geçiş (harita Bölüm 3)

---

## 1. Hedef mimari (özet)

```
globals.css (BBS token + utility)
    ↓
components/premium/*  ← yeni kalıcı kütüphane
    ↓
Mevcut sayfa/component import değişimi (props/data aynı)
```

FAZ 7 `components/files/*` → `premium` kütüphanesine **birleştirilecek** (silinmeyecek, sarmalanacak veya re-export).

---

## 2. GÖREV 1 — `globals.css` planı (onay sonrası)

| Token / utility | Değer / davranış |
|-----------------|------------------|
| `--background` | `#0F172A` (slate-900) — varsayılan koyu operasyon merkezi |
| `--card` | `#1E293B` (slate-800) |
| `--border` | slate-700 / düşük kontrast |
| `--primary` | kurumsal mavi (mevcut ring tonuna yakın, neon değil) |
| `--sidebar-*` | lacivert panel, FAZ 7 file-center ile uyumlu |
| `.glass-panel` | `backdrop-blur-md`, `bg-card/80`, ince border |
| `.hover-lift` | `transition` + hafif `shadow` / border vurgusu |
| shadcn | Mevcut `Card`, `Button`, `Table` HSL değişkenlerini kullanmaya devam |

**Tema varsayılanı:** `ThemeProvider` → `defaultTheme="dark"` (sistem seçeneği korunabilir).

**Kaldırılacak izole tema:** `file-center-theme.css` içeriği globals utility’ye taşınır; `/files` sayfası özel CSS dosyasına bağımlılığı kalkar.

---

## 3. GÖREV 2 — Bileşen haritası

### 3.1 Layout & kabuk

| Mevcut | Dosya | Premium karşılık | Not |
|--------|-------|------------------|-----|
| `DashboardShell` | `layout/dashboard-shell.tsx` | Aynı API, içeride `PremiumAppShell` | Arka plan gradient + min-height |
| `Sidebar` | `layout/sidebar.tsx` | `PremiumSidebar` | Logo + nav; `BbsLogo` |
| `SidebarNav` | `layout/sidebar-nav.tsx` | `PremiumNavItem` | Aktif durum, hover-lift |
| `MobileSidebar` | `layout/mobile-sidebar.tsx` | `PremiumMobileNav` | Sheet + aynı nav stili |
| `Header` / `HeaderClient` | `layout/header.tsx`, `header-client.tsx` | `PremiumPageHeader` | Breadcrumb opsiyonel, cam üst bar |
| `PageShell` | `layout/page-shell.tsx` | `PremiumContentArea` | Padding + max-width |
| `ThemeToggle` | `theme/theme-toggle.tsx` | Stil güncelleme | Mantık aynı |
| `ThemeProvider` | `theme/theme-provider.tsx` | `defaultTheme="dark"` | Sadece default |

### 3.2 Ortak / marka

| Mevcut | Premium karşılık |
|--------|------------------|
| Sidebar metin logosu | `BbsLogo` (`public/logo-dark.png`, fallback metin) |
| — | `PremiumEmptyState` (customer-empty, placeholder birleşimi) |
| — | `PremiumFilterBar` (tüm liste filtre formları) |
| — | `PremiumListPagination` (cursor pagination birleşik) |
| `ui/card` kullanımları | `PremiumCard` (KPI + widget sarmalayıcı) |
| `ui/table` + TanStack | `PremiumDataTable` (generic columns API) |
| `ui/badge` + modül badge’leri | `PremiumBadge` + domain variant’lar |

### 3.3 Ana Panel (Dashboard)

| Mevcut | Dosya | Premium karşılık |
|--------|-------|------------------|
| `KpiCard` (inline) | `dashboard/dashboard-overview.tsx` | `PremiumKpiCard` |
| Widget `Card` blokları | `dashboard-overview.tsx` | `PremiumWidgetCard` |
| `ContractDashboardWidgets` | `dashboard/contract-dashboard-widgets.tsx` | `PremiumWidgetCard` + mevcut içerik |
| Sayfa | `app/(dashboard)/dashboard/page.tsx` | Sadece import/layout; veri aynı |

### 3.4 Müşteriler

| Mevcut | Dosya | Premium karşılık |
|--------|-------|------------------|
| `CustomerTable` | `customers/customer-table.tsx` | `PremiumDataTable` + column config |
| `CustomerFilters` | `customers/customer-filters.tsx` | `PremiumFilterBar` |
| `CustomerListPagination` | `customers/customer-list-pagination.tsx` | `PremiumListPagination` |
| `CustomerStatusBadge` | `customers/customer-status-badge.tsx` | `PremiumStatusBadge` variant |
| `CustomerHealthBadge` | `customers/customer-health-badge.tsx` | `PremiumStatusBadge` variant |
| `CustomerDetailTabs` | `customers/customer-detail-tabs.tsx` | `PremiumTabNav` + mevcut sekme içeriği |
| `EntityFileList` | `files/entity-file-list.tsx` | `PremiumDataTable` compact variant |
| `CustomersTableSkeleton` | `customers/customers-table-skeleton.tsx` | `PremiumTableSkeleton` |

### 3.5 Servis Talepleri

| Mevcut | Dosya | Premium karşılık |
|--------|-------|------------------|
| `ServiceTicketTable` | `service-tickets/service-ticket-table.tsx` | `PremiumDataTable` |
| `ServiceTicketFilters` | `service-tickets/service-ticket-filters.tsx` | `PremiumFilterBar` |
| `ServiceTicketListPagination` | `service-tickets/service-ticket-list-pagination.tsx` | `PremiumListPagination` |
| `ServiceTicketStatusBadge` | `service-tickets/service-ticket-status-badge.tsx` | `PremiumStatusBadge` |
| `ServiceTicketDetailTabs` | `service-tickets/service-ticket-detail-tabs.tsx` | `PremiumTabNav` |
| `EntityFileUpload` | `files/entity-file-upload.tsx` | `PremiumFileUpload` |

### 3.6 Saha Ziyaretleri

| Mevcut | Dosya | Premium karşılık |
|--------|-------|------------------|
| `VisitTable` | `visits/visit-table.tsx` | `PremiumDataTable` |
| `VisitFilters` | `visits/visit-filters.tsx` | `PremiumFilterBar` |
| `VisitListPagination` | `visits/visit-list-pagination.tsx` | `PremiumListPagination` |
| `VisitDetailTabs` | `visits/visit-detail-tabs.tsx` | `PremiumTabNav` |

### 3.7 Dosya Merkezi (FAZ 7 → FAZ 8 birleşim)

| Mevcut | Dosya | Premium karşılık |
|--------|-------|------------------|
| `FileCenterShell` | `files/file-center-shell.tsx` | **Kaldırılır** → global tema + `PremiumContentArea` |
| `file-center-theme.css` | `files/file-center-theme.css` | **Taşınır** → `globals.css` utilities |
| `FileCenterTable` | `files/file-center-table.tsx` | `PremiumDataTable` + `FileDetailPanel` |
| `FileCenterFilters` | `files/file-center-filters.tsx` | `PremiumFilterBar` |
| `FileCenterPagination` | `files/file-center-pagination.tsx` | `PremiumListPagination` |
| `FileDetailPanel` | `files/file-detail-panel.tsx` | `PremiumDrawer` / `PremiumDetailPanel` |
| `FileModuleBadge` / `FileTypeBadge` | `files/file-*.tsx` | `PremiumBadge` domain variants |
| `FileCenterPageClient` | `files/file-center-page-client.tsx` | İnce orchestrator (premium import) |

### 3.8 Diğer listeler (aynı kalıp)

| Modül | Table | Filters | Pagination |
|-------|-------|---------|------------|
| Teklifler | `quote-table.tsx` | `quote-filters.tsx` | `quote-list-pagination.tsx` |
| Sözleşmeler | `contract-table.tsx` | `contract-filters.tsx` | `contract-list-pagination.tsx` |

Hepsi → `PremiumDataTable` + `PremiumFilterBar` + `PremiumListPagination`.

### 3.9 Formlar & detay (FAZ 8.2+)

| Alan | Mevcut | Premium (sonraki alt faz) |
|------|--------|---------------------------|
| Formlar | `*-form.tsx`, `ui/input` | `PremiumFormSection` (sarmalayıcı) |
| Detay aksiyon | `*-detail-actions.tsx` | `PremiumActionBar` |
| Login | `app/(auth)/login/page.tsx` | `PremiumAuthLayout` |
| Placeholder | `shared/placeholder-page.tsx` | `PremiumEmptyState` |

### 3.10 shadcn/ui — dokunulmayacak / ince stil

| Bileşen | Yaklaşım |
|---------|----------|
| `button`, `input`, `label`, `textarea`, `select` | globals token ile otomatik güncellenir |
| `dialog`, `sheet`, `dropdown-menu` | İsteğe bağlı 8.2 border/blur ince ayar |
| `table.tsx` | Ham primitives kalır; sayfa tabloları `PremiumDataTable` kullanır |

---

## 4. Önerilen `src/components/premium/` yapısı (GÖREV 3 önizleme)

```
premium/
  bbs-logo.tsx
  premium-card.tsx          ← KPI + widget
  premium-data-table.tsx    ← TanStack sarmalayıcı
  premium-filter-bar.tsx
  premium-list-pagination.tsx
  premium-tab-nav.tsx
  premium-badge.tsx
  premium-status-badge.tsx
  premium-detail-panel.tsx
  premium-file-upload.tsx
  premium-app-shell.tsx
  premium-sidebar.tsx
  premium-page-header.tsx
  premium-empty-state.tsx
  index.ts                  ← barrel export
```

**Kural:** Domain component’ler (`customer-table.tsx` vb.) veri/kolon tanımını tutar; render’ı `PremiumDataTable`’a devreder.

---

## 5. Logo (UI katmanı)

| Konum | Davranış |
|-------|----------|
| `PremiumSidebar`, `PremiumPageHeader`, Login | `BbsLogo` → `logo-dark.png` / `logo.png` + fallback "BBS Teknoloji" |
| PDF | **Dokunulmaz** (`pdf-data` servisleri); zaten `logoPath: null` güvenli |

---

## 6. Uygulama sırası (onay sonrası)

1. `globals.css` + `defaultTheme="dark"`
2. `premium/*` çekirdek (Card, DataTable, FilterBar, Badge, Logo)
3. Layout (Sidebar, Header, Shell)
4. Dashboard KPI/widgets
5. Liste modülleri: Müşteri → Servis → Ziyaret → Dosya Merkezi → Teklif → Sözleşme
6. Detay sekmeleri + Login
7. Placeholder sayfalar

---

## 7. Onay soruları

- [ ] Varsayılan tema **koyu** (`defaultTheme="dark"`) — evet / hayır
- [ ] Açık tema seçeneği **korunsun** (toggle) — evet / hayır
- [ ] `file-center-theme.css` **kaldırılıp** globals’a taşınsın — evet
- [ ] Domain tablolar ince wrapper kalsın (`CustomerTable` → `PremiumDataTable`) — evet
- [ ] Harita onaylandı, GÖREV 1+3 kodlamaya geçilsin

**Onay metni örneği:** `FAZ 8.1 onaylı — uygula`
