import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

/** Birincil yol — geriye dönük uyumluluk */
export const BBS_STAMP_RELATIVE_PATH =
  "public/assets/signatures/bbs-kase-imza.png";

/** Öncelik: gerçek PNG → JPG yedek */
const STAMP_CANDIDATES = [
  "public/assets/signatures/bbs-kase-imza.png",
  "public/assets/signatures/bbs-kase-imza.jpg",
];

export function getBbsStampPath(): string {
  for (const relative of STAMP_CANDIDATES) {
    const absolute = path.join(process.cwd(), relative);
    if (fs.existsSync(absolute)) return absolute;
  }
  return path.join(process.cwd(), BBS_STAMP_RELATIVE_PATH);
}

export function assertBbsStampExists(): void {
  const stampPath = getBbsStampPath();
  if (!fs.existsSync(stampPath)) {
    throw new Error(
      `BBS kaşe-imza görseli bulunamadı. Beklenen: bbs-kase-imza.png veya bbs-kase-imza.jpg (${STAMP_CANDIDATES.join(", ")})`
    );
  }
}

function loadStampBytes(): Buffer {
  assertBbsStampExists();
  return fs.readFileSync(getBbsStampPath());
}

/**
 * BBS kaşe-imza görselini base64 data URI olarak yükler.
 * React-PDF <Image src=...> için kullanılır.
 * Gerçek format magic byte'lardan tespit edilir — uzantıya güvenilmez.
 */
export function loadStampDataUri(): string | null {
  for (const candidate of STAMP_CANDIDATES) {
    const abs = path.join(process.cwd(), candidate);
    if (!fs.existsSync(abs)) continue;
    const buf = fs.readFileSync(abs);
    // Magic byte tespiti: PNG → 89 50 4E 47, JPEG → FF D8
    const isActualPng =
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const mime = isActualPng ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }
  return null;
}

async function embedStampImage(pdfDoc: PDFDocument, stampBytes: Buffer) {
  const isPng =
    stampBytes[0] === 0x89 &&
    stampBytes[1] === 0x50 &&
    stampBytes[2] === 0x4e &&
    stampBytes[3] === 0x47;

  return isPng ? pdfDoc.embedPng(stampBytes) : pdfDoc.embedJpg(stampBytes);
}

/**
 * PDF son sayfasına BBS kaşe-imza görseli ekler.
 * Konum: sağ kolon — BBS TEKNOLOJİ imza alanı (Madde 40).
 */
export async function applyBbsStampToPdf(pdfBuffer: Buffer): Promise<Buffer> {
  const stampBytes = loadStampBytes();
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const stampImage = await embedStampImage(pdfDoc, stampBytes);

  const pages = pdfDoc.getPages();
  const targetPage = pages[pages.length - 1];
  const { width } = targetPage.getSize();

  const stampWidth = 120;
  const stampHeight = (stampImage.height / stampImage.width) * stampWidth;

  // Sağ kolon: BBS TEKNOLOJİ / kaşe-imza
  // A4 yüksekliği ~842pt, imza alanı son sayfada tabdan sonra sağ yarıda
  targetPage.drawImage(stampImage, {
    x: width / 2 + 55,
    y: 100,
    width: stampWidth,
    height: stampHeight,
  });

  return Buffer.from(await pdfDoc.save());
}
