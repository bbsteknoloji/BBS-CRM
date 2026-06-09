const CURRENCY_SYMBOL: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOL[currency.toUpperCase()] ?? currency;
}

export function currencyLabel(currency: string): string {
  const code = currency.toUpperCase();
  if (code === "TRY") return "Türk Lirası (₺)";
  if (code === "USD") return "ABD Doları ($)";
  if (code === "EUR") return "Euro (€)";
  return code;
}

export function formatMoneyWithCurrency(
  value: { toString(): string },
  currency: string
): string {
  const n = Number(value.toString());
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} ${currencySymbol(currency)}`;
}

/** @deprecated use formatMoneyWithCurrency */
export const formatPdfMoney = formatMoneyWithCurrency;
