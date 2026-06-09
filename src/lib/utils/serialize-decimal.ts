/** Prisma Decimal → client component için düz sayı */
export function decimalToNumber(
  value: { toString(): string } | null | undefined
): number {
  if (value == null) return 0;
  return Number(value.toString());
}
