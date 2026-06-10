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

Font.registerHyphenationCallback((word) => [word]);
import { quoteBrand } from "@/lib/pdf/quote-brand";
import { PDF_FONT_FAMILY } from "@/lib/pdf/register-pdf-fonts";

export type ServiceTicketLineItemPdf = {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxRate: string;
  lineTotal: string;
};

export type ServiceTicketPdfData = {
  // Şirket
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoImagePath?: string | null;
  stampImagePath?: string | null;

  // Servis meta
  ticketNo: string;
  openedAt: string;
  serviceTypeLabel: string;
  priorityLabel: string;
  statusLabel: string;

  // Sistem bilgileri
  systemTypeLabel?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNo?: string | null;
  location?: string | null;
  inventoryNo?: string | null;

  // Müşteri
  customer: {
    legalName: string;
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };

  // Teknik içerik
  description?: string | null;
  workDone?: string | null;
  techNotes?: string | null;
  includeTechNotes: boolean;

  // Kalemler & Özet
  lineItems: ServiceTicketLineItemPdf[];
  subtotal: string;
  taxTotal: string;
  total: string;
  currency: string;

  // Personel
  assignedUserName?: string | null;
};

const C = quoteBrand.colors;
const T = quoteBrand.typography;

const s = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 42,
    fontSize: 9,
    fontFamily: PDF_FONT_FAMILY,
    color: C.text,
    lineHeight: 1.5,
  },
  // Banner
  bannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: C.brandBlue,
  },
  logo: { width: 110, height: 32, objectFit: "contain" },
  bannerRight: { alignItems: "flex-end" },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: C.brandBlue,
    letterSpacing: 0.5,
  },
  bannerSub: { fontSize: 8, color: C.muted, marginTop: 2 },

  // Section header
  sectionHeader: {
    backgroundColor: C.headerBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 4,
  },
  sectionHeaderText: { color: "#FFFFFF", fontSize: 8, fontWeight: "bold", letterSpacing: 0.5 },

  // Row pairs
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 110, fontSize: T.metaLabel, color: C.muted, fontWeight: "bold" },
  value: { flex: 1, fontSize: T.metaValue, color: C.text },

  // Two column grid
  colGrid: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },

  // Text block
  textBlock: {
    backgroundColor: C.surface,
    borderWidth: 0.5,
    borderColor: C.borderLight,
    padding: 7,
    fontSize: T.notesBody,
    lineHeight: 1.6,
    marginBottom: 4,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.brandNavy,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 6,
  },
  tableHeaderCell: { color: "#FFFFFF", fontSize: T.tableHead, fontWeight: "bold" },
  tableRow: { flexDirection: "row", paddingHorizontal: 6, paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: C.borderLight },
  tableRowAlt: { backgroundColor: C.rowAlt },
  tableCell: { fontSize: T.tableCell, color: C.text },

  // Totals
  totalsBox: { marginTop: 4, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", marginBottom: 2 },
  totalLabel: { width: 120, fontSize: T.total, color: C.muted, textAlign: "right", paddingRight: 8 },
  totalValue: { width: 90, fontSize: T.total, color: C.text, textAlign: "right" },
  grandTotalLabel: { width: 120, fontSize: T.totalGrand, fontWeight: "bold", color: C.brandBlue, textAlign: "right", paddingRight: 8 },
  grandTotalValue: { width: 90, fontSize: T.totalGrand, fontWeight: "bold", color: C.brandBlue, textAlign: "right" },

  // Signature area
  signatureRow: { flexDirection: "row", marginTop: 24, gap: 40 },
  signatureBox: { flex: 1, borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 6 },
  signatureLabel: { fontSize: 8, color: C.muted, textAlign: "center" },
  signatureName: { fontSize: 9, fontWeight: "bold", textAlign: "center", marginTop: 2 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 14,
    left: 42,
    right: 42,
    borderTopWidth: 0.5,
    borderTopColor: C.borderLight,
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: C.muted },
});

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionHeaderText}>{title.toUpperCase()}</Text>
    </View>
  );
}

export function ServiceTicketPdfDocument({ data }: { data: ServiceTicketPdfData }) {
  const hasLineItems = data.lineItems.length > 0;
  const hasCosts = hasLineItems || Number(data.total) > 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Banner ── */}
        <View style={s.bannerRow}>
          {data.logoImagePath ? (
            <Image style={s.logo} src={data.logoImagePath} />
          ) : (
            <Text style={{ fontSize: 12, fontWeight: "bold", color: C.brandBlue }}>
              {data.companyName}
            </Text>
          )}
          <View style={s.bannerRight}>
            <Text style={s.bannerTitle}>TEKNİK SERVİS RAPORU</Text>
            <Text style={s.bannerSub}>{data.ticketNo}</Text>
          </View>
        </View>

        {/* ── Servis Bilgileri ── */}
        <SectionHeader title="Servis Bilgileri" />
        <View style={s.colGrid}>
          <View style={s.col}>
            <Field label="Servis No" value={data.ticketNo} />
            <Field label="Tarih" value={data.openedAt} />
            <Field label="Servis Türü" value={data.serviceTypeLabel} />
          </View>
          <View style={s.col}>
            <Field label="Durum" value={data.statusLabel} />
            <Field label="Öncelik" value={data.priorityLabel} />
            {data.assignedUserName && (
              <Field label="Teknisyen" value={data.assignedUserName} />
            )}
          </View>
        </View>

        {/* ── Müşteri Bilgileri ── */}
        <SectionHeader title="Müşteri Bilgileri" />
        <View style={s.colGrid}>
          <View style={s.col}>
            <Field label="Firma Ünvanı" value={data.customer.legalName} />
            <Field label="Yetkili" value={data.customer.contactName} />
          </View>
          <View style={s.col}>
            <Field label="Telefon" value={data.customer.phone} />
            <Field label="E-Posta" value={data.customer.email} />
          </View>
        </View>
        {data.customer.address && (
          <Field label="Adres" value={data.customer.address} />
        )}

        {/* ── Sistem / Cihaz Bilgileri ── */}
        {(data.systemTypeLabel || data.brand || data.model || data.serialNo || data.location) && (
          <>
            <SectionHeader title="Sistem / Cihaz Bilgileri" />
            <View style={s.colGrid}>
              <View style={s.col}>
                <Field label="Sistem Türü" value={data.systemTypeLabel} />
                <Field label="Marka" value={data.brand} />
                <Field label="Model" value={data.model} />
              </View>
              <View style={s.col}>
                <Field label="Seri No" value={data.serialNo} />
                <Field label="Lokasyon" value={data.location} />
                <Field label="Envanter No" value={data.inventoryNo} />
              </View>
            </View>
          </>
        )}

        {/* ── Müşteri Talebi / Arıza Bildirimi ── */}
        {data.description && (
          <>
            <SectionHeader title="Talep / Arıza Bildirimi" />
            <Text style={s.textBlock}>{data.description}</Text>
          </>
        )}

        {/* ── Yapılan İşlem ── */}
        {data.workDone && (
          <>
            <SectionHeader title="Yapılan İşlemler" />
            <Text style={s.textBlock}>{data.workDone}</Text>
          </>
        )}

        {/* ── Teknik Notlar (isteğe bağlı) ── */}
        {data.includeTechNotes && data.techNotes && (
          <>
            <SectionHeader title="Teknik Notlar (Dahili)" />
            <Text style={s.textBlock}>{data.techNotes}</Text>
          </>
        )}

        {/* ── Kullanılan Malzeme ve Hizmetler ── */}
        {hasCosts && (
          <>
            <SectionHeader title="Kullanılan Malzeme ve Hizmetler" />
            {hasLineItems && (
              <>
                {/* Tablo Başlığı */}
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { flex: 3 }]}>Açıklama</Text>
                  <Text style={[s.tableHeaderCell, { width: 36, textAlign: "right" }]}>Miktar</Text>
                  <Text style={[s.tableHeaderCell, { width: 28, textAlign: "center" }]}>Birim</Text>
                  <Text style={[s.tableHeaderCell, { width: 64, textAlign: "right" }]}>Birim Fiyat</Text>
                  <Text style={[s.tableHeaderCell, { width: 30, textAlign: "right" }]}>KDV%</Text>
                  <Text style={[s.tableHeaderCell, { width: 72, textAlign: "right" }]}>Tutar</Text>
                </View>
                {data.lineItems.map((item, i) => (
                  <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={[s.tableCell, { flex: 3 }]}>{item.description}</Text>
                    <Text style={[s.tableCell, { width: 36, textAlign: "right" }]}>{item.quantity}</Text>
                    <Text style={[s.tableCell, { width: 28, textAlign: "center" }]}>{item.unit}</Text>
                    <Text style={[s.tableCell, { width: 64, textAlign: "right" }]}>{item.unitPrice}</Text>
                    <Text style={[s.tableCell, { width: 30, textAlign: "right" }]}>%{item.taxRate}</Text>
                    <Text style={[s.tableCell, { width: 72, textAlign: "right" }]}>{item.lineTotal}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Maliyet Özeti */}
            <View style={s.totalsBox}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Ara Toplam</Text>
                <Text style={s.totalValue}>{data.subtotal} {data.currency}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>KDV</Text>
                <Text style={s.totalValue}>{data.taxTotal} {data.currency}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.grandTotalLabel}>Genel Toplam</Text>
                <Text style={s.grandTotalValue}>{data.total} {data.currency}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── İmza Alanları ── */}
        <View style={s.signatureRow}>
          <View style={s.signatureBox}>
            {data.stampImagePath && (
              <Image
                src={data.stampImagePath}
                style={{ width: 60, height: 40, objectFit: "contain", marginBottom: 4, alignSelf: "center" }}
              />
            )}
            <Text style={s.signatureLabel}>Teknik Servis Yetkilisi</Text>
            {data.assignedUserName && (
              <Text style={s.signatureName}>{data.assignedUserName}</Text>
            )}
          </View>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>Müşteri Yetkilisi</Text>
            <Text style={s.signatureName}>{data.customer.contactName ?? ""}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{data.ticketNo} · {data.customer.legalName}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
            `Sayfa ${pageNumber} / ${totalPages}`
          } />
          <Text style={s.footerText}>{data.companyPhone} · {data.companyEmail}</Text>
        </View>
      </Page>
    </Document>
  );
}
