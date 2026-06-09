/**
 * Generates docs/contracts/standart-sozlesme.docx
 * Docxtemplater template with {{placeholder}} markers (paragraphLoop: true)
 *
 * Run: node scripts/generate-contract-template.js
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  TabStopType,
  TabStopPosition,
  PageNumber,
} = require("docx");
const fs = require("node:fs");
const path = require("node:path");

// ── Dimensions (A4, 2 cm margins) ────────────────────────────────────────────
const PAGE_W  = 11906;   // DXA
const PAGE_H  = 16838;   // DXA
const MARGIN  = 1134;    // DXA (~2 cm)
const CONTENT = PAGE_W - 2 * MARGIN; // 9638 DXA

// Device table column widths (total = CONTENT = 9638)
const COL_NO      =  700;
const COL_PRODUCT = 6438;
const COL_SERIAL  = 2500;

const FONT = "Arial";

// ── Logo loading ─────────────────────────────────────────────────────────────
let logoData = null;
const LOGO_PATH = path.join(__dirname, "../public/logo.png");
try {
  logoData = fs.readFileSync(LOGO_PATH);
  console.log("✓ Logo loaded:", LOGO_PATH);
} catch {
  console.warn("⚠ Logo not found at", LOGO_PATH, "— header will use text fallback");
}

// Logo display dimensions preserving 1025:397 aspect ratio
const LOGO_W = 150;
const LOGO_H = Math.round(LOGO_W * (397 / 1025)); // ≈ 58

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Bold section heading with keepNext */
function heading(text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    keepNext: true,
    widowControl: true,
    children: [
      new TextRun({ text, bold: true, size: 22, font: FONT }),
    ],
  });
}

/** Regular body paragraph with widow control */
function body(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    alignment: AlignmentType.JUSTIFIED,
    widowControl: true,
    children: [
      new TextRun({ text, size: 20, font: FONT }),
    ],
  });
}

/**
 * Article block: title paragraph (keepNext) + indented body.
 * Returns [titleParagraph, bodyParagraph] array.
 */
function article(no, title, text) {
  return [
    new Paragraph({
      spacing: { before: 180, after: 60 },
      keepNext: true,
      widowControl: true,
      children: [
        new TextRun({ text: `${no} – ${title}`, bold: true, size: 20, font: FONT }),
      ],
    }),
    new Paragraph({
      spacing: { before: 40, after: 60 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 360 },
      widowControl: true,
      children: [
        new TextRun({ text, size: 20, font: FONT }),
      ],
    }),
  ];
}

/** Table cell helper */
function cell(text, width, opts = {}) {
  const { bold = false, bg = null, color = "000000" } = opts;
  const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    borders: { top: border, bottom: border, left: border, right: border },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({ text, bold, size: 18, font: FONT, color }),
        ],
      }),
    ],
  });
}

// ── Header ────────────────────────────────────────────────────────────────────
const HALF = Math.floor(CONTENT / 2);

function makeHeader() {
  const logoCell = logoData
    ? new TableCell({
        width: { size: HALF, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 0, right: 80 },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 8, color: "1F3864" },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
        },
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                type: "png",
                data: logoData,
                transformation: { width: LOGO_W, height: LOGO_H },
                altText: { title: "BBS Teknoloji", description: "BBS Teknoloji Logo", name: "logo" },
              }),
            ],
          }),
        ],
      })
    : new TableCell({
        width: { size: HALF, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 0, right: 80 },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 8, color: "1F3864" },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: "BBS TEKNOLOJİ", bold: true, size: 24, color: "1F3864", font: FONT })],
          }),
        ],
      });

  const infoCell = new TableCell({
    width: { size: CONTENT - HALF, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 0 },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 8, color: "1F3864" },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "Sözleşme No: ", bold: true, size: 16, font: FONT, color: "444444" }),
          new TextRun({ text: "{{contractNumber}}", size: 16, font: FONT, color: "222222" }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "Tarih: ", bold: true, size: 16, font: FONT, color: "444444" }),
          new TextRun({ text: "{{contractDate}}", size: 16, font: FONT, color: "222222" }),
        ],
      }),
    ],
  });

  return new Header({
    children: [
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        columnWidths: [HALF, CONTENT - HALF],
        rows: [new TableRow({ children: [logoCell, infoCell] })],
      }),
      // Small spacing after header table
      new Paragraph({ spacing: { before: 60, after: 0 }, children: [] }),
    ],
  });
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        spacing: { before: 60, after: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
        children: [],
      }),
      // Company info (left) + Page X/Y (right) via tab stop
      new Paragraph({
        spacing: { before: 40, after: 20 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: "BBS Teknoloji  |  Üniversite Mah. İpekyolu Cad. Ata Teknokent No:22 İç Kapı No:212 Yakutiye / Erzurum", size: 14, font: FONT, color: "666666" }),
          new TextRun({ text: "\t", size: 14, font: FONT }),
          new TextRun({ text: "Sayfa ", size: 14, font: FONT, color: "666666" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 14, font: FONT, color: "666666" }),
          new TextRun({ text: " / ", size: 14, font: FONT, color: "666666" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, font: FONT, color: "666666" }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({ text: "www.bbsteknoloji.com  |  info@bbsteknoloji.com", size: 14, font: FONT, color: "666666" }),
        ],
      }),
    ],
  });
}

// ── Document content ───────────────────────────────────────────────────────────
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: 1400, bottom: 1000, left: MARGIN, right: MARGIN, header: 600, footer: 500 },
        },
      },
      headers: { default: makeHeader() },
      footers: { default: makeFooter() },
      children: [
        // ── Belge başlığı ──────────────────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
          keepNext: true,
          children: [
            new TextRun({
              text: "TİNAX HOTSPOT GATEWAY ÜRÜNLERİ İÇİN",
              bold: true,
              size: 24,
              font: FONT,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
          children: [
            new TextRun({
              text: "UZAKTAN BAKIM VE GÜNCELLEME HİZMET SÖZLEŞMESİ",
              bold: true,
              size: 24,
              font: FONT,
            }),
          ],
        }),

        // ── Meta bilgileri ─────────────────────────────────────────────────────
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: "Sözleşme No       : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{contractNumber}}", size: 20, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: "Sözleşme Tarihi   : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{contractDate}}", size: 20, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: "Başlangıç Tarihi  : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{contractStartDate}}", size: 20, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: "Bitiş Tarihi      : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{contractEndDate}}", size: 20, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 160 },
          children: [
            new TextRun({ text: "Sözleşme Bedeli   : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{contractAmount}}", size: 20, font: FONT }),
          ],
        }),

        // ── Taraflar ──────────────────────────────────────────────────────────
        heading("TARAFLAR"),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: "HİZMET SAĞLAYICI  : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "BBS Teknoloji – Kadir Kurt, Üniversite Mah. İpekyolu Cad. Ata Teknokent No:22 İç Kapı No:212 Yakutiye / Erzurum", size: 20, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: "MÜŞTERİ           : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{customerName}}", size: 20, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: "Vergi No / Dairesi: ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{taxNumber}} / {{taxOffice}}", size: 20, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: "Adres             : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{address}}", size: 20, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({ text: "Telefon           : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{phone}}", size: 20, font: FONT }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 160 },
          children: [
            new TextRun({ text: "E-Posta           : ", bold: true, size: 20, font: FONT }),
            new TextRun({ text: "{{email}}", size: 20, font: FONT }),
          ],
        }),

        // ── Maddeler ──────────────────────────────────────────────────────────
        ...article("Madde 1", "Taraflar",
          "Üniversite Mah. İpekyolu Cad. Ata Teknokent No:22 İç Kapı No:212 Yakutiye / Erzurum adresinde faaliyet gösteren BBS Teknoloji – Kadir Kurt ile {{customerName}} (Vergi No: {{taxNumber}}, Adres: {{address}}) arasında akdedilmiştir."
        ),
        ...article("Madde 2", "Sözleşmenin Konusu",
          "İşbu sözleşmenin konusu, Ek-1'de belirtilen Tinax Hotspot Gateway cihazlarının uzaktan bakım, yönetim, izleme, yazılım güncelleme ve teknik destek hizmetlerinin BBS Teknoloji tarafından sağlanmasıdır."
        ),
        ...article("Madde 3", "Sözleşme Kapsamındaki Donanımlar",
          "Sözleşme kapsamındaki cihazlar Ek-1'de belirtilmiştir."
        ),

        // Madde 4 – liste formatı
        new Paragraph({
          spacing: { before: 180, after: 60 },
          keepNext: true,
          widowControl: true,
          children: [new TextRun({ text: "Madde 4 – Hizmet Kapsamı", bold: true, size: 20, font: FONT })],
        }),
        ...["a) Uzaktan sistem yönetimi",
            "b) Uzaktan bakım ve teknik destek",
            "c) Sistem çalışma durumunun takibi",
            "d) Yazılım güncellemeleri",
            "e) Sistem loglarının yönetimi",
            "f) Zaman damgası hizmetleri",
            "g) Sözleşme dönemi boyunca 1 adet SMS entegrasyonu geliştirilmesi",
            "h) Sözleşme dönemi boyunca 1 adet özel entegrasyon geliştirilmesi",
        ].map(item => new Paragraph({
          spacing: { before: 20, after: 20 },
          indent: { left: 360 },
          widowControl: true,
          children: [new TextRun({ text: item, size: 20, font: FONT })],
        })),
        new Paragraph({
          spacing: { before: 60, after: 60 },
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 360 },
          widowControl: true,
          children: [new TextRun({
            text: "Yazılım güncellemeleri kapsamında hata düzeltmeleri, güvenlik güncellemeleri ve mevcut fonksiyonların iyileştirilmesi ücretsiz olarak sağlanır. Yeni modüller, müşteriye özel geliştirmeler ve kapsam dışı talepler ayrıca ücretlendirilir.",
            size: 20, font: FONT,
          })],
        }),

        // Madde 5 – bullet liste formatı
        new Paragraph({
          spacing: { before: 180, after: 60 },
          keepNext: true,
          widowControl: true,
          children: [new TextRun({ text: "Madde 5 – Hizmet Kapsamı Dışındaki İşler", bold: true, size: 20, font: FONT })],
        }),
        ...["Garanti dışı donanım arızaları ve donanım değişimleri",
            "Ek entegrasyon talepleri ve müşteriye özel yazılım geliştirmeleri",
            "Yerinde servis hizmetleri",
            "Mesai dışı destek hizmetleri",
            "Üçüncü taraf sistem entegrasyonları",
        ].map(item => new Paragraph({
          spacing: { before: 20, after: 20 },
          indent: { left: 360 },
          widowControl: true,
          children: [new TextRun({ text: `• ${item}`, size: 20, font: FONT })],
        })),
        ...article("Madde 6", "Müşterinin Yükümlülükleri",
          "Müşteri; elektrik altyapısını, internet bağlantısını, cihazların fiziksel güvenliğini ve gerekli erişim bilgilerini sağlamakla yükümlüdür. Bu unsurlardan kaynaklanan kesintilerden BBS Teknoloji sorumlu tutulamaz."
        ),

        // Madde 7 – genişletilmiş (Rev 5)
        ...article("Madde 7", "Destek ve Müdahale Süreleri",
          "Mesai saatleri içerisinde bildirilen arızalara mümkün olan en kısa sürede uzaktan müdahale edilir. Uzaktan çözülemeyen durumlarda yerinde servis prosedürü uygulanır.\n\n" +
          "Arıza, destek ve hizmet talepleri telefon, e-posta veya BBS Teknoloji tarafından belirlenen destek kanalları üzerinden iletilir.\n\n" +
          "Mesai saatleri dışında yapılan bildirimler takip eden ilk mesai günü içerisinde değerlendirilir.\n\n" +
          "Tüm destek taleplerinde öncelikli çözüm yöntemi uzaktan müdahaledir."
        ),

        ...article("Madde 8", "Yerinde Servis",
          "Erzurum il sınırları içerisindeki yerinde servis hizmetleri, hizmet tarihinde yürürlükte bulunan servis tarifesine göre ücretlendirilir. Erzurum dışındaki yerinde servis taleplerinde ulaşım, konaklama ve diğer seyahat giderleri müşteriye aittir."
        ),
        ...article("Madde 9", "Garanti ve Arıza İşlemleri",
          "Garanti kapsamındaki cihazlar öncelikli olarak değerlendirilir. Onarımı mümkün olmayan cihazlar üretici veya ithalatçı firma garanti şartları doğrultusunda değiştirilir."
        ),
        ...article("Madde 10", "Veri Güvenliği ve Yedekleme",
          "Müşteri, sistemlerinde bulunan tüm verilerin düzenli olarak yedeklenmesinden sorumludur. BBS Teknoloji; veri kaybı, veri bozulması, kullanıcı hataları, elektrik kesintileri, internet kesintileri, üçüncü taraf yazılımlar veya siber saldırılar nedeniyle oluşabilecek doğrudan veya dolaylı zararlardan sorumlu tutulamaz."
        ),
        ...article("Madde 11", "Gizlilik",
          "Taraflar sözleşme süresince öğrendikleri ticari, teknik ve operasyonel bilgileri gizli tutmayı kabul ederler."
        ),
        ...article("Madde 12", "Kişisel Verilerin Korunması",
          "Taraflar, 6698 Sayılı Kişisel Verilerin Korunması Kanunu kapsamında gerekli tüm yükümlülüklere uyacaklarını kabul ederler."
        ),

        ...article("Madde 13", "Sözleşme Bedeli ve Ödeme",
          "Yıllık hizmet bedeli {{contractAmount}} + KDV'dir. Faturalar, fatura tarihinden itibaren 7 gün içerisinde ödenir. " +
          "BBS Teknoloji; TÜFE, ÜFE, döviz kuru, personel giderleri, maliyet artışları ve hizmet kapsamındaki değişiklikleri " +
          "dikkate alarak sözleşme bedelini güncelleme hakkını saklı tutar."
        ),

        ...article("Madde 14", "Hizmetin Askıya Alınması",
          "Fatura bedellerinin vadesinde ödenmemesi halinde BBS Teknoloji hizmeti geçici olarak durdurabilir. Ödeme yapılıncaya kadar hizmet verilmemesi müşterinin ödeme yükümlülüğünü ortadan kaldırmaz."
        ),

        // Madde 15 – tam metin değişti (Rev 7)
        ...article("Madde 15", "Sözleşmenin Süresi ve Yenilenmesi",
          "Sözleşme {{contractStartDate}} tarihinde başlar ve {{contractEndDate}} tarihinde sona erer. " +
          "Taraflardan herhangi biri sözleşme bitiş tarihinden en az 30 gün önce yazılı fesih " +
          "bildiriminde bulunmadığı takdirde işbu sözleşme, BBS Teknoloji tarafından belirlenen ve " +
          "yenileme tarihinde yürürlükte bulunan güncel yıllık bakım hizmet bedeli ile sözleşme " +
          "koşulları üzerinden 1 yıllık sürelerle kendiliğinden yenilenir."
        ),

        ...article("Madde 16", "Fesih",
          "Taraflardan herhangi biri sözleşme hükümlerinin ağır şekilde ihlal edilmesi halinde işbu sözleşmeyi yazılı bildirimde bulunarak tek taraflı olarak feshedebilir."
        ),
        ...article("Madde 17", "Mücbir Sebep",
          "Doğal afetler, savaş, terör olayları, internet altyapı arızaları, enerji kesintileri, kamu kurumlarının kararları ve tarafların kontrolü dışında gelişen olaylar mücbir sebep sayılır."
        ),

        // Madde 18 – ek paragraf (Rev 8)
        ...article("Madde 18", "Sorumluluğun Sınırlandırılması",
          "BBS Teknoloji'nin işbu sözleşmeden doğabilecek toplam sorumluluğu hiçbir durumda ilgili sözleşme dönemine ait yıllık hizmet bedeli tutarını aşamaz.\n\n" +
          "BBS Teknoloji hiçbir durumda müşterinin kâr kaybı, gelir kaybı, iş kaybı, veri kaybı, " +
          "müşteri kaybı veya üçüncü kişilerden kaynaklanan talepleri nedeniyle oluşabilecek dolaylı " +
          "zararlardan sorumlu tutulamaz."
        ),

        ...article("Madde 19", "Devir",
          "Taraflar, diğer tarafın yazılı onayı olmaksızın işbu sözleşmeden doğan hak ve yükümlülüklerini üçüncü kişilere devredemez."
        ),
        ...article("Madde 20", "Yetkili Mahkeme",
          "İşbu sözleşmeden doğacak uyuşmazlıklarda Erzurum Mahkemeleri ve Erzurum İcra Müdürlükleri yetkilidir."
        ),
        ...article("Madde 21", "Ekler",
          "EK-1 : Hizmet Kapsamındaki Cihazlar\nEK-2 : Firmanın Kestiği İlgili Fatura{{invoiceNumber}}"
        ),

        // ── EK-1: Cihaz tablosu ───────────────────────────────────────────────
        new Paragraph({
          spacing: { before: 360, after: 120 },
          pageBreakBefore: true,
          keepNext: true,
          children: [
            new TextRun({ text: "EK-1 : Hizmet Kapsamındaki Cihazlar", bold: true, size: 22, font: FONT }),
          ],
        }),

        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [COL_NO, COL_PRODUCT, COL_SERIAL],
          rows: [
            // Header
            new TableRow({
              tableHeader: true,
              children: [
                cell("No",       COL_NO,      { bold: true, bg: "1F3864", color: "FFFFFF" }),
                cell("Ürün Adı", COL_PRODUCT, { bold: true, bg: "1F3864", color: "FFFFFF" }),
                cell("Seri No",  COL_SERIAL,  { bold: true, bg: "1F3864", color: "FFFFFF" }),
              ],
            }),
            // Loop row — docxtemplater paragraphLoop fills this row for each device
            new TableRow({
              children: [
                new TableCell({
                  width: { size: COL_NO, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                    left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                    right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                  },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "{{#devices}}{{rowNum}}", size: 18, font: FONT })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: COL_PRODUCT, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                    left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                    right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                  },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "{{productName}}", size: 18, font: FONT })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: COL_SERIAL, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                    left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                    right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
                  },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "{{serialNumber}}{{/devices}}", size: 18, font: FONT })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // ── EK-2 ─────────────────────────────────────────────────────────────
        new Paragraph({
          spacing: { before: 320, after: 80 },
          children: [
            new TextRun({ text: "EK-2 : Firmanın Kestiği İlgili Fatura{{invoiceNumber}}", bold: true, size: 22, font: FONT }),
          ],
        }),

        // ── İmza (EK-2'nin ardından) ──────────────────────────────────────────
        new Paragraph({
          spacing: { before: 300, after: 80 },
          widowControl: true,
          children: [
            new TextRun({ text: "İşbu sözleşme {{contractDate}} tarihinde 2 (iki) nüsha olarak tanzim edilmiş ve taraflarca imzalanmıştır.", size: 20, font: FONT }),
          ],
        }),
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [HALF, CONTENT - HALF],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: HALF, type: WidthType.DXA },
                  margins: { top: 80, bottom: 240, left: 120, right: 120 },
                  borders: {
                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                  },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "MÜŞTERİ", bold: true, size: 20, font: FONT })] }),
                    new Paragraph({ children: [new TextRun({ text: "{{customerName}}", size: 20, font: FONT })] }),
                    new Paragraph({
                      spacing: { before: 600 },
                      children: [new TextRun({ text: "İmza / Kaşe: ____________________", size: 20, font: FONT })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: CONTENT - HALF, type: WidthType.DXA },
                  margins: { top: 80, bottom: 240, left: 120, right: 120 },
                  borders: {
                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                  },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "HİZMET SAĞLAYICI", bold: true, size: 20, font: FONT })] }),
                    new Paragraph({ children: [new TextRun({ text: "BBS Teknoloji – Kadir Kurt", size: 20, font: FONT })] }),
                    new Paragraph({
                      spacing: { before: 600 },
                      children: [new TextRun({ text: "İmza / Kaşe: ____________________", size: 20, font: FONT })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },
  ],
});

// ── Write ─────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "../docs/contracts/standart-sozlesme.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log("✓ Written:", outPath, `(${Math.round(buffer.length / 1024)} KB)`);
});
