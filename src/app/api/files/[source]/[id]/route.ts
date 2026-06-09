import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions/check";
import {
  logFileActivity,
  resolveFilePayload,
} from "@/lib/services/file-center-service";
import type { FileSourceParam } from "@/lib/validations/file-center";

type Params = { params: Promise<{ source: string; id: string }> };

const SOURCES = ["document", "quote-pdf", "contract-pdf"] as const;

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
    roles: session.user?.roles ?? [],
    permissions: session.user?.permissions ?? [],
  };

  if (!hasPermission(user, "file:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { source: rawSource, id } = await params;
  if (!SOURCES.includes(rawSource as FileSourceParam)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }
  const source = rawSource as FileSourceParam;

  const { searchParams } = new URL(request.url);
  const inline = searchParams.get("inline") === "1";
  const isDownload = !inline;

  if (isDownload && !hasPermission(user, "file:download")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: Awaited<ReturnType<typeof resolveFilePayload>>;
  try {
    payload = await resolveFilePayload(user, source, id);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!payload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await logFileActivity(
    user,
    isDownload ? "FILE_DOWNLOAD" : "FILE_VIEW",
    {
      customerId: payload.customerId,
      documentId: payload.documentId,
      fileName: payload.fileName,
    }
  );

  const disposition = inline
    ? `inline; filename="${encodeURIComponent(payload.fileName)}"`
    : `attachment; filename="${encodeURIComponent(payload.fileName)}"`;

  return new NextResponse(new Uint8Array(payload.buffer), {
    headers: {
      "Content-Type": payload.mimeType,
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
