import type { DocumentEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStorageAdapter } from "@/lib/storage";
import { createActivity } from "@/lib/activity/activity-service";
import { randomUUID } from "crypto";
import path from "path";

export type UploadFileInput = {
  name: string;
  type: string;
  buffer: Buffer;
};

export type UploadEntityDocumentParams = {
  entityType: DocumentEntityType;
  entityId: string;
  customerId: string;
  uploadedById: string;
  file: UploadFileInput;
  storageSubPath: string;
  allowedMime: readonly string[];
  activityTitle?: string;
};

export function buildEntityFilesPath(
  entityType: DocumentEntityType,
  entityId: string
): string {
  switch (entityType) {
    case "CONTRACT":
      return `contracts/${entityId}/files`;
    case "SERVICE_TICKET":
      return `service-tickets/${entityId}/files`;
    case "VISIT":
      return `visits/${entityId}/files`;
    case "CUSTOMER":
      return `customers/${entityId}/files`;
    default:
      return `entities/${entityId}/files`;
  }
}

export const DEFAULT_ATTACHMENT_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;

export async function uploadEntityDocument(
  params: UploadEntityDocumentParams
): Promise<string> {
  const { file, allowedMime, entityType, entityId, customerId, uploadedById } =
    params;

  if (
    !allowedMime.includes(file.type as (typeof allowedMime)[number]) &&
    !file.type.startsWith("image/")
  ) {
    throw new Error("Bu dosya türü desteklenmiyor");
  }

  const ext =
    path.extname(file.name) ||
    (file.type.includes("pdf")
      ? ".pdf"
      : file.type.includes("png")
        ? ".png"
        : ".bin");
  const storedName = `${randomUUID()}${ext}`;
  const relativePath = `${params.storageSubPath}/${storedName}`;

  const storage = getStorageAdapter();
  const stored = await storage.write(relativePath, file.buffer);

  const linkCount = await prisma.documentLink.count({
    where: { entityType, entityId },
  });

  const doc = await prisma.document.create({
    data: {
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.buffer.length,
      status: "ACTIVE",
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      uploadedById,
      links: {
        create: {
          entityType,
          entityId,
          label: `v${linkCount + 1}`,
        },
      },
    },
    select: { id: true },
  });

  await createActivity({
    customerId,
    type: "DOCUMENT_UPLOADED",
    title: params.activityTitle ?? "Dosya yüklendi",
    description: file.name,
    userId: uploadedById,
    createdById: uploadedById,
    ...(entityType === "CONTRACT"
      ? { contractId: entityId }
      : entityType === "SERVICE_TICKET"
        ? { serviceTicketId: entityId }
        : entityType === "VISIT"
          ? { visitRecordId: entityId }
          : {}),
  });

  return doc.id;
}
