import type { Currency } from "@prisma/client";

const CURRENCY_SYMBOL: Record<Currency, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

export function formatMoney(
  value: number | { toString(): string },
  currency: Currency | string = "TRY"
): string {
  const n =
    typeof value === "number" ? value : Number(value.toString());
  const code = (currency as Currency) in CURRENCY_SYMBOL ? (currency as Currency) : "TRY";
  const symbol = CURRENCY_SYMBOL[code] ?? "₺";
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} ${symbol}`;
}
