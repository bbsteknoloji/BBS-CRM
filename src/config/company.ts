import {
  COMPANY_PDF_ADDRESS,
  COMPANY_PDF_ADDRESS_LINES,
} from "@/lib/pdf/split-address-lines";

/**
 * Varsayılan şirket profili (seed + Company tablosu yoksa fallback).
 */
export const company = {
  name: "BBS Teknoloji",
  logo: "/logo-pdf.png",
  email: "info@bbsteknoloji.com.tr",
  phone: "Tel: (442) 233 86 00",
  mobilePhone: "Cep: (507) 523 90 70",
  addressLines: [...COMPANY_PDF_ADDRESS_LINES],
  address: COMPANY_PDF_ADDRESS,
} as const;

export type CompanyConfig = typeof company;
