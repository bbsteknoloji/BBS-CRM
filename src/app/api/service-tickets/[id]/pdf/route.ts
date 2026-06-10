import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions/check";
import { getServiceTicketAccess } from "@/lib/services/service-ticket-service";
import { generateServiceTicketPdf } from "@/lib/services/service-ticket-pdf-service";
import { serviceTicketPdfDownloadFilename } from "@/lib/pdf/service-ticket-pdf-filename";
import { readLocalFile } from "@/lib/storage/local-storage";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = {
    id: userId,
    email: session.user?.email ?? "",
    name: session.user?.name ?? "",
    roles: session.user?.roles ?? [],
    permissions: session.user?.permissions ?? [],
  };

  if (!hasPermission(user, "service:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: ticketId } = await params;
  const access = await getServiceTicketAccess(user, ticketId);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const regenerate = searchParams.get("regenerate") === "1";
  const includeTechNotes =
    searchParams.get("techNotes") === "1" && hasPermission(user, "service:write");

  let buffer: Buffer | null = null;

  if (regenerate && hasPermission(user, "service:pdf")) {
    try {
      const gen = await generateServiceTicketPdf(ticketId, userId, includeTechNotes);
      buffer = gen?.buffer ?? null;
    } catch (err) {
      console.error("[ServiceTicket PDF] generate failed:", err);
      return NextResponse.json(
        { error: "PDF oluşturulamadı: " + (err instanceof Error ? err.message : String(err)) },
        { status: 500 }
      );
    }
  } else {
    const latest = await prisma.serviceTicketPdfVersion.findFirst({
      where: { serviceTicketId: ticketId },
      orderBy: { createdAt: "desc" },
      select: { relativePath: true },
    });
    if (latest) {
      try { buffer = await readLocalFile(latest.relativePath); } catch { buffer = null; }
    }
    if (!buffer && hasPermission(user, "service:pdf")) {
      try {
        const gen = await generateServiceTicketPdf(ticketId, userId, includeTechNotes);
        buffer = gen?.buffer ?? null;
      } catch (err) {
        console.error("[ServiceTicket PDF] generate failed:", err);
        return NextResponse.json(
          { error: "PDF oluşturulamadı: " + (err instanceof Error ? err.message : String(err)) },
          { status: 500 }
        );
      }
    }
  }

  if (!buffer) {
    return NextResponse.json({ error: "PDF bulunamadı." }, { status: 404 });
  }

  const ticket = await prisma.serviceTicket.findFirst({
    where: { id: ticketId, deletedAt: null },
    select: { ticketNo: true },
  });

  const inline = searchParams.get("inline") === "1" && searchParams.get("download") !== "1";
  const filename = serviceTicketPdfDownloadFilename(ticket?.ticketNo ?? ticketId);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inline ? "inline" : `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
