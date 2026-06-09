const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}
function p(text) {
  return new Paragraph({ children: [new TextRun(text)], spacing: { after: 120 } });
}
function bullet(prefix, rest) {
  const children = rest
    ? [new TextRun({ text: prefix, bold: true }), new TextRun(rest)]
    : [new TextRun(prefix)];
  return new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children, spacing: { after: 80 } });
}

function tRow(cells, isHeader) {
  return new TableRow({
    tableHeader: !!isHeader,
    children: cells.map((c) => new TableCell({
      borders,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      shading: isHeader ? { fill: '1E3A5F', type: ShadingType.CLEAR } : undefined,
      children: [new Paragraph({
        children: [new TextRun({ text: c, bold: !!isHeader, color: isHeader ? 'FFFFFF' : '1E293B' })],
        spacing: { after: 0 }
      })],
    }))
  });
}

function riskRow(file, risk, reason) {
  const riskColor = risk === 'KRITIK' ? 'DC2626' : risk === 'YUKSEK' ? 'D97706' : '16A34A';
  return new TableRow({
    children: [
      new TableCell({ borders, margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: file, font: 'Courier New', size: 20 })], spacing: { after: 0 } })] }),
      new TableCell({ borders, margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: risk, bold: true, color: riskColor })], spacing: { after: 0 } })] }),
      new TableCell({ borders, margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun(reason)], spacing: { after: 0 } })] }),
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]},
    ]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 34, bold: true, font: 'Arial', color: '1E293B' },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '2563EB', space: 4 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '1E3A5F' },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '2563EB' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [

      // KAPAK
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2880, after: 200 },
        children: [new TextRun({ text: 'BBS CRM', size: 52, bold: true, color: '2563EB', font: 'Arial' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
        children: [new TextRun({ text: 'UI Mimari Kok Neden Analiz Raporu', size: 36, bold: true, color: '1E293B', font: 'Arial' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 },
        children: [new TextRun({ text: 'Hazirlayan: AI Analiz  |  Tarih: Haziran 2026', size: 22, color: '64748B', font: 'Arial' })] }),

      // OZET KUTUSU
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: [new TableRow({ children: [new TableCell({
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '2563EB' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '2563EB' },
            left: { style: BorderStyle.SINGLE, size: 6, color: '2563EB' },
            right: { style: BorderStyle.SINGLE, size: 6, color: '2563EB' }
          },
          shading: { fill: 'EFF6FF', type: ShadingType.CLEAR },
          margins: { top: 200, bottom: 200, left: 240, right: 240 },
          width: { size: 9026, type: WidthType.DXA },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'YONETICI OZETI', bold: true, size: 24, color: '2563EB' })], spacing: { after: 120 } }),
            new Paragraph({ children: [new TextRun('Proje tek bir UI sistemine (Tailwind + Shadcn/UI) daniyor. Sorun, farkli gelistirme fazlarinda eklenen paralel component katmanlarinin ve hardcoded renklerin birikmesinden kaynaklanmaktadir. Tespit edilen 5 kok neden, her yeni ozellik eklendiginde tasarimin bozulmasina yol acmaktadir.')], spacing: { after: 0 } }),
          ]
        })]})],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // A) MIMARI RAPORU
      h1('A) Tasarim Mimarisi Raporu'),

      h2('Kullanilan UI Sistemi'),
      p('Projede sadece BIR UI sistemi kullanilmaktadir:'),
      bullet('Tailwind CSS v3.4', ' — utility-first CSS'),
      bullet('Shadcn/UI (new-york stili, Radix tabanli)', ' — component kutuphanesi'),
      bullet('@tanstack/react-table', ' — veri tablolari icin'),
      bullet('lucide-react', ' — ikon seti'),
      new Paragraph({ children: [new TextRun({ text: 'Material UI, Ant Design, Bootstrap, Custom CSS YOKTUR. Bu iyi bir baslangic noktasidir.', bold: true })], spacing: { before: 120, after: 200 } }),

      h2('Component Katman Yapisi'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 3000, 4026],
        rows: [
          tRow(['Katman', 'Konum', 'Icerik'], true),
          tRow(['Katman 1 — Ham', 'src/components/ui/', 'Button, Input, Select, Table, Card, Dialog... (Shadcn/UI standardi)']),
          tRow(['Katman 2 — Premium', 'src/components/premium/', 'PremiumButton, PremiumDataTable, PremiumCard, PremiumPageHeaderBar...']),
          tRow(['Katman 3 — Layout', 'src/components/layout/', 'DashboardShell, PageShell, Header, Sidebar, MobileSidebar']),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),

      p('Her sayfa icin standart akis:'),
      bullet('DashboardShell', ' → PremiumAppShell → Sidebar + icerik alani'),
      bullet('Header', ' → HeaderClient → PremiumPageHeaderBar'),
      bullet('PageShell', ' → PremiumContentArea (p-4/p-6 padding)'),
      bullet('PremiumPageContainer', ' → flex col gap-6 sarmalayici'),
      bullet('Icerik:', ' Modul bilesenleri (PremiumDataTable, PremiumCard, PremiumKpiCard...)'),

      h2('Genel Durum'),
      p('Component mimarisi buyuk olcude tutarli. 30+ sayfa ayni PageShell → PremiumPageContainer → Header zincirini kullaniyor. Tablo sistemi teklestirilmis: tum moduller PremiumDataTable uzerinden calisiyor. Kok sorunlar mimari degil, ayrintilar seviyesindeki tutarsizliklardir.'),

      new Paragraph({ children: [new PageBreak()] }),

      // B) PROBLEMLER
      h1('B) Tespit Edilen Problemler'),

      h2('Sorun #1 — Iki Paralel Card Sistemi'),
      p('Projede uc farkli card implementasyonu bir arada kullanilmaktadir:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 3000, 3526],
        rows: [
          tRow(['Component', 'HTML Ciktisi', 'Stil'], true),
          tRow(['PremiumCard', '<div> + glass-panel', 'Ozel div, hover animasyonu var']),
          tRow(['PremiumWidgetCard', 'Shadcn <Card> + glass-panel', 'Semantic card, CardHeader/CardContent var']),
          tRow(['ui/card direkt', 'Shadcn <Card>', 'Gradient/glow efekti YOK']),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      p('Bu uc farkli implementasyon, benzer iceriklerin farkli gorunmesine neden olmaktadir. PremiumWidgetCard icinde hem Shadcn Card hem glass-panel bir arada kullanilmasi cift shadow olusturmaktadir.'),

      h2('Sorun #2 — Hardcoded Renkler (Dark Mode Kirilmasi)'),
      p('En kritik sorundur. Sabit kodlanmis renkler dark mode gecisinde beyaz/gri kutular olusturur:'),
      bullet('quote-line-items-editor.tsx:', ' style={{ backgroundColor: "#ffffff" }} — 3 ayrida. Dark modda beyaz kutu gorunur.'),
      bullet('quote-line-items-editor.tsx:', ' style={{ backgroundColor: "#f3f4f6" }} — Gri arka plan, dark modda bozulur.'),
      bullet('customer-table.tsx:', ' bg-blue-50 text-blue-700 border-blue-200 — Semantic token yerine Tailwind renk sinifi.'),
      bullet('product-table.tsx:', ' bg-blue-50/20 dark:bg-blue-950/20 — Kismi dark mode, tamamlanmamis.'),
      bullet('customer-import-wizard.tsx:', ' border-blue-200 bg-blue-50 text-blue-900 — Semantic token yerine Tailwind renk sinifi.'),
      p('Her light/dark toggle veya tema degisikliginde bu dosyalar farkli gorunur.'),

      h2('Sorun #3 — Native HTML Elementler (customer-import-wizard.tsx)'),
      p('Bu dosya Shadcn bilesenleri yerine ham HTML elementleri kullanmaktadir:'),
      bullet('<select>', ' — Shadcn Select kullanilmamis, tarayici varsayilan stili gorunur'),
      bullet('<input>', ' — Shadcn Input kullanilmamis, border/focus stilleri farklidir'),
      p('Bu sayfada form elementleri diger tum sayfalardan farkli gorunur.'),

      h2('Sorun #4 — FileCenterShell Cift Gradient'),
      p('PremiumAppShell tum uygulama icin bbs-app-gradient arka planini zaten uygulamaktadir. Ancak FileCenterShell bu gradient\'i kendi icinde TEKRAR uygulamaktadir:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4513, 4513],
        rows: [
          tRow(['Dis Katman (PremiumAppShell)', 'Ic Katman (FileCenterShell)'], true),
          tRow(['className="bbs-app-gradient flex min-h-screen"', 'className="file-center-theme bbs-app-gradient min-h-[60vh] rounded-xl p-4"']),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      p('Sonuc: Dosyalar sayfasi diger tum sayfalardan gorunsel olarak farklidir. Ek olarak rounded-xl ve fazladan padding diger sayfalarda bulunmayan gorunsel sinirlar yaratir.'),

      h2('Sorun #5 — globals.css\'deki Paralel Alias Sistemi'),
      p('"FAZ 7 geriye uyumluluk" yorumuyla eklenmis .fc-* utility siniflari, zaten var olan bilesenlerin kopyasidir:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 4000, 3026],
        rows: [
          tRow(['Alias Sinif', 'Yaptigi Sey', 'Gercek Karsiligi'], true),
          tRow(['.fc-input', '@apply Input benzeri stiller', '<Input> bileseni']),
          tRow(['.fc-btn-primary', '.premium-btn-primary benzeri', '<PremiumButton> veya <Button>']),
          tRow(['.fc-glass', '@apply glass-panel', 'glass-panel utility\'si']),
          tRow(['.fc-table-row', '@apply premium-table-row', 'premium-table-row utility\'si']),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      p('Bu alias\'lar silinmediginden CSS giderek buyur. Her fazda benzer alias\'lar eklenmesi, hangi sinifin kullanilacagina dair belirsizlik yaratir.'),

      h2('Kok Neden Ozeti'),
      p('Her gelistirme fazinda yeni component\'ler ve CSS alias\'lari ekleniyor ama eskiler temizlenmiyor. Zamanla biriken bu "drift"; her yeni ozellik eklendiginde bazi sayfalarin farkli gorunmesine neden oluyor. Sorun, farkli UI sistemleri kullanmak degil; mevcut sistemin sinirlari disina cikilmasidir.'),

      new Paragraph({ children: [new PageBreak()] }),

      // C) RISKLI DOSYALAR
      h1('C) Riskli Dosyalar Listesi'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3500, 1500, 4026],
        rows: [
          new TableRow({ tableHeader: true, children: [
            new TableCell({ borders, shading: { fill: '1E3A5F', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              width: { size: 3500, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: 'Dosya', bold: true, color: 'FFFFFF' })], spacing: { after: 0 } })] }),
            new TableCell({ borders, shading: { fill: '1E3A5F', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              width: { size: 1500, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: 'Risk', bold: true, color: 'FFFFFF' })], spacing: { after: 0 } })] }),
            new TableCell({ borders, shading: { fill: '1E3A5F', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              width: { size: 4026, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: 'Sebep', bold: true, color: 'FFFFFF' })], spacing: { after: 0 } })] }),
          ]}),
          riskRow('quote-line-items-editor.tsx', 'KRITIK', 'Hardcoded #ffffff ve #f3f4f6 — dark modda beyaz kutu olusur'),
          riskRow('customer-import-wizard.tsx', 'KRITIK', 'Native <input> ve <select> — form stili tamamen farkli gorunur'),
          riskRow('file-center-shell.tsx', 'YUKSEK', 'Cift bbs-app-gradient ve ek rounded-xl/padding'),
          riskRow('globals.css (.fc-* aliaslar)', 'YUKSEK', 'Paralel CSS sistemi; her fazda buyur, hangi sinif kullanilacagi belirsizlesir'),
          riskRow('premium-card.tsx', 'YUKSEK', 'PremiumCard (div) vs PremiumWidgetCard (Card) — iki farkli implementasyon'),
          riskRow('customer-table.tsx', 'ORTA', 'bg-blue-50 text-blue-700 — semantic token yerine hardcoded Tailwind renk'),
          riskRow('product-table.tsx', 'ORTA', 'bg-blue-50/20 — kismi dark mode, tamamlanmamis'),
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // D) ONERI
      h1('D) Tek Standart UI Mimarisi Onerisi'),

      h2('Mimari Ilke: 3 Katman, 1 Yon'),
      p('Mevcut 3 katmanli yapi dogrudur. Sorun, katmanlar arasi gecislerde ve katman disinda yapilan ozel uygulamalarda. Cozum yeni bir sistem kurmak degil, mevcut sistemi kati kurallara baglamaktir.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1500, 2500, 5026],
        rows: [
          tRow(['Katman', 'Componentler', 'Kural'], true),
          tRow(['ui/', 'Button, Input, Select, Table, Card...', 'SADECE premium/ veya layout/ tarafindan import edilir. Sayfa/modul bilesenlerinde direkt kullanim YASAK.']),
          tRow(['premium/', 'PremiumButton, PremiumDataTable, PremiumCard...', 'Sayfa bilesenlerinin kullandigi asil API. Tum moduller buradan import eder.']),
          tRow(['layout/', 'DashboardShell, PageShell, Header, Sidebar', 'Sadece app/ route dosyalari ve layout.tsx tarafindan kullanilir.']),
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),

      h2('Acil Yapilacaklar (Oncelik Sirasi)'),
      bullet('#1 — quote-line-items-editor.tsx:', ' style={{ backgroundColor: "#ffffff" }} degerlerini bg-background ve bg-muted ile degistir.'),
      bullet('#2 — customer-import-wizard.tsx:', ' Native <input> ve <select> ogelerini Shadcn Input ve Select bilesenleriyle degistir.'),
      bullet('#3 — file-center-shell.tsx:', ' bbs-app-gradient ve rounded-xl classlarini kaldir. Sadece padding ve icerik duzeni birak.'),
      bullet('#4 — premium-card.tsx:', ' PremiumCard ve PremiumWidgetCard birlestir. Tek bir PremiumCard, tum senaryolari karsilamali.'),
      bullet('#5 — globals.css:', ' .fc-* aliaslarini sil. Bunlarin yerine zaten bilesenleri var.'),
      bullet('#6 — Tum dosyalarda:', ' bg-blue-* ve text-blue-* siniflarini semantic tokenlarla degistir (bg-primary/10, text-primary, vb.)'),

      new Paragraph({ children: [new PageBreak()] }),

      // E) KURALLAR
      h1('E) Tasarimin Bozulmamasi Icin Uygulanacak Kurallar'),

      h3('Kural 1 — Hardcoded Renk Yasak'),
      p('style={{ backgroundColor: "#..." }} veya bg-blue-500 gibi renk degerleri KULLANILMAZ. Yalnizca CSS degiskeni tabanli Tailwind siniflari:'),
      bullet('Arka plan:', ' bg-background, bg-card, bg-muted, bg-secondary'),
      bullet('Metin:', ' text-foreground, text-muted-foreground, text-primary'),
      bullet('Kenarlik:', ' border-border, border-border/60'),
      bullet('Basari/Uyari/Hata:', ' text-success, text-warning, text-danger'),

      h3('Kural 2 — Native HTML Form Elementi Yasak'),
      p('Dogrudan <input>, <select>, <textarea>, <button> kullanilmaz. Her zaman Shadcn UI bilesenleri veya premium sarmalayicilari kullanilir.'),

      h3('Kural 3 — Yeni CSS Sinifi Ekleme Yasak'),
      p('globals.css\'e yeni utility sinifi veya alias eklenmez. Ihtiyac duyulan stiller ya mevcut Tailwind siniflari ile karsilanir ya da premium/ altinda yeni bilesen olusturulur.'),

      h3('Kural 4 — Her Sayfanin Ayni Sarmalayici Zinciri'),
      p('Tum dashboard sayfalari bu zinciri kullanir. Istisna yoktur:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          tRow(['Katman', 'Bilesen'], true),
          tRow(['Route Layout', '<DashboardShell>']),
          tRow(['Sayfa Header', '<Header title="..." description="..." pageActions={...} />']),
          tRow(['Icerik Sarmalayici', '<PageShell>']),
          tRow(['Sayfa Container', '<PremiumPageContainer>']),
          tRow(['Icerik', 'Modul bilesenleri']),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),

      h3('Kural 5 — Yeni Gelistirmede Kontrol Listesi'),
      p('Her yeni ozellik birlestirilmeden once su sorular yanitlanir:'),
      bullet('Hardcoded renk (#hex veya bg-blue-*) var mi?'),
      bullet('Native HTML form elementi (<input>, <select>) var mi?'),
      bullet('ui/ katmanindan direkt import var mi (premium/ yerine)?'),
      bullet('globals.css\'e yeni sinif eklendi mi?'),
      bullet('Sayfa sarmalayici zinciri dogru mu (PageShell → PremiumPageContainer)?'),

      new Paragraph({ children: [new PageBreak()] }),

      // F) REFERANS BILESENLERI
      h1('F) Referans Bilesenleri'),
      p('Bundan sonra her gelistirmede asagidaki bilesenleri kullanilir. Alternatif YOKTUR.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1800, 3500, 3726],
        rows: [
          tRow(['Element', 'Kullanilacak Bilesen', 'Import Yolu'], true),
          tRow(['Button', 'PremiumButton veya Button', '@/components/premium veya @/components/ui/button']),
          tRow(['Input', 'Input', '@/components/ui/input']),
          tRow(['Select', 'Select + SelectTrigger + SelectContent', '@/components/ui/select']),
          tRow(['Tablo', 'PremiumDataTable', '@/components/premium/premium-data-table']),
          tRow(['Card', 'PremiumCard (icerik) / PremiumWidgetCard (baslikli)', '@/components/premium/premium-card']),
          tRow(['Modal / Dialog', 'Dialog + DialogContent', '@/components/ui/dialog']),
          tRow(['Sidebar', 'Sidebar', '@/components/layout/sidebar']),
          tRow(['Header', 'Header', '@/components/layout/header']),
          tRow(['Form', 'Input + Label + Select + Textarea (Shadcn)', '@/components/ui/*']),
          tRow(['Bos Durum', 'PremiumEmptyState', '@/components/premium/premium-empty-state']),
          tRow(['Filtreler', 'PremiumFilterBar', '@/components/premium/premium-filter-bar']),
          tRow(['Sayfalama', 'PremiumListPagination', '@/components/premium/premium-list-pagination']),
          tRow(['Tabs', 'PremiumTabNav', '@/components/premium/premium-tab-nav']),
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // G) TEK TASARIM SISTEMI
      h1('G) Tek Tasarim Sistemi Referansi'),

      h2('Renk Paleti (CSS Degiskenleri)'),
      p('TUM renkler globals.css\'deki CSS degiskenleri uzerinden kullanilir.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 2200, 2000, 2326],
        rows: [
          tRow(['Token', 'Light Deger', 'Dark Deger', 'Kullanim'], true),
          tRow(['bg-background', '210 40% 98%', '222 47% 11%', 'Sayfa arka plani']),
          tRow(['bg-card', '0 0% 100%', '217 33% 17%', 'Kart arka plani']),
          tRow(['text-primary / bg-primary', '221 83% 53%', '221 83% 53%', 'Ana aksiyon rengi (#2563EB)']),
          tRow(['bg-muted / text-muted-foreground', '210 20% 96%', '217 33% 20%', 'Ikincil arka planlar']),
          tRow(['border-border', '214 20% 90%', '215 25% 27%', 'Kenarliklar']),
          tRow(['text-success', '142 71% 45%', 'ayni', 'Basari durumu']),
          tRow(['text-warning', '38 92% 50%', 'ayni', 'Uyari durumu']),
          tRow(['text-danger', '0 84% 60%', 'ayni', 'Hata/tehlike durumu']),
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),

      h2('Tipografi'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 3500, 3526],
        rows: [
          tRow(['Oge', 'Tailwind Sinifi', 'Kullanim Yeri'], true),
          tRow(['Sayfa Basligi', 'text-lg font-semibold tracking-tight', 'Header barindaki h1']),
          tRow(['Bolum Basligi', 'text-base font-semibold', 'PremiumWidgetCard title']),
          tRow(['Tablo Basligi', 'text-sm font-medium text-muted-foreground', 'TableHead']),
          tRow(['Govde Metin', 'text-sm (veya varsayilan)', 'Genel icerik']),
          tRow(['Kucuk Metin', 'text-xs text-muted-foreground', 'Meta bilgi, tarih, aciklama']),
          tRow(['KPI Degeri', 'text-2xl font-semibold tracking-tight', 'PremiumKpiCard degeri']),
          tRow(['Font Ailesi', 'var(--font-geist-sans)', 'Tum uygulama (tailwind.config.ts\'de tanimli)']),
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),

      h2('Border Radius'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2500, 4526],
        rows: [
          tRow(['Token', 'Deger', 'Kullanim'], true),
          tRow(['rounded-lg (--radius)', '0.5rem (8px)', 'Kartlar, paneller, tablolar']),
          tRow(['rounded-md', '0.375rem (6px)', 'Butonlar, inputlar']),
          tRow(['rounded-sm', '0.25rem (4px)', 'Badge, kucuk elementler']),
          tRow(['rounded-full', 'tam yuvarlak', 'Avatar, icon button']),
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),

      h2('Spacing Sistemi'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2000, 5026],
        rows: [
          tRow(['Sinif', 'Deger', 'Kullanim Yeri'], true),
          tRow(['p-4 / px-4', '16px', 'PageShell (mobil), kart ici padding']),
          tRow(['p-6 / px-6', '24px', 'PageShell (masaustu)']),
          tRow(['gap-4', '16px', 'Grid ve flex bosluklari']),
          tRow(['gap-6', '24px', 'Bolumler arasi bosluk']),
          tRow(['space-y-8', '32px', 'DashboardOverview ana bolumleri']),
          tRow(['px-4 py-3', '16px/12px', 'Tablo hucreleri (normal)']),
          tRow(['px-3 py-2', '12px/8px', 'Tablo hucreleri (compact mod)']),
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),

      h2('Tablo Yapisi'),
      bullet('Sarmalayici:', ' glass-panel overflow-hidden rounded-lg border border-border/60'),
      bullet('Header satiri:', ' border-border/60 hover:bg-transparent (hover efekti YOK)'),
      bullet('Veri satiri:', ' premium-table-row border-border/40 (hover: primary/6 arka plan)'),
      bullet('Bos durum:', ' PremiumEmptyState bileseni'),
      bullet('Compact mod:', ' compact={true} prop\'u ile etkinlestirilir'),
      bullet('Tum moduller ayni:', ' PremiumDataTable kullanir. Direkt Table/TableBody/TableRow YASAK.'),

      h2('Form Yapisi'),
      bullet('Sarmalayici:', ' PremiumSection (baslik + icerik bolumu)'),
      bullet('Grid:', ' grid grid-cols-1 gap-4 sm:grid-cols-2'),
      bullet('Alan:', ' <Label> + <Input> / <Select> / <Textarea>'),
      bullet('Butonlar:', ' Sag ustte Header pageActions prop\'una tasinir'),
      bullet('Hata mesaji:', ' text-sm text-danger sinifi (text-red-* DEGIL)'),

      h2('Menu Yapisi'),
      p('Menu tamamen navigation config dosyasi (src/config/navigation.ts) uzerinden yonetilir. Sidebar bilesenine dokunulmaz. Yeni menu ogesi eklemek icin sadece navigation config guncellenir.'),

      new Paragraph({ children: [new PageBreak()] }),

      // SONUC
      h1('Sonuc ve Ozet'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4513, 4513],
        rows: [
          tRow(['Guclu Yanlar', 'Duzeltilmesi Gerekenler'], true),
          tRow(['Tek UI sistemi (Tailwind + Shadcn)', 'quote-line-items-editor.tsx hardcoded renkler']),
          tRow(['Tutarli sayfa sarmalayici zinciri (30+ sayfa)', 'customer-import-wizard.tsx native HTML elementler']),
          tRow(['Teklestirilmis PremiumDataTable sistemi', 'FileCenterShell cift gradient']),
          tRow(['CSS degiskeni tabanli renk sistemi', 'globals.css fc-* paralel alias\'lar']),
          tRow(['Merkezi navigation config', 'PremiumCard/PremiumWidgetCard iki implementasyon']),
          tRow(['Moduler component yapisi', 'Arada semantic token yerine Tailwind renk sinifi']),
        ]
      }),
      new Paragraph({ spacing: { after: 240 } }),
      new Paragraph({
        children: [new TextRun({ text: 'Yukaridaki 6 duzeltme yapildiktan ve kurallar ekiple paylasildiktan sonra, yeni bir ozellik eklendiginde mevcut sayfalarin gorunumu degismeyecektir. Tasarim tutarsizliginin tek kaynagi mimari bir problem degil, birkas dosyadaki uygulama hatalari ve biriken CSS aliaslardir.', bold: true })],
        spacing: { after: 0 }
      }),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('BBS-CRM-UI-Analiz-Raporu.docx', buffer);
  console.log('OK');
}).catch(e => { console.error(e); process.exit(1); });
