import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { QuotePdfDocument } from "@/lib/pdf/quote-pdf-document";
import { ReferencedQuotePdfDocument } from "@/lib/pdf/referenced-quote-pdf-document";
import { registerPdfFonts } from "@/lib/pdf/register-pdf-fonts";
import { writeLocalFile } from "@/lib/storage/local-storage";
import { buildQuotePdfData } from "./quote-pdf-data";
import { getBbsStampPath } from "@/lib/contracts/contract-stamp";

export { buildQuotePdfData } from "./quote-pdf-data";

export async function generateSignedQuotePdf(
  quoteId: string,
  userId: string
): Promise<{ pdfVersionId: string; buffer: Buffer } | null> {
  const data = await buildQuotePdfData(quoteId);
  if (!data) return null;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { version: true, number: true },
  });
  if (!quote) return null;

  // Stamp path'ini file:// URL olarak React PDF'e veriyoruz
  // Windows: C:\path → file:///C:/path  Linux: /var/... → file:///var/...
  const stampAbsPath = getBbsStampPath();
  const normalized = stampAbsPath.replace(/\\/g, "/");
  const stampUrl = normalized.startsWith("/") ? `file://${normalized}` : `file:///${normalized}`;
  const dataWithStamp = { ...data, stampImagePath: stampUrl };

  registerPdfFonts();
  const buffer = await renderToBuffer(
    <QuotePdfDocument data={dataWithStamp} />
  );

  const fileName = `v${quote.version}-signed-${Date.now()}.pdf`;
  const relativePath = `quotes/${quoteId}/pdf/${fileName}`;
  const stored = await writeLocalFile(relativePath, Buffer.from(buffer));

  const pdfVersion = await prisma.quotePdfVersion.upsert({
    where: { quoteId_quoteVersion: { quoteId, quoteVersion: quote.version } },
    create: {
      quoteId,
      quoteVersion: quote.version,
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      sizeBytes: buffer.length,
      createdById: userId,
    },
    update: {
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      sizeBytes: buffer.length,
      createdById: userId,
    },
    select: { id: true },
  });
  return { pdfVersionId: pdfVersion.id, buffer: Buffer.from(buffer) };
}

export async function generateQuotePdf(
  quoteId: string,
  userId: string
): Promise<{ pdfVersionId: string; buffer: Buffer } | null> {
  const data = await buildQuotePdfData(quoteId);
  if (!data) return null;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { version: true, number: true },
  });
  if (!quote) return null;

  registerPdfFonts();

  const buffer = await renderToBuffer(
    <QuotePdfDocument data={data} />
  );

  const fileName = `v${quote.version}-${Date.now()}.pdf`;
  const relativePath = `quotes/${quoteId}/pdf/${fileName}`;
  const stored = await writeLocalFile(relativePath, Buffer.from(buffer));

  const versionKey = {
    quoteId,
    quoteVersion: quote.version,
  };

  const existing = await prisma.quotePdfVersion.findUnique({
    where: { quoteId_quoteVersion: versionKey },
    select: { id: true },
  });

  const pdfVersion = await prisma.quotePdfVersion.upsert({
    where: { quoteId_quoteVersion: versionKey },
    create: {
      quoteId,
      quoteVersion: quote.version,
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      sizeBytes: buffer.length,
      createdById: userId,
    },
    update: {
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      sizeBytes: buffer.length,
      createdById: userId,
    },
    select: { id: true },
  });

  if (!existing) {
    await prisma.document.create({
      data: {
        originalName: `${quote.number}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: buffer.length,
        status: "ACTIVE",
        storageKey: stored.storageKey,
        relativePath: stored.relativePath,
        uploadedById: userId,
        links: {
          create: {
            entityType: "QUOTE",
            entityId: quoteId,
            label: `PDF v${quote.version}`,
          },
        },
      },
    });
  }

  return { pdfVersionId: pdfVersion.id, buffer: Buffer.from(buffer) };
}

export async function generateReferencedQuotePdf(
  quoteId: string,
  userId: string
): Promise<{ pdfVersionId: string; buffer: Buffer } | null> {
  const data = await buildQuotePdfData(quoteId);
  if (!data) return null;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { version: true, number: true },
  });
  if (!quote) return null;

  registerPdfFonts();

  const buffer = await renderToBuffer(
    <ReferencedQuotePdfDocument data={data} />
  );

  const fileName = `v${quote.version}-referenced-${Date.now()}.pdf`;
  const relativePath = `quotes/${quoteId}/pdf/${fileName}`;
  const stored = await writeLocalFile(relativePath, Buffer.from(buffer));

  const versionKey = { quoteId, quoteVersion: quote.version };

  const pdfVersion = await prisma.quotePdfVersion.upsert({
    where: { quoteId_quoteVersion: versionKey },
    create: {
      quoteId,
      quoteVersion: quote.version,
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      sizeBytes: buffer.length,
      createdById: userId,
    },
    update: {
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      sizeBytes: buffer.length,
      createdById: userId,
    },
    select: { id: true },
  });

  return { pdfVersionId: pdfVersion.id, buffer: Buffer.from(buffer) };
}

export async function getLatestQuotePdf(quoteId: string) {
  return prisma.quotePdfVersion.findFirst({
    where: { quoteId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      relativePath: true,
      quoteVersion: true,
      createdAt: true,
    },
  });
}

export async function getQuotePdfBufferByVersionId(
  pdfVersionId: string
): Promise<Buffer | null> {
  const row = await prisma.quotePdfVersion.findUnique({
    where: { id: pdfVersionId },
    select: { relativePath: true },
  });
  if (!row) return null;
  const { readLocalFile } = await import("@/lib/storage/local-storage");
  return readLocalFile(row.relativePath);
}
