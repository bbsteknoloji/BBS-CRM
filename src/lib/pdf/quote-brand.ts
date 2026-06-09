import { existsSync, readFileSync } from "fs";
import path from "path";

/** BBS TEKNOLOJI Fiyat Teklifi.xlsx — kurumsal teklif şablonu */
export const quoteBrand = {
  colors: {
    brandBlue: "#0070C0",
    brandBlueDark: "#005A9E",
    brandNavy: "#1A2433",
    brandBlueLight: "#EEF4FA",
    brandBlueSoft: "#D6E8F7",
    headerBg: "#1A2433",
    headerText: "#FFFFFF",
    totalBg: "#0070C0",
    totalBgDark: "#005A9E",
    totalLabel: "#5A6B7D",
    totalOnBlue: "#FFFFFF",
    border: "#1A2433",
    borderLight: "#C5D3E0",
    borderBrand: "#0070C0",
    text: "#141414",
    muted: "#5A6B7D",
    surface: "#F4F8FC",
    rowAlt: "#F8FAFD",
  },
  typography: {
    body: 9,
    metaLabel: 8.5,
    metaValue: 9,
    tableHead: 8,
    tableCell: 9,
    total: 9,
    totalGrand: 10,
    notesTitle: 8,
    notesBody: 8.5,
  },
  assets: {
    logo: "/logo.png",
    accent: "/zarf.jpg",
  },
  /** logo.png 1025×397 (orijinal şeffaf), zarf.jpg 141×573 — Excel hücre ölçüleri (pt) */
  layout: {
    bannerHeight: 108,
    logoWidth: 243,
    accentHeight: 98,
    bannerRightWidth: 28,
    bottomInset: 7,
  },
} as const;

function assetAbsolutePath(relativePath: string): string {
  return path.join(
    process.cwd(),
    "public",
    relativePath.replace(/^\//, "")
  );
}

/** @react-pdf Windows'ta dosya yolu yerine data URI gerektirir */
export function loadQuoteAssetDataUri(relativePath: string): string | null {
  const local = assetAbsolutePath(relativePath);
  if (!existsSync(local)) return null;

  const buffer = readFileSync(local);
  const ext = path.extname(local).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : "application/octet-stream";

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/** Önce PNG (şeffaf), yoksa JPG yedek */
export function loadQuoteLogoDataUri(): string | null {
  return (
    loadQuoteAssetDataUri(quoteBrand.assets.logo) ??
    loadQuoteAssetDataUri("/logo.jpg")
  );
}

export function resolveQuoteAsset(relativePath: string): string | null {
  const local = assetAbsolutePath(relativePath);
  return existsSync(local) ? local : null;
}
