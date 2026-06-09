import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { quoteBrand } from "@/lib/pdf/quote-brand";
import { PDF_FONT_FAMILY } from "@/lib/pdf/register-pdf-fonts";
import type { PdfHeaderCompany } from "@/lib/pdf/pdf-header";

export type QuotePdfData = {
  companyHeader: PdfHeaderCompany;
  logoImagePath?: string | null;
  accentImagePath?: string | null;
  stampImagePath?: string | null;
  mobilePhone?: string | null;
  addressLines: string[];
  quoteNumber: string;
  quoteDate: string;
  version: number;
  currency: string;
  currencyLabel: string;
  customer: {
    legalName: string;
    tradeName?: string | null;
    contactName?: string | null;
  };
  title: string;
  taxLabel: string;
  lineItems: Array<{
    productCode: string;
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
  subtotal: string;
  taxTotal: string;
  total: string;
  notes?: string | null;
  terms?: string | null;
};

const C = quoteBrand.colors;
const T = quoteBrand.typography;

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 32,
    fontSize: T.body,
    fontFamily: PDF_FONT_FAMILY,
    color: C.text,
  },
  bannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: quoteBrand.layout.bannerHeight,
    marginBottom: 8,
  },
  bannerLeft: {
    flex: 1,
    maxWidth: "82%",
    justifyContent: "flex-end",
    paddingRight: 12,
    paddingBottom: quoteBrand.layout.bottomInset,
  },
  bannerRight: {
    width: quoteBrand.layout.bannerRightWidth,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingBottom: quoteBrand.layout.bottomInset,
  },
  logo: {
    width: quoteBrand.layout.logoWidth,
  },
  accent: {
    height: quoteBrand.layout.accentHeight,
  },
  companyBlock: {
    marginBottom: 10,
    maxWidth: 531,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  companyAddressLine: {
    fontSize: T.body,
    fontWeight: 400,
    marginBottom: 2,
    lineHeight: 1.4,
    maxWidth: 531,
    color: C.text,
  },
  companyContactLine: {
    fontSize: T.metaLabel,
    fontWeight: 400,
    marginBottom: 1,
    lineHeight: 1.45,
    maxWidth: 531,
    color: C.muted,
  },
  metaBlock: {
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    minHeight: 13,
  },
  metaLabel: {
    width: 118,
    fontSize: T.metaLabel,
    fontWeight: 400,
    lineHeight: 1.55,
    paddingRight: 8,
    color: C.muted,
  },
  metaValue: {
    flex: 1,
    fontSize: T.metaValue,
    fontWeight: 700,
    lineHeight: 1.55,
    color: C.text,
  },
  separator: {
    borderBottomWidth: 2,
    borderBottomColor: C.brandBlue,
    marginBottom: 0,
  },
  table: {
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  tableHeadRow: {
    flexDirection: "row",
    backgroundColor: C.headerBg,
    borderBottomWidth: 2,
    borderBottomColor: C.brandBlue,
  },
  tableHeadSubRow: {
    flexDirection: "row",
    backgroundColor: C.brandNavy,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  th: {
    fontWeight: 700,
    fontSize: T.tableHead,
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: "#2E4054",
    color: C.headerText,
  },
  thLast: {
    fontWeight: 700,
    fontSize: T.tableHead,
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    color: C.headerText,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
    minHeight: 26,
  },
  rowAlt: {
    backgroundColor: C.rowAlt,
  },
  cell: {
    fontSize: T.tableCell,
    fontWeight: 400,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: C.borderLight,
    lineHeight: 1.45,
    color: C.text,
  },
  cellLast: {
    fontSize: T.tableCell,
    fontWeight: 400,
    paddingVertical: 5,
    paddingHorizontal: 5,
    lineHeight: 1.45,
    color: C.text,
  },
  colCode: { width: "14%" },
  colDesc: { width: "46%" },
  colQty: { width: "8%", textAlign: "center" },
  colPrice: { width: "16%", textAlign: "right" },
  colTotal: { width: "16%", textAlign: "right", fontWeight: 700 },
  colPriceSpan: { width: "32%" },
  summaryWrap: {
    marginTop: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  summaryPanel: {
    width: "52%",
    borderWidth: 1,
    borderColor: C.borderLight,
    borderTopWidth: 0,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: C.brandBlueLight,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  summaryRowAlt: {
    backgroundColor: C.surface,
  },
  summaryLabel: {
    fontSize: T.total,
    fontWeight: 400,
    color: C.totalLabel,
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: T.total,
    fontWeight: 700,
    color: C.text,
    textAlign: "right",
  },
  grandTotalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.brandBlue,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 3,
    borderTopColor: C.brandBlueDark,
  },
  grandTotalLabel: {
    fontSize: T.totalGrand,
    fontWeight: 700,
    color: C.totalOnBlue,
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: C.totalOnBlue,
    textAlign: "right",
  },
  notesBox: {
    marginTop: 14,
    borderWidth: 0.5,
    borderColor: C.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: C.brandBlue,
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  notesTitle: {
    fontSize: T.notesTitle,
    fontWeight: 700,
    color: C.muted,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  notesBody: {
    fontSize: T.notesBody,
    fontWeight: 400,
    lineHeight: 1.55,
    color: C.text,
  },
  signatureArea: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBox: {
    width: "52%",
    borderWidth: 0.5,
    borderColor: C.borderLight,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: "flex-end",
  },
  signatureLabel: {
    fontSize: T.notesTitle,
    fontWeight: 700,
    color: C.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    alignSelf: "flex-start",
  },
  stampImage: {
    width: 110,
    height: 55,
    objectFit: "contain",
  },
});

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value || " "}</Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  alt,
}: {
  label: string;
  value: string;
  alt?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, ...(alt ? [styles.summaryRowAlt] : [])]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function QuoteSummary({
  subtotal,
  taxLabel,
  taxTotal,
  total,
}: {
  subtotal: string;
  taxLabel: string;
  taxTotal: string;
  total: string;
}) {
  return (
    <View style={styles.summaryWrap}>
      <View style={styles.summaryPanel}>
        <SummaryRow label="ARA TOPLAM" value={subtotal} />
        <SummaryRow label={taxLabel} value={taxTotal} alt />
        <View style={styles.grandTotalBar}>
          <Text style={styles.grandTotalLabel}>GENEL TOPLAM</Text>
          <Text style={styles.grandTotalValue}>{total}</Text>
        </View>
      </View>
    </View>
  );
}

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  const logoSrc = data.logoImagePath;
  const accentSrc = data.accentImagePath;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.bannerRow}>
          <View style={styles.bannerLeft}>
            {logoSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image
              <Image src={logoSrc} style={styles.logo} cache={false} />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                {data.companyHeader.name}
              </Text>
            )}
          </View>
          <View style={styles.bannerRight}>
            {accentSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image
              <Image src={accentSrc} style={styles.accent} cache={false} />
            ) : null}
          </View>
        </View>

        <View style={styles.companyBlock}>
          {data.addressLines.map((line, i) => (
            <Text key={i} style={styles.companyAddressLine}>
              {line}
            </Text>
          ))}
          <Text style={[styles.companyContactLine, { marginTop: 3 }]}>
            {data.companyHeader.phone}
          </Text>
          {data.mobilePhone ? (
            <Text style={styles.companyContactLine}>{data.mobilePhone}</Text>
          ) : null}
        </View>

        <View style={styles.metaBlock}>
          <MetaRow label="Teklif No:" value={data.quoteNumber} />
          <MetaRow label="Tarih:" value={data.quoteDate} />
          <MetaRow label="Para Birimi:" value={data.currencyLabel} />
          <MetaRow label="Teklif Konusu:" value={data.title} />
          <MetaRow
            label="Teklifi Alan Firma:"
            value={data.customer.tradeName ?? data.customer.legalName}
          />
          <MetaRow
            label="İlgili Kişi:"
            value={data.customer.contactName ?? ""}
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.table}>
          <View style={styles.tableHeadRow}>
            <Text style={[styles.th, styles.colCode]}>Ürün Kodu</Text>
            <Text style={[styles.th, styles.colDesc]}>Açıklama</Text>
            <Text style={[styles.th, styles.colQty]}>Adet</Text>
            <Text style={[styles.th, styles.colPriceSpan]}>Fiyat</Text>
          </View>
          <View style={styles.tableHeadSubRow}>
            <Text style={[styles.th, styles.colCode]} />
            <Text style={[styles.th, styles.colDesc]} />
            <Text style={[styles.th, styles.colQty]} />
            <Text style={[styles.th, styles.colPrice]}>Birim</Text>
            <Text style={[styles.thLast, styles.colTotal]}>Toplam</Text>
          </View>

          {data.lineItems.map((line, i) => (
            <View
              key={i}
              style={[styles.row, ...(i % 2 === 1 ? [styles.rowAlt] : [])]}
            >
              <Text style={[styles.cell, styles.colCode]}>
                {line.productCode}
              </Text>
              <Text style={[styles.cell, styles.colDesc]}>
                {line.description}
              </Text>
              <Text style={[styles.cell, styles.colQty]}>{line.quantity}</Text>
              <Text style={[styles.cell, styles.colPrice]}>
                {line.unitPrice}
              </Text>
              <Text style={[styles.cellLast, styles.colTotal]}>
                {line.lineTotal}
              </Text>
            </View>
          ))}
        </View>

        <QuoteSummary
          subtotal={data.subtotal}
          taxLabel={data.taxLabel}
          taxTotal={data.taxTotal}
          total={data.total}
        />

        {data.notes?.trim() ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notlar</Text>
            <Text style={styles.notesBody}>{data.notes}</Text>
          </View>
        ) : null}

        {data.terms?.trim() ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Şartlar</Text>
            <Text style={styles.notesBody}>{data.terms}</Text>
          </View>
        ) : null}

        {data.stampImagePath ? (
          <View style={styles.signatureArea}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>BBS TEKNOLOJİ</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image */}
              <Image
                src={data.stampImagePath}
                style={styles.stampImage}
                cache={false}
              />
            </View>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
