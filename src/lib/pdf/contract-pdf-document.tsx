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

// Kelime bölünmesini (hyphenation) tamamen kapat
Font.registerHyphenationCallback((word) => [word]);
import { quoteBrand } from "@/lib/pdf/quote-brand";
import { PDF_FONT_FAMILY } from "@/lib/pdf/register-pdf-fonts";

export type ContractDevice = {
  deviceName: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};

export type ContractPdfData = {
  // Şirket / görsel
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoImagePath?: string | null;
  accentImagePath?: string | null;
  stampImagePath?: string | null;
  zarfImagePath?: string | null;

  // Sözleşme meta
  contractNumber: string;
  contractDate: string;
  contractStartDate: string;
  contractEndDate: string;

  // Müşteri
  customer: {
    legalName: string;
    taxNumber: string;
    taxOffice: string;
    address: string;
    phone: string;
    email: string;
    contactName?: string | null;
  };

  // Bedel & cihazlar
  contractAmount: string;
  invoiceNumber: string;
  devices: ContractDevice[];

  // İmza durumu
  isSigned: boolean;
  signedAt?: string | null;
};

const C = quoteBrand.colors;

const s = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingBottom: 38,   // fixed footer için rezerv alan
    paddingHorizontal: 42,
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
    marginBottom: 0,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: C.brandBlue,
  },
  bannerLeft: {
    flex: 1,
    justifyContent: "center",
  },
  bannerRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  logo: { width: 160 },
  accent: { height: quoteBrand.layout.accentHeight },
  // zarf: 141×573 px → oranı koruyarak yükseklik=72 → genişlik≈18
  zarfImg: { height: 72, width: 18 },

  // ── Şirket ──────────────────────────────────────────────────
  companyBlock: {
    paddingTop: 5,
    paddingBottom: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
    marginBottom: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  companyLine: { fontSize: 8, color: C.muted, marginBottom: 1 },
  companyMuted: { fontSize: 7.5, color: C.muted, marginBottom: 1 },

  // ── Belge başlığı ────────────────────────────────────────────
  docTitleWrap: {
    backgroundColor: C.brandNavy,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 9,
  },
  docTitle: {
    fontSize: 9,          // 10 → 9pt: kelime bölünmeden tek/iki satıra sığdır
    fontWeight: 700,
    textAlign: "center",
    color: "#FFFFFF",
    letterSpacing: 0,     // 0.6 → 0: ekstra boşluk kaldırıldı
  },
  docSubTitle: {
    fontSize: 7.5,
    fontWeight: 400,
    textAlign: "center",
    color: "#A8BED4",
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // ── Meta satır (üstte 2 sütun) ─────────────────────────────
  metaBand: {
    flexDirection: "row",
    marginBottom: 9,
    gap: 6,
  },
  metaCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: C.borderLight,
    backgroundColor: C.surface,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  metaRow: { flexDirection: "row", marginBottom: 2.5 },
  metaLabel: { width: 100, fontSize: 8, color: C.muted },
  metaValue: { flex: 1, fontSize: 8, fontWeight: 700, color: C.text },

  // ── Taraf bilgi kutusu ───────────────────────────────────────
  partiesRow: {
    flexDirection: "row",
    marginBottom: 9,
    gap: 6,
  },
  partyBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: C.borderLight,
    borderTopWidth: 2,
    borderTopColor: C.brandBlue,
    backgroundColor: C.surface,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  partyTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: C.brandBlue,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  partyLine: { fontSize: 8.5, fontWeight: 700, color: C.text, marginBottom: 2 },
  partyMuted: { fontSize: 7.5, color: C.muted, marginBottom: 1 },

  // ── Sözleşme maddeleri ───────────────────────────────────────
  sectionTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: C.brandNavy,
    marginTop: 7,
    marginBottom: 2,
    borderLeftWidth: 2.5,
    borderLeftColor: C.brandBlue,
    paddingLeft: 5,
  },
  bodyText: {
    fontSize: 8,
    color: C.text,
    lineHeight: 1.6,
    marginBottom: 3,
    textAlign: "justify",
  },

  // ── EK-1 tablosu ─────────────────────────────────────────────
  ek1Title: {
    fontSize: 8.5,
    fontWeight: 700,
    color: C.brandNavy,
    marginTop: 9,
    marginBottom: 4,
    borderLeftWidth: 2.5,
    borderLeftColor: C.brandBlue,
    paddingLeft: 5,
  },
  table: {
    borderWidth: 0.5,
    borderColor: C.borderLight,
    marginBottom: 6,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.brandNavy,
  },
  th: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: "#2E4054",
    letterSpacing: 0.3,
  },
  thLast: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 5,
    letterSpacing: 0.3,
  },
  trow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  trowAlt: { backgroundColor: C.rowAlt },
  td: {
    fontSize: 8,
    color: C.text,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: C.borderLight,
  },
  tdLast: {
    fontSize: 8,
    color: C.text,
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  colNo:      { width: "8%" },
  colProduct: { width: "57%" },
  colSerial:  { width: "35%" },

  // ── İmza alanı ───────────────────────────────────────────────
  signatureSection: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",   // kutu yüksekliklerini birbirine eşitleme
  },
  signatureBox: {
    width: "44%",
    alignItems: "center",
    flexShrink: 0,              // dikey stretching engelle
  },
  signatureHeader: {
    backgroundColor: C.brandNavy,
    width: "100%",
    paddingVertical: 5,
    alignItems: "center",
    marginBottom: 6,
  },
  signatureTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  signatureLine: {
    fontSize: 8,
    color: C.muted,
    textAlign: "center",
    marginBottom: 2,
  },
  signatureNameLine: {
    fontSize: 8.5,
    fontWeight: 700,
    color: C.text,
    textAlign: "center",
    marginBottom: 2,
  },
  signatureUnderline: {
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
    width: "80%",
    marginTop: 12,   // 28→12: fiziksel yazı alanını kompakt tut
    marginBottom: 3,
  },
  stampImage: {
    width: 105,
    marginTop: 6,
    marginBottom: 2,
  },
  signedBadge: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#43A047",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  signedBadgeText: {
    fontSize: 8,
    color: "#2E7D32",
    fontWeight: 700,
  },

  footer: {
    fontSize: 6.5,
    color: C.muted,
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: C.borderLight,
    paddingTop: 4,
    letterSpacing: 0.2,
  },
  fixedFooter: {
    position: "absolute",
    bottom: 12,
    left: 42,
    right: 42,
  },

  // ── Liste öğeleri ─────────────────────────────────────────────
  listRow: {
    flexDirection: "row",
    marginBottom: 1.5,
    paddingLeft: 12,
  },
  listBullet: {
    width: 20,
    fontSize: 8,
    color: C.text,
    lineHeight: 1.6,
  },
  listText: {
    flex: 1,
    fontSize: 8,
    color: C.text,
    lineHeight: 1.6,
    textAlign: "justify",
  },
});

/** Düz metin içerikli madde */
function Madde({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={s.sectionTitle}>{no}: {title}</Text>
      <Text style={s.bodyText}>{children}</Text>
    </View>
  );
}

/** JSX children kabul eden madde (listeler için) */
function MaddeView({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={s.sectionTitle}>{no}: {title}</Text>
      {children}
    </View>
  );
}

/** a) b) c) ... şeklinde harfli liste öğesi */
function ListItemLettered({ letter, text }: { letter: string; text: string }) {
  return (
    <View style={s.listRow}>
      <Text style={s.listBullet}>{letter})</Text>
      <Text style={s.listText}>{text}</Text>
    </View>
  );
}

/** • madde işaretli liste öğesi */
function BulletItem({ text }: { text: string }) {
  return (
    <View style={s.listRow}>
      <Text style={s.listBullet}>•</Text>
      <Text style={s.listText}>{text}</Text>
    </View>
  );
}

export function ContractPdfDocument({ data }: { data: ContractPdfData }) {
  const { customer: c } = data;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Banner ── */}
        <View style={s.bannerRow}>
          <View style={s.bannerLeft}>
            {data.logoImagePath ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.logoImagePath} style={s.logo} cache={false} />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: "bold", color: C.brandNavy }}>BBS TEKNOLOJİ</Text>
            )}
          </View>
          {data.zarfImagePath ? (
            <View style={s.bannerRight}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={data.zarfImagePath} style={s.zarfImg} cache={false} />
            </View>
          ) : null}
        </View>

        {/* ── Başlık: tek satır tercihli, hyphenation kapalı ── */}
        <View style={s.docTitleWrap}>
          <Text style={s.docTitle}>
            TİNAX HOTSPOT GATEWAY ÜRÜNLERİ İÇİN UZAKTAN BAKIM VE GÜNCELLEME HİZMET SÖZLEŞMESİ
          </Text>
        </View>

        {/* ── Meta + Taraflar ── */}
        <View style={s.metaBand}>
          {/* Sol: sözleşme bilgileri */}
          <View style={s.metaCard}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Sözleşme No</Text>
              <Text style={s.metaValue}>{data.contractNumber}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Sözleşme Tarihi</Text>
              <Text style={s.metaValue}>{data.contractDate}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Başlangıç Tarihi</Text>
              <Text style={s.metaValue}>{data.contractStartDate}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Bitiş Tarihi</Text>
              <Text style={s.metaValue}>{data.contractEndDate}</Text>
            </View>
          </View>
          {/* Sağ: bedel */}
          <View style={s.metaCard}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Sözleşme Bedeli</Text>
              <Text style={s.metaValue}>{data.contractAmount}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Fatura No</Text>
              <Text style={s.metaValue}>{data.invoiceNumber || "—"}</Text>
            </View>
          </View>
        </View>

        {/* ── Taraflar ── */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyTitle}>Hizmet Sağlayıcı</Text>
            <Text style={s.partyLine}>BBS Teknoloji – Kadir Kurt</Text>
            <Text style={s.partyMuted}>Üniversite Mah. İpekyolu Cad. Ata Teknokent No:22/212 Yakutiye / ERZURUM</Text>
            <Text style={s.partyMuted}>{data.companyPhone}  •  {data.companyEmail}</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyTitle}>Müşteri</Text>
            <Text style={s.partyLine}>{c.legalName}</Text>
            <Text style={s.partyMuted}>VKN: {c.taxNumber}  •  VD: {c.taxOffice}</Text>
            <Text style={s.partyMuted}>{c.address}</Text>
            <Text style={s.partyMuted}>Tel: {c.phone}{c.email ? `  •  ${c.email}` : ""}</Text>
            {c.contactName ? <Text style={s.partyMuted}>Yetkili: {c.contactName}</Text> : null}
          </View>
        </View>

        {/* ── Giriş metni ── */}
        <Text style={s.bodyText}>
          {`İşbu sözleşme, Üniversite Mah. İpekyolu Cad. Ata Teknokent No:22 İç Kapı No:212 Yakutiye / Erzurum adresinde faaliyet gösteren BBS Teknoloji – Kadir Kurt (bundan sonra "BBS Teknoloji" olarak anılacaktır) ile `}{c.legalName}{` (Vergi No: `}{c.taxNumber}{`, Vergi Dairesi: `}{c.taxOffice}{`, Tel: `}{c.phone}{c.email ? `, E-Posta: ${c.email}` : ""}{`) (bundan sonra "Müşteri" olarak anılacaktır) arasında akdedilmiştir.`}
        </Text>
        <Text style={s.bodyText}>
          Taraflar yukarıda belirtilen adreslerin yasal tebligat adresleri olduğunu kabul ederler.
        </Text>

        <Madde no="Madde 1" title="Taraflar">
          {`Üniversite Mah. İpekyolu Cad. Ata Teknokent No:22 İç Kapı No:212 Yakutiye / Erzurum adresinde faaliyet gösteren BBS Teknoloji – Kadir Kurt ile ${c.legalName} (Vergi No: ${c.taxNumber}, Adres: ${c.address}) arasında akdedilmiştir.`}
        </Madde>

        <Madde no="Madde 2" title="Sözleşmenin Konusu">
          {`İşbu sözleşmenin konusu, Ek-1'de belirtilen Tinax Hotspot Gateway cihazlarının uzaktan bakım, yönetim, izleme, yazılım güncelleme ve teknik destek hizmetlerinin BBS Teknoloji tarafından sağlanmasıdır.`}
        </Madde>

        <Madde no="Madde 3" title="Sözleşme Kapsamındaki Donanımlar">
          {`Sözleşme kapsamındaki cihazlar Ek-1'de belirtilmiştir.`}
        </Madde>

        <MaddeView no="Madde 4" title="Hizmet Kapsamı">
          <ListItemLettered letter="a" text="Uzaktan sistem yönetimi" />
          <ListItemLettered letter="b" text="Uzaktan bakım ve teknik destek" />
          <ListItemLettered letter="c" text="Sistem çalışma durumunun takibi" />
          <ListItemLettered letter="d" text="Yazılım güncellemeleri" />
          <ListItemLettered letter="e" text="Sistem loglarının yönetimi" />
          <ListItemLettered letter="f" text="Zaman damgası hizmetleri" />
          <ListItemLettered letter="g" text="Sözleşme dönemi boyunca 1 adet SMS entegrasyonu geliştirilmesi" />
          <ListItemLettered letter="h" text="Sözleşme dönemi boyunca 1 adet özel entegrasyon geliştirilmesi" />
          <Text style={[s.bodyText, { marginTop: 4 }]}>
            {"Yazılım güncellemeleri kapsamında hata düzeltmeleri, güvenlik güncellemeleri ve mevcut fonksiyonların iyileştirilmesi ücretsiz olarak sağlanır. Yeni modüller, müşteriye özel geliştirmeler ve kapsam dışı talepler ayrıca ücretlendirilir."}
          </Text>
        </MaddeView>

        <MaddeView no="Madde 5" title="Hizmet Kapsamı Dışındaki İşler">
          <BulletItem text="Garanti dışı donanım arızaları ve donanım değişimleri" />
          <BulletItem text="Ek entegrasyon talepleri ve müşteriye özel yazılım geliştirmeleri" />
          <BulletItem text="Yerinde servis hizmetleri" />
          <BulletItem text="Mesai dışı destek hizmetleri" />
          <BulletItem text="Üçüncü taraf sistem entegrasyonları" />
        </MaddeView>

        <Madde no="Madde 6" title="Müşterinin Yükümlülükleri">
          {"Müşteri; elektrik altyapısını, internet bağlantısını, cihazların fiziksel güvenliğini ve gerekli erişim bilgilerini sağlamakla yükümlüdür. Bu unsurlardan kaynaklanan kesintilerden BBS Teknoloji sorumlu tutulamaz."}
        </Madde>

        <Madde no="Madde 7" title="Destek ve Müdahale Süreleri">
          {"Mesai saatleri içerisinde bildirilen arızalara mümkün olan en kısa sürede uzaktan müdahale edilir. Uzaktan çözülemeyen durumlarda yerinde servis prosedürü uygulanır.\n\nArıza, destek ve hizmet talepleri telefon, e-posta veya BBS Teknoloji tarafından belirlenen destek kanalları üzerinden iletilir.\n\nMesai saatleri dışında yapılan bildirimler takip eden ilk mesai günü içerisinde değerlendirilir.\n\nTüm destek taleplerinde öncelikli çözüm yöntemi uzaktan müdahaledir."}
        </Madde>

        <Madde no="Madde 8" title="Yerinde Servis">
          {"Erzurum il sınırları içerisindeki yerinde servis hizmetleri, hizmet tarihinde yürürlükte bulunan servis tarifesine göre ücretlendirilir. Erzurum dışındaki yerinde servis taleplerinde ulaşım, konaklama ve diğer seyahat giderleri müşteriye aittir."}
        </Madde>

        <Madde no="Madde 9" title="Garanti ve Arıza İşlemleri">
          {"Garanti kapsamındaki cihazlar öncelikli olarak değerlendirilir. Onarımı mümkün olmayan cihazlar üretici veya ithalatçı firma garanti şartları doğrultusunda değiştirilir."}
        </Madde>

        <Madde no="Madde 10" title="Veri Güvenliği ve Yedekleme">
          {"Müşteri, sistemlerinde bulunan tüm verilerin düzenli olarak yedeklenmesinden sorumludur. BBS Teknoloji; veri kaybı, veri bozulması, kullanıcı hataları, elektrik kesintileri, internet kesintileri, üçüncü taraf yazılımlar veya siber saldırılar nedeniyle oluşabilecek doğrudan veya dolaylı zararlardan sorumlu tutulamaz."}
        </Madde>

        <Madde no="Madde 11" title="Gizlilik">
          {"Taraflar sözleşme süresince öğrendikleri ticari, teknik ve operasyonel bilgileri gizli tutmayı kabul ederler."}
        </Madde>

        <Madde no="Madde 12" title="Kişisel Verilerin Korunması">
          {"Taraflar, 6698 Sayılı Kişisel Verilerin Korunması Kanunu kapsamında gerekli tüm yükümlülüklere uyacaklarını kabul ederler."}
        </Madde>

        <Madde no="Madde 13" title="Sözleşme Bedeli ve Ödeme">
          {`Yıllık hizmet bedeli ${data.contractAmount} + KDV'dir. Faturalar, fatura tarihinden itibaren 7 gün içerisinde ödenir. BBS Teknoloji; TÜFE, ÜFE, döviz kuru, personel giderleri, maliyet artışları ve hizmet kapsamındaki değişiklikleri dikkate alarak sözleşme bedelini güncelleme hakkını saklı tutar.`}
        </Madde>

        <Madde no="Madde 14" title="Hizmetin Askıya Alınması">
          {"Fatura bedellerinin vadesinde ödenmemesi halinde BBS Teknoloji hizmeti geçici olarak durdurabilir. Ödeme yapılıncaya kadar hizmet verilmemesi müşterinin ödeme yükümlülüğünü ortadan kaldırmaz."}
        </Madde>

        <Madde no="Madde 15" title="Sözleşmenin Süresi ve Yenilenmesi">
          {`Sözleşme ${data.contractStartDate} tarihinde başlar ve ${data.contractEndDate} tarihinde sona erer. Taraflardan herhangi biri sözleşme bitiş tarihinden en az 30 gün önce yazılı fesih bildiriminde bulunmadığı takdirde işbu sözleşme, BBS Teknoloji tarafından belirlenen ve yenileme tarihinde yürürlükte bulunan güncel yıllık bakım hizmet bedeli ile sözleşme koşulları üzerinden 1 yıllık sürelerle kendiliğinden yenilenir.`}
        </Madde>

        <Madde no="Madde 16" title="Fesih">
          {"Taraflardan herhangi biri sözleşme hükümlerinin ağır şekilde ihlal edilmesi halinde işbu sözleşmeyi yazılı bildirimde bulunarak tek taraflı olarak feshedebilir."}
        </Madde>

        <Madde no="Madde 17" title="Mücbir Sebep">
          {"Doğal afetler, savaş, terör olayları, internet altyapı arızaları, enerji kesintileri, kamu kurumlarının kararları ve tarafların kontrolü dışında gelişen olaylar mücbir sebep sayılır."}
        </Madde>

        <Madde no="Madde 18" title="Sorumluluğun Sınırlandırılması">
          {"BBS Teknoloji'nin işbu sözleşmeden doğabilecek toplam sorumluluğu hiçbir durumda ilgili sözleşme dönemine ait yıllık hizmet bedeli tutarını aşamaz.\n\nBBS Teknoloji hiçbir durumda müşterinin kâr kaybı, gelir kaybı, iş kaybı, veri kaybı, müşteri kaybı veya üçüncü kişilerden kaynaklanan talepleri nedeniyle oluşabilecek dolaylı zararlardan sorumlu tutulamaz."}
        </Madde>

        <Madde no="Madde 19" title="Devir">
          {"Taraflar, diğer tarafın yazılı onayı olmaksızın işbu sözleşmeden doğan hak ve yükümlülüklerini üçüncü kişilere devredemez."}
        </Madde>

        <Madde no="Madde 20" title="Yetkili Mahkeme">
          {"İşbu sözleşmeden kaynaklanan veya işbu sözleşme ile bağlantılı her türlü uyuşmazlıkta, hizmet sağlayıcı şirketin merkezinin bulunduğu yer mahkemeleri ve icra müdürlükleri yetkilidir."}
        </Madde>

        <Madde no="Madde 21" title="Ekler">
          {`EK-1 : Hizmet Kapsamındaki Cihazlar\nEK-2 : Firmanın Kestiği İlgili Fatura${data.invoiceNumber ? ` No: ${data.invoiceNumber}` : ""}`}
        </Madde>

        {/* ── EK-1: Cihaz tablosu — sayfa keserek devam edebilir ── */}
        <Text style={s.ek1Title}>EK-1 : Hizmet Kapsamındaki Cihazlar</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.th, s.colNo]}>No</Text>
            <Text style={[s.th, s.colProduct]}>Ürün Adı</Text>
            <Text style={[s.thLast, s.colSerial]}>Seri No</Text>
          </View>
          {data.devices.length === 0 ? (
            <View style={s.trow}>
              <Text style={[s.td, s.colNo]}>—</Text>
              <Text style={[s.td, s.colProduct]}>Cihaz kaydı bulunmamaktadır</Text>
              <Text style={[s.tdLast, s.colSerial]}>—</Text>
            </View>
          ) : data.devices.map((d, i) => (
            <View key={i} style={[s.trow, i % 2 === 1 ? s.trowAlt : {}]}>
              <Text style={[s.td, s.colNo]}>{i + 1}</Text>
              <Text style={[s.td, s.colProduct]}>{d.model?.trim() || d.deviceName}</Text>
              <Text style={[s.tdLast, s.colSerial]}>{d.serialNumber || "—"}</Text>
            </View>
          ))}
        </View>

        {/* ── EK-2 + İmza — aynı sayfada, sayfa kesmesi yok ── */}
        <View wrap={false}>
          <Text style={s.ek1Title}>
            {`EK-2 : Firmanın Kestiği İlgili Fatura${data.invoiceNumber ? ` No: ${data.invoiceNumber}` : ""}`}
          </Text>

          <View style={s.signatureSection}>
            {/* Sol: İdare (müşteri) */}
            <View style={s.signatureBox}>
              <View style={s.signatureHeader}>
                <Text style={s.signatureTitle}>İdare</Text>
              </View>
              <Text style={s.signatureNameLine}>{c.legalName}</Text>
              {c.contactName && c.contactName.trim() !== c.legalName.trim() ? (
                <Text style={s.signatureLine}>{c.contactName}</Text>
              ) : null}
              <View style={s.signatureUnderline} />
              <Text style={{ fontSize: 7, color: C.muted }}>İmza / Kaşe</Text>
            </View>

            {/* Sağ: BBS Teknoloji */}
            <View style={s.signatureBox}>
              <View style={s.signatureHeader}>
                <Text style={s.signatureTitle}>BBS Teknoloji</Text>
              </View>
              <Text style={s.signatureNameLine}>Kadir Kurt</Text>
              {/* Kaşe: yalnızca imzalandığında görünür, çizginin üstünde */}
              {data.isSigned && data.stampImagePath ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={data.stampImagePath} style={s.stampImage} cache={false} />
              ) : null}
              {/* Çizgi ve etiket: imzalı/imzasız her durumda göster */}
              <View style={s.signatureUnderline} />
              <Text style={{ fontSize: 7, color: C.muted }}>İmza / Kaşe</Text>
            </View>
          </View>
        </View>

        {/* ── Fixed footer: sadece sayfa numarası ── */}
        <View style={s.fixedFooter} fixed>
          <Text
            style={s.footer}
            render={({ pageNumber, totalPages }) =>
              `Sayfa ${pageNumber} / ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
}
