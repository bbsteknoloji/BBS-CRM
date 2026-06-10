import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/db";
import { ServiceTicketPdfDocument } from "@/lib/pdf/service-ticket-pdf-document";
import { getServiceTicketPdfData } from "@/lib/pdf/service-ticket-pdf-data";
import { registerPdfFonts } from "@/lib/pdf/register-pdf-fonts";
import { writeLocalFile } from "@/lib/storage/local-storage";

export async function generateServiceTicketPdf(
  ticketId: string,
  userId: string,
  includeTechNotes = false
): Promise<{ buffer: Buffer; pdfVersionId: string } | null> {
  const data = await getServiceTicketPdfData(ticketId, includeTechNotes);
  if (!data) return null;

  registerPdfFonts();
  const buffer = await renderToBuffer(
    <ServiceTicketPdfDocument data={data} />
  );

  const fileName = `${Date.now()}.pdf`;
  const relativePath = `service-tickets/${ticketId}/pdf/${fileName}`;
  const stored = await writeLocalFile(relativePath, Buffer.from(buffer));

  const existing = await prisma.serviceTicketPdfVersion.findFirst({
    where: { serviceTicketId: ticketId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (existing?.version ?? 0) + 1;

  const pdfVersion = await prisma.serviceTicketPdfVersion.create({
    data: {
      serviceTicketId: ticketId,
      version: nextVersion,
      storageKey: stored.storageKey,
      relativePath: stored.relativePath,
      sizeBytes: buffer.length,
      createdById: userId,
    },
    select: { id: true },
  });

  return { buffer: Buffer.from(buffer), pdfVersionId: pdfVersion.id };
}
