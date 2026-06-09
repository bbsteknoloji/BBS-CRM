import type { QuotePdfData } from "@/lib/pdf/quote-pdf-document";
import { getCompanyProfile } from "@/lib/company-profile";
import { pdfHeader } from "@/lib/pdf/pdf-header";
import {
  currencyLabel,
  formatPdfMoney,
} from "@/lib/pdf/format-currency";
import { quoteBrand, loadQuoteLogoDataUri, loadQuoteAssetDataUri } from "@/lib/pdf/quote-brand";
import { format } from "@/lib/utils/date-format";
import { getQuoteForPdf } from "./quote-service";

function buildTaxLabel(taxRates: number[]): string {
  const unique = [...new Set(taxRates)];
  if (unique.length === 1) {
    return `KDV %${unique[0].toFixed(0)}`;
  }
  return "KDV Toplam";
}

export async function buildQuotePdfData(
  quoteId: string
): Promise<QuotePdfData | null> {
  const quote = await getQuoteForPdf(quoteId);
  if (!quote) return null;

  const company = await getCompanyProfile();
  const contact = quote.customer.contacts[0];
  const taxRates = quote.lineItems.map((l) =>
    Number(l.taxRate.toString())
  );
  const currency = quote.currency;

  return {
    companyHeader: pdfHeader(company),
    logoImagePath: loadQuoteLogoDataUri(),
    accentImagePath: loadQuoteAssetDataUri(quoteBrand.assets.accent),
    mobilePhone: company.mobilePhone ?? null,
    addressLines: company.addressLines,
    quoteNumber: quote.number,
    quoteDate: format(quote.createdAt, "date"),
    version: quote.version,
    currency,
    currencyLabel: currencyLabel(currency),
    customer: {
      legalName: quote.customer.legalName,
      tradeName: quote.customer.tradeName,
      contactName: contact?.fullName ?? null,
    },
    title: quote.title,
    taxLabel: buildTaxLabel(taxRates),
    lineItems: quote.lineItems.map((l) => ({
      productCode: l.productCode ?? l.product?.sku ?? "",
      description: l.description,
      quantity: Number(l.quantity.toString()).toLocaleString("tr-TR"),
      unitPrice: formatPdfMoney(l.unitPrice, currency),
      lineTotal: formatPdfMoney(l.lineTotal, currency),
    })),
    subtotal: formatPdfMoney(quote.subtotal, currency),
    taxTotal: formatPdfMoney(quote.taxTotal, currency),
    total: formatPdfMoney(quote.total, currency),
    notes: quote.notes?.trim() || null,
    terms: quote.terms?.trim() || null,
  };
}
