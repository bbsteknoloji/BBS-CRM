export type LineInput = {
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type LineCalculated = LineInput & {
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
};

export function calculateLine(item: LineInput): LineCalculated {
  const lineSubtotal = round(item.quantity * item.unitPrice);
  const lineTax = round(lineSubtotal * (item.taxRate / 100));
  const lineTotal = round(lineSubtotal + lineTax);
  return { ...item, lineSubtotal, lineTax, lineTotal };
}

export function calculateTotals(items: LineInput[]) {
  const lines = items.map(calculateLine);
  const subtotal = round(lines.reduce((s, l) => s + l.lineSubtotal, 0));
  const taxTotal = round(lines.reduce((s, l) => s + l.lineTax, 0));
  const total = round(subtotal + taxTotal);
  return { lines, subtotal, taxTotal, total };
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function toDecimalString(n: number): string {
  return n.toFixed(4);
}
