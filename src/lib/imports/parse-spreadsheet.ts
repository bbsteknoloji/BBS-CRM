import * as XLSX from "xlsx";

export type ParsedSpreadsheet = {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
};

const MAX_ROWS = 5000;
const PREVIEW_ROWS = 20;

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

function parseCsvBuffer(buffer: Buffer): ParsedSpreadsheet {
  let text = buffer.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
  const dataLines = lines.slice(1, MAX_ROWS + 1);

  const rows = dataLines.map((line) => {
    const cells = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });

  return {
    headers,
    rows,
    totalRows: Math.max(0, lines.length - 1),
  };
}

function parseExcelBuffer(buffer: Buffer): ParsedSpreadsheet {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(
    sheet,
    { header: 1, defval: "", raw: false }
  ) as unknown[][];

  if (matrix.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = (matrix[0] ?? []).map((h) => cellToString(h)).filter(Boolean);
  const body = matrix.slice(1, MAX_ROWS + 1);

  const rows = body
    .map((cells) => {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = cellToString(cells[i]);
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v.length > 0));

  return {
    headers,
    rows,
    totalRows: Math.max(0, matrix.length - 1),
  };
}

export function parseSpreadsheetFile(
  buffer: Buffer,
  filename: string
): ParsedSpreadsheet {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    return parseCsvBuffer(buffer);
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return parseExcelBuffer(buffer);
  }
  throw new Error("Yalnızca .xlsx, .xls veya .csv dosyaları desteklenir.");
}

export function previewRows(rows: Record<string, string>[]): Record<string, string>[] {
  return rows.slice(0, PREVIEW_ROWS);
}

export { PREVIEW_ROWS, MAX_ROWS };
