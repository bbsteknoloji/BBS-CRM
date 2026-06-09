import { prisma } from "@/lib/db";
import { writeLocalFile } from "@/lib/storage/local-storage";
import {
  buildContractTemplatePlaceholdersForContract,
  placeholdersToJson,
} from "@/lib/contracts/contract-placeholder-service";
import { mergeContractTemplate } from "@/lib/contracts/contract-template-service";
import { loadStampDataUri } from "@/lib/contracts/contract-stamp";
import { createActivity } from "@/lib/activity/activity-service";
import type { ContractTemplatePlaceholders } from "@/lib/contracts/contract-template-types";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { ContractPdfDocument } from "@/lib/pdf/contract-pdf-document";
import { buildContractPdfData } from "@/lib/services/contract-pdf-data";
import { registerPdfFonts } from "@/lib/pdf/register-pdf-fonts";

export type GeneratedContractDocuments = {
  wordDocumentId: string;
};

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function resolvePlaceholders(
  contractId: string
): Promise<ContractTemplatePlaceholders | null> {
  const built = await buildContractTemplatePlaceholdersForContract(contractId);
  if (!built) return null;

  await prisma.contract.update({
    where: { id: contractId },
    data: { templateData: placeholdersToJson(built) },
  });

  return built;
}

async function saveContractWordDocument(
  contractId: string,
  customerId: string,
  contractNumber: string,
  version: number,
  docxBuffer: Buffer,
  userId: string
): Promise<string> {
  const relativePath = `contracts/${contractId}/docx/v${version}-${Date.now()}.docx`;
  const stored = await writeLocalFile(relativePath, docxBuffer);
  const originalName = `${contractNumber}-v${version}.docx`;

  const doc = await prisma.document.create({
    data: {
      originalName,
      mimeType: DOCX_MIME,
      sizeBytes: docxBuffer.length,
      status: "ACTIVE",
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      uploadedById: userId,
      links: {
        create: {
          entityType: "CONTRACT",
          entityId: contractId,
          label: `Word v${version}`,
        },
      },
    },
    select: { id: true },
  });

  await createActivity({
    customerId,
    type: "DOCUMENT_UPLOADED",
    title: "Sözleşme Word belgesi oluşturuldu",
    description: originalName,
    userId,
    createdById: userId,
    contractId,
  });

  return doc.id;
}

async function saveContractPdfDocument(
  contractId: string,
  customerId: string,
  contractNumber: string,
  version: number,
  pdfBuffer: Buffer,
  userId: string,
  pdfLinkLabel?: string
): Promise<string> {
  const fileName = `v${version}-${Date.now()}.pdf`;
  const relativePath = `contracts/${contractId}/pdf/${fileName}`;
  const stored = await writeLocalFile(relativePath, pdfBuffer);

  const pdfVersion = await prisma.contractPdfVersion.upsert({
    where: { contractId_version: { contractId, version } },
    create: {
      contractId,
      version,
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      sizeBytes: pdfBuffer.length,
      createdById: userId,
    },
    update: {
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      sizeBytes: pdfBuffer.length,
      createdById: userId,
    },
    select: { id: true },
  });

  const originalName = `${contractNumber}-v${version}.pdf`;
  await prisma.document.create({
    data: {
      originalName,
      mimeType: "application/pdf",
      sizeBytes: pdfBuffer.length,
      status: "ACTIVE",
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      uploadedById: userId,
      links: {
        create: {
          entityType: "CONTRACT",
          entityId: contractId,
          label: pdfLinkLabel ?? `PDF v${version}`,
        },
      },
    },
    select: { id: true },
  });

  await createActivity({
    customerId,
    type: "DOCUMENT_UPLOADED",
    title: "Sözleşme PDF oluşturuldu",
    description: originalName,
    userId,
    createdById: userId,
    contractId,
  });

  return pdfVersion.id;
}

/**
 * Word belgesi üretir ve kaydeder.
 * PDF üretimi generateContractPdf() ile ayrıca yapılır — iki pipeline karışmaz.
 */
export async function generateContractDocuments(
  contractId: string,
  userId: string
): Promise<GeneratedContractDocuments | null> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    select: { number: true, customerId: true },
  });
  if (!contract) return null;

  const placeholders = await resolvePlaceholders(contractId);
  if (!placeholders) return null;

  const latestVersion = await prisma.contractPdfVersion.findFirst({
    where: { contractId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (latestVersion?.version ?? 0) + 1;

  let docxBuffer: Buffer;
  try {
    docxBuffer = mergeContractTemplate(placeholders);
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? e.message
        : "Word şablonu doldurulamadı. docs/contracts/standart-sozlesme.docx kontrol edin."
    );
  }

  const wordDocumentId = await saveContractWordDocument(
    contractId,
    contract.customerId,
    contract.number,
    nextVersion,
    docxBuffer,
    userId
  );

  return { wordDocumentId };
}

/**
 * React-PDF renderer ile PDF üretir ve ContractPdfVersion olarak kaydeder.
 * Tüm PDF görünümleri (önizle, indir, imzala) bu pipeline'ı kullanır.
 * includeStamp: imzalama akışında BBS kaşesini PDF'e uygular.
 */
export async function generateContractPdf(
  contractId: string,
  userId: string,
  options: { includeStamp?: boolean; pdfLinkLabel?: string } = {}
): Promise<{ pdfVersionId: string; buffer: Buffer; version: number } | null> {
  const data = await buildContractPdfData(contractId);
  if (!data) return null;

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    select: { number: true, customerId: true },
  });
  if (!contract) return null;

  const latestVersion = await prisma.contractPdfVersion.findFirst({
    where: { contractId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (latestVersion?.version ?? 0) + 1;

  // İmzalama akışında: stamp'ı React-PDF layout içine göm.
  // fixed-koordinat overlay (applyBbsStampToPdf) cihaz sayısına göre
  // yanlış konuma düşer; layout içinde stamp her zaman "Kadir Kurt"ın
  // hemen altına render edilir.
  if (options.includeStamp) {
    const stampUri = loadStampDataUri();
    data.isSigned = true;
    if (stampUri) data.stampImagePath = stampUri;
  }

  registerPdfFonts();
  const pdfElement = React.createElement(ContractPdfDocument, { data });
  const buffer: Buffer = Buffer.from(
    await renderToBuffer(pdfElement as Parameters<typeof renderToBuffer>[0])
  ) as Buffer;

  const pdfLinkLabel =
    options.pdfLinkLabel ??
    (options.includeStamp ? `PDF İmzalı v${nextVersion}` : `PDF v${nextVersion}`);

  const pdfVersionId = await saveContractPdfDocument(
    contractId,
    contract.customerId,
    contract.number,
    nextVersion,
    buffer,
    userId,
    pdfLinkLabel
  );

  return { pdfVersionId, buffer, version: nextVersion };
}
