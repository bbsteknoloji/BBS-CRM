import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions/check";
import { getQuoteAccess } from "@/lib/services/quote-service";
import { quotePdfDownloadFilename } from "@/lib/pdf/quote-pdf-filename";
import { generateQuotePdf, generateReferencedQuotePdf } from "@/lib/services/quote-pdf-service";
import { readLocalFile } from "@/lib/storage/local-storage";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = {
    id: userId,
    email: session.user?.email ?? "",
    name: session.user?.name ?? "",
    companyId: session.user?.companyId ?? null,
    roles: session.user?.roles ?? [],
    permissions: session.user?.permissions ?? [],
  };

  if (!hasPermission(user, "quote:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: quoteId } = await params;
  const access = await getQuoteAccess(user, quoteId);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get("versionId");
  const regenerate = searchParams.get("regenerate") === "1";

  let buffer: Buffer | null = null;

  if (versionId) {
    const row = await prisma.quotePdfVersion.findFirst({
      where: { id: versionId, quoteId },
      select: { relativePath: true },
    });
    if (row) buffer = await readLocalFile(row.relativePath);
  } else if (regenerate && hasPermission(user, "quote:write")) {
    const quoteRow = await prisma.quote.findFirst({
      where: { id: quoteId, deletedAt: null },
      select: { quoteTemplate: true },
    });
    const gen = quoteRow?.quoteTemplate === "REFERENCED"
      ? await generateReferencedQuotePdf(quoteId, userId)
      : await generateQuotePdf(quoteId, userId);
    buffer = gen?.buffer ?? null;
  } else {
    // quoteTemplate'e göre doğru PDF versiyonunu bul veya oluştur
    const quoteRow = await prisma.quote.findFirst({
      where: { id: quoteId, deletedAt: null },
      select: { quoteTemplate: true },
    });
    const isReferenced = quoteRow?.quoteTemplate === "REFERENCED";

    const latest = await prisma.quotePdfVersion.findFirst({
      where: { quoteId },
      orderBy: { createdAt: "desc" },
      select: { relativePath: true },
    });
    if (latest) {
      buffer = await readLocalFile(latest.relativePath);
    } else if (hasPermission(user, "quote:write")) {
      const gen = isReferenced
        ? await generateReferencedQuotePdf(quoteId, userId)
        : await generateQuotePdf(quoteId, userId);
      buffer = gen?.buffer ?? null;
    }
  }

  if (!buffer) {
    return NextResponse.json(
      { error: "PDF bulunamadı. Önce PDF oluşturun." },
      { status: 404 }
    );
  }

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, deletedAt: null },
    select: { number: true },
  });
  const filename = quotePdfDownloadFilename(quote?.number ?? quoteId);

  const inline =
    searchParams.get("inline") === "1" &&
    searchParams.get("download") !== "1";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inline
        ? "inline"
        : `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
