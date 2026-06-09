import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ReactNode } from "react";

/** Sol sütun: logo + şirket bilgileri (pdfmake `columns[0]` / `columns[1].stack` karşılığı). */
export type PdfHeaderCompany = {
  name: string;
  email: string;
  phone: string;
  address: string;
  logoPath?: string | null;
  taxNumber?: string;
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 16,
  },
  companyRow: {
    flexDirection: "row",
    flex: 1,
    maxWidth: "62%",
  },
  logo: {
    width: 80,
    objectFit: "contain",
  },
  stack: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  line: {
    fontSize: 9,
    color: "#525252",
    marginBottom: 2,
  },
  tax: {
    fontSize: 8,
    color: "#525252",
    marginBottom: 4,
  },
  meta: {
    textAlign: "right",
    fontSize: 9,
    color: "#525252",
    maxWidth: "36%",
  },
});

/**
 * PDF üst bilgi satırı — @react-pdf/renderer.
 * (pdfmake `pdfHeader()` `columns` düzeninin React karşılığı.)
 */
export function PdfDocumentHeader({
  company,
  meta,
}: {
  company: PdfHeaderCompany;
  meta: ReactNode;
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.companyRow}>
        {company.logoPath ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image
          <Image src={company.logoPath} style={styles.logo} />
        ) : null}
        <View style={styles.stack}>
          <Text style={styles.name}>{company.name}</Text>
          {company.taxNumber ? (
            <Text style={styles.tax}>VKN: {company.taxNumber}</Text>
          ) : null}
          <Text style={styles.line}>{company.email}</Text>
          <Text style={styles.line}>{company.phone}</Text>
          <Text style={styles.line}>{company.address}</Text>
        </View>
      </View>
      <View style={styles.meta}>{meta}</View>
    </View>
  );
}

/** Profil → header şirket sütunu (quote/contract pdf-data katmanı). */
export function pdfHeader(profile: {
  companyName: string;
  companyTaxNumber?: string;
  logoPath?: string | null;
  email: string;
  phone: string;
  address: string;
}): PdfHeaderCompany {
  return {
    name: profile.companyName,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    logoPath: profile.logoPath,
    taxNumber: profile.companyTaxNumber,
  };
}
