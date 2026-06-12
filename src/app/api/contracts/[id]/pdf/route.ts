import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions/check";
import { getContractAccess } from "@/lib/services/contract-service";
import { contractPdfDownloadFilename } from "@/lib/pdf/contract-pdf-filename";
import { generateContractPdf } from "@/lib/services/contract-pdf-service";
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

  if (!hasPermission(user, "contract:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: contractId } = await params;
  const access = await getContractAccess(user, contractId);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get("versionId");
  const regenerate = searchParams.get("regenerate") === "1";

  let buffer: Buffer | null = null;

  if (versionId) {
    const row = await prisma.contractPdfVersion.findFirst({
      where: { id: versionId, contractId },
      select: { relativePath: true },
    });
    if (row) {
      try { buffer = await readLocalFile(row.relativePath); } catch { buffer = null; }
    }
  } else if (regenerate && hasPermission(user, "contract:write")) {
    const gen = await generateContractPdf(contractId, userId);
    buffer = gen?.buffer ?? null;
  } else {
    const latest = await prisma.contractPdfVersion.findFirst({
      where: { contractId },
      orderBy: { createdAt: "desc" },
      select: { relativePath: true },
    });
    if (latest) {
      try { buffer = await readLocalFile(latest.relativePath); } catch { buffer = null; }
    }
    if (!buffer && hasPermission(user, "contract:write")) {
      try {
        const gen = await generateContractPdf(contractId, userId);
        buffer = gen?.buffer ?? null;
      } catch (err) {
        console.error("[PDF route] generateContractPdf failed:", err);
        return NextResponse.json(
          { error: "PDF oluşturulamadı: " + (err instanceof Error ? err.message : String(err)) },
          { status: 500 }
        );
      }
    }
  }

  if (!buffer) {
    return NextResponse.json(
      { error: "PDF bulunamadı. Önce PDF oluşturun." },
      { status: 404 }
    );
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    select: { number: true },
  });
  const filename = contractPdfDownloadFilename(contract?.number ?? contractId);

  const inline =
    searchParams.get("inline") === "1" &&
    searchParams.get("download") !== "1";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inline
        ? "inline"
        : `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
