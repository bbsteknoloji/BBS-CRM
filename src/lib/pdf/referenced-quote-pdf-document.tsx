import React from "react";
import {
  Document,
  Font,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { quoteBrand } from "@/lib/pdf/quote-brand";
import { PDF_FONT_FAMILY } from "@/lib/pdf/register-pdf-fonts";
import type { QuotePdfData } from "@/lib/pdf/quote-pdf-document";
import { REFERENCE_CATEGORIES } from "@/lib/pdf/reference-data";

// Kelime bölünmesini kapat
Font.registerHyphenationCallback((word) => [word]);

const C = quoteBrand.colors;

const s = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 44, // footer alanı
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: PDF_FONT_FAMILY,
    color: C.text,
    lineHeight: 1.5,
  },

  // ── Banner ──────────────────────────────────────────────────
  bannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: C.brandBlue,
    marginBottom: 8,
  },
  logo: { width: 155 },
  zarfImg: { height: 70, width: 18 },

  // ── Şirket iletişim ─────────────────────────────────────────
  companyContactLine: {
    fontSize: 8,
    color: C.text,
    fontWeight: 700,
    marginBottom: 1,
  },
  companyAddressLine: {
    fontSize: 8,
    color: C.muted,
    marginBottom: 6,
  },

  // ── Müşteri / Tarih ─────────────────────────────────────────
  customerName: {
    fontSize: 9,
    fontWeight: 700,
    color: C.text,
    marginBottom: 1,
  },
  dateText: {
    fontSize: 9,
    color: C.text,
    marginBottom: 10,
  },

  // ── Teklif başlığı ──────────────────────────────────────────
  titleBox: {
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: C.borderLight,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
    paddingVertical: 6,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 13,
    fontWeight: 700,
    color: C.text,
    textAlign: "center",
  },

  // ── Giriş paragrafları ──────────────────────────────────────
  para: {
    fontSize: 9,
    color: C.text,
    lineHeight: 1.6,
    marginBottom: 7,
    textAlign: "justify",
  },
  regards: {
    fontSize: 9,
    color: C.text,
    marginBottom: 10,
  },

  // ── Ürün bölümü ─────────────────────────────────────────────
  productSectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center",
    color: C.text,
    marginBottom: 3,
  },
  priceTableTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.text,
    marginBottom: 4,
  },

  // ── Fiyat tablosu ───────────────────────────────────────────
  priceTable: {
    borderWidth: 0.5,
    borderColor: C.borderLight,
    marginBottom: 4,
  },
  priceTableHead: {
    flexDirection: "row",
    backgroundColor: C.brandNavy,
  },
  pth: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  pthBorder: {
    borderRightWidth: 0.5,
    borderRightColor: "#2E4054",
  },
  ptRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  ptRowAlt: { backgroundColor: C.rowAlt },
  ptd: {
    fontSize: 8.5,
    color: C.text,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRightWidth: 0.5,
    borderRightColor: C.borderLight,
    lineHeight: 1.5,
  },
  ptdLast: {
    fontSize: 8.5,
    color: C.text,
    fontWeight: 700,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: "center" },
  colTotal: { width: 80, textAlign: "right" },

  // KDV notu
  kdvNote: {
    fontSize: 8,
    color: C.text,
    fontWeight: 700,
    textAlign: "right",
    marginBottom: 6,
  },

  // ── Sayfa 2: Bölüm başlıkları ───────────────────────────────
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: C.text,
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 0.8,
    borderBottomColor: C.text,
  },
  subSectionTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    color: C.text,
    marginTop: 6,
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  bodyText: {
    fontSize: 9,
    color: C.text,
    lineHeight: 1.6,
    marginBottom: 5,
    textAlign: "justify",
  },

  // ── Referanslar ─────────────────────────────────────────────
  refIntro: {
    fontSize: 9,
    color: C.text,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  refCategoryTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.text,
    marginTop: 8,
    marginBottom: 4,
  },
  refTable: {
    borderWidth: 0.5,
    borderColor: C.borderLight,
    marginBottom: 6,
  },
  refTableHead: {
    flexDirection: "row",
    backgroundColor: C.brandNavy,
  },
  refTh: {
    fontSize: 8,
    fontWeight: 700,
    color: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 6,
    flex: 1,
  },
  refThLoc: {
    fontSize: 8,
    fontWeight: 700,
    color: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 6,
    width: 150,
  },
  refRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  refRowAlt: { backgroundColor: C.rowAlt },
  refTd: {
    fontSize: 8,
    color: C.text,
    paddingVertical: 4,
    paddingHorizontal: 6,
    flex: 1,
    lineHeight: 1.4,
  },
  refTdLoc: {
    fontSize: 8,
    color: C.muted,
    paddingVertical: 4,
    paddingHorizontal: 6,
    width: 150,
    lineHeight: 1.4,
  },

  // ── Fixed footer ────────────────────────────────────────────
  fixedFooter: {
    position: "absolute",
    bottom: 10,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: C.borderLight,
    paddingTop: 4,
    alignItems: "center",
  },
  footerCompany: {
    fontSize: 7.5,
    fontWeight: 700,
    color: C.brandBlue,
    marginBottom: 1,
  },
  footerContact: {
    fontSize: 7,
    color: C.muted,
    marginBottom: 0.5,
  },
});

// ── Yardımcı bileşenler ────────────────────────────────────────

function PageFooter({ company }: { company: QuotePdfData["companyHeader"] }) {
  return (
    <View style={s.fixedFooter} fixed>
      <Text style={s.footerCompany}>{company.name}</Text>
      <Text style={s.footerContact}>
        T: {company.phone}  |  E: {company.email}
      </Text>
      <Text style={s.footerContact}>
        Üniversite Mah. İpekyolu Cad. ATA TEKNOKENT A Blok No: 22 Yakutiye/Erzurum
      </Text>
    </View>
  );
}

function PageBanner({
  logoSrc,
  accentSrc,
}: {
  logoSrc?: string | null;
  accentSrc?: string | null;
}) {
  return (
    <View style={s.bannerRow}>
      <View>
        {logoSrc ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={logoSrc} style={s.logo} cache={false} />
        ) : (
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>BBS TEKNOLOJİ</Text>
        )}
      </View>
      {accentSrc ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={accentSrc} style={s.zarfImg} cache={false} />
      ) : null}
    </View>
  );
}

function CompanyContact({ phone, email }: { phone: string; email: string }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={s.companyContactLine}>
        T: {phone}  |  E: {email}
      </Text>
      <Text style={s.companyAddressLine}>
        Üniversite Mah. İpekyolu Cad. ATA TEKNOKENT A Blok No: 22 Yakutiye/Erzurum
      </Text>
    </View>
  );
}

// ── Sayfa 1: Teklif sayfası ───────────────────────────────────

function QuotePage({ data }: { data: QuotePdfData }) {
  const customerDisplay =
    data.customer.tradeName ?? data.customer.legalName;

  return (
    <Page size="A4" style={s.page}>
      <PageBanner logoSrc={data.logoImagePath} accentSrc={data.accentImagePath} />
      <CompanyContact phone={data.companyHeader.phone} email={data.companyHeader.email} />

      {/* Müşteri adı + tarih */}
      <Text style={s.customerName}>{customerDisplay}</Text>
      <Text style={s.dateText}>{data.quoteDate}</Text>

      {/* Başlık */}
      <View style={s.titleBox}>
        <Text style={s.titleText}>{data.title}</Text>
      </View>

      {/* Giriş paragrafları */}
      <Text style={s.para}>
        Öncelikle firmamıza göstermiş olduğunuz ilgi için teşekkür ederiz.
      </Text>
      <Text style={s.para}>
        {`Talebiniz doğrultusunda, ${data.title.toLowerCase()} ile bakım, garanti ve teknik destek hizmetlerine ait bilgiler sunulmuştur.`}
      </Text>
      <Text style={s.para}>
        {`Hotspot Gateway ürünlerimiz; 5651 sayılı Kanun kapsamında kullanıcı doğrulama, loglama, raporlama ve güvenli internet erişimi ihtiyaçlarını karşılamak üzere geliştirilmiş kurumsal bir çözümdür. Kamu kurumları, belediyeler, üniversiteler, sağlık kuruluşları, turizm işletmeleri ve özel sektör firmaları tarafından başarıyla kullanılmaktadır.`}
      </Text>
      <Text style={s.para}>
        {`Yüksek performans, kolay yönetim, yük dengeleme, içerik filtreleme ve gelişmiş raporlama özelliklerinin yanı sıra, yıllık lisans yenileme veya abonelik maliyeti gerektirmemesi sayesinde önemli bir işletme maliyeti avantajı sağlamaktadır.`}
      </Text>
      <Text style={s.para}>
        {`Ürünlerimiz 2 yıl donanım garantisi ile birlikte sunulmakta olup, aynı süre boyunca uzaktan bakım, teknik destek ve yazılım güncelleme hizmetlerini kapsamaktadır.`}
      </Text>
      <Text style={s.regards}>Saygılarımızla</Text>

      {/* Ürün bölümü başlığı */}
      <Text style={s.productSectionTitle}>FİYAT TEKLİFİMİZ</Text>

      {/* Fiyat tablosu */}
      <View style={s.priceTable}>
        <View style={s.priceTableHead}>
          <Text style={[s.pth, s.pthBorder, s.colDesc]}>Ürün Açıklama</Text>
          <Text style={[s.pth, s.pthBorder, s.colQty, { textAlign: "center" }]}>Adet</Text>
          <Text style={[s.pth, s.colTotal, { textAlign: "right" }]}>Tutar</Text>
        </View>
        {data.lineItems.map((item, i) => (
          <View key={i} style={[s.ptRow, i % 2 === 1 ? s.ptRowAlt : {}]}>
            <Text style={[s.ptd, s.colDesc]}>
              {item.productCode ? `${item.productCode} – ` : ""}{item.description}
            </Text>
            <Text style={[s.ptd, s.colQty, { textAlign: "center" }]}>{item.quantity}</Text>
            <Text style={[s.ptdLast, s.colTotal]}>{item.lineTotal}</Text>
          </View>
        ))}
      </View>

      <Text style={s.kdvNote}>• Fiyatlara {data.taxLabel} Dahil Değildir.</Text>

      <PageFooter company={data.companyHeader} />
    </Page>
  );
}

// ── Sayfa 2: Koşullar sayfası ─────────────────────────────────

function TermsPage({ data }: { data: QuotePdfData }) {
  return (
    <Page size="A4" style={s.page}>
      <PageBanner logoSrc={data.logoImagePath} accentSrc={data.accentImagePath} />

      <Text style={s.sectionTitle}>KURULUM</Text>
      <Text style={s.bodyText}>
        {`Sistemin yerinde kurulumu, devreye alınması, kullanıcı eğitimi ve ağ (network) yapılandırma hizmetleri teklif kapsamında olup herhangi bir ek ücrete tabi değildir.`}
      </Text>

      <Text style={s.sectionTitle}>ÖDEME ŞEKLİ VE ZAMANI</Text>
      <Text style={s.bodyText}>
        Belirtilen fiyatlara {data.taxLabel} dahil değildir.
      </Text>
      <Text style={s.bodyText}>
        KDV dahil toplam tutarın, fatura tarihinden itibaren 7 (yedi) gün içerisinde ödenmesi gerekmektedir.
      </Text>
      <Text style={s.bodyText}>
        {`Faturalandırma ve ödeme işlemlerinde, Türkiye Cumhuriyet Merkez Bankası (TCMB) tarafından ilan edilen ABD Doları satış kuru esas alınacaktır.`}
      </Text>

      <Text style={s.sectionTitle}>GARANTİ VE BAKIM</Text>
      <Text style={s.bodyText}>
        {`Teklifimize konu ürünler, teslim tarihinden itibaren 2 (iki) yıl süreyle uzaktan periyodik bakım, yazılım güncelleme ve teknik destek hizmetlerinden faydalanacaktır.`}
      </Text>
      <Text style={s.bodyText}>
        {`Ürünlerimiz ayrıca 5 (beş) yıl süreyle yedek parça temini ve teknik servis garantisi kapsamında desteklenmektedir.`}
      </Text>

      <Text style={s.sectionTitle}>İLERİYE DÖNÜK ÜCRETLER</Text>
      <Text style={s.bodyText}>
        {`Ürünlerimiz, sunduğu fonksiyonların devamlılığı için YILLIK LİSANS YENİLEME ÜCRETİ veya ABONELİK BEDELİ Gerekmemektedir.`}
      </Text>
      <Text style={s.bodyText}>
        {`Bu sayede işletme maliyetleri öngörülebilir olmakta ve sistemin kullanımı süresince zorunlu lisans yenileme giderleri oluşmamaktadır.`}
      </Text>
      <Text style={s.bodyText}>
        {`Teslim tarihinden itibaren 2 (iki) yıl sonunda, talep edilmesi halinde uzaktan periyodik bakım, yazılım güncelleme ve teknik destek hizmetleri ayrıca ücretlendirilmektedir.`}
      </Text>

      <Text style={s.sectionTitle}>ZAMAN DAMGASI</Text>

      <Text style={s.subSectionTitle}>Zaman Damgası Hizmetleri</Text>
      <Text style={s.bodyText}>
        {`5651 sayılı Kanun kapsamında kayıt altına alınan log verileri zaman damgası ile damgalanmaktadır. Sistemimiz, zaman damgası servisleri ile tam entegre olarak çalışmaktadır.`}
      </Text>
      <Text style={s.bodyText}>
        {`Sistem, günlük operasyonları kapsamında her gün 1 (bir) adet zaman damgası kontörü kullanmaktadır. İlk yıl için gerekli zaman damgası kontörleri ürün ile birlikte sağlanmaktadır.`}
      </Text>
      <Text style={s.bodyText}>
        {`Bakım ve destek hizmeti kapsamında bulunan müşterilerimize; zaman damgası kontörleri, sistem güncellemeleri ve ilgili teknik destek hizmetleri bakım sözleşmesi kapsamında sunulmaktadır.`}
      </Text>

      <Text style={s.subSectionTitle}>SMS Doğrulama Hizmetleri</Text>
      <Text style={s.bodyText}>
        Sistemimiz, sektörde yaygın olarak kullanılan birçok SMS servis sağlayıcısı ile entegre çalışmaktadır.
      </Text>
      <Text style={s.bodyText}>
        {`Mevcut entegrasyon listesinde yer almayan ancak HTTP API desteği sunan SMS servis sağlayıcıları için gerekli entegrasyon ve yazılım geliştirme çalışmaları tarafımızca gerçekleştirilmektedir.`}
      </Text>
      <Text style={s.bodyText}>
        {`Bakım ve destek hizmeti kapsamında bulunan müşterilerimiz; yeni SMS servis sağlayıcı entegrasyonları, entegrasyon güncellemeleri ve ilgili teknik destek hizmetlerinden bakım sözleşmesi kapsamında faydalanabilmektedir.`}
      </Text>
      <Text style={s.bodyText}>
        Bu sayede kurumlar, tercih ettikleri SMS servis sağlayıcısını kullanma esnekliğine sahip olmaktadır.
      </Text>

      <PageFooter company={data.companyHeader} />
    </Page>
  );
}

// ── Sayfa 3+: Referanslar sayfası ───────────────────────────

function ReferencesPage({ data }: { data: QuotePdfData }) {
  return (
    <Page size="A4" style={s.page}>
      <PageBanner logoSrc={data.logoImagePath} accentSrc={data.accentImagePath} />

      <Text style={[s.sectionTitle, { marginTop: 0 }]}>REFERANSLARIMIZ</Text>
      <Text style={s.refIntro}>
        {`Hotspot Gateway ünitelerini kullanan bazı müşterilerimiz aşağıda kategoriler halinde, kurum ve konum bilgileriyle listelenmiştir. Bunların yanı sıra pek çok KOBİ ve işletme tarafından da tercih edilmiştir.`}
      </Text>

      {REFERENCE_CATEGORIES.map((cat) => (
        <View key={cat.title}>
          <Text style={s.refCategoryTitle}>{cat.title}</Text>
          <View style={s.refTable}>
            <View style={s.refTableHead}>
              <Text style={s.refTh}>{cat.colHeader}</Text>
              <Text style={s.refThLoc}>Konum</Text>
            </View>
            {cat.entries.map((entry, i) => (
              <View key={i} style={[s.refRow, i % 2 === 1 ? s.refRowAlt : {}]}>
                <Text style={s.refTd}>{entry.name}</Text>
                <Text style={s.refTdLoc}>{entry.location}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <PageFooter company={data.companyHeader} />
    </Page>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────

export function ReferencedQuotePdfDocument({ data }: { data: QuotePdfData }) {
  return (
    <Document>
      <QuotePage data={data} />
      <TermsPage data={data} />
      <ReferencesPage data={data} />
    </Document>
  );
}
