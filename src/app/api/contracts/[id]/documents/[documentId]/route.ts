import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions/check";
import { getContractDocumentForDownload } from "@/lib/services/contract-service";
import { readLocalFile } from "@/lib/storage/local-storage";

type Params = {
  params: Promise<{ id: string; documentId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
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

  const { documentId } = await params;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(documentId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const doc = await getContractDocumentForDownload(user, documentId);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readLocalFile(doc.relativePath);
  } catch {
    return NextResponse.json({ error: "Dosya diskten okunamadı" }, { status: 404 });
  }
  const inline = doc.mimeType === "application/pdf";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": inline
        ? `inline; filename="${doc.originalName}"`
        : `attachment; filename="${doc.originalName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
