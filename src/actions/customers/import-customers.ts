"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/server";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import {
  parseSpreadsheetFile,
  previewRows,
  MAX_ROWS,
} from "@/lib/imports/parse-spreadsheet";
import { suggestColumnMapping } from "@/lib/imports/logo-customer-fields";
import {
  importCustomersPayloadSchema,
  columnMappingSchema,
} from "@/lib/validations/customer-import";
import {
  importCustomersFromLogo,
  type CustomerImportResult,
} from "@/lib/services/customer-import-service";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type CustomerImportPreview = {
  headers: string[];
  preview: Record<string, string>[];
  totalRows: number;
  suggestedMapping: Record<string, string | undefined>;
  fileToken: string;
};

function encodeRowsToken(rows: Record<string, string>[]): string {
  return Buffer.from(JSON.stringify(rows), "utf8").toString("base64url");
}

function decodeRowsToken(token: string): Record<string, string>[] | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8")
    ) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as Record<string, string>[];
  } catch {
    return null;
  }
}

export async function previewCustomerImportAction(
  formData: FormData
): Promise<ActionResult<CustomerImportPreview>> {
  await requirePermission("customer:import");

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return actionError("Dosya seçin");
  }

  if (file.size > MAX_FILE_BYTES) {
    return actionError("Dosya boyutu en fazla 5 MB olabilir");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseSpreadsheetFile(buffer, file.name);

    if (parsed.headers.length === 0) {
      return actionError("Dosyada başlık satırı bulunamadı");
    }

    if (parsed.totalRows === 0) {
      return actionError("Dosyada aktarılacak satır yok");
    }

    if (parsed.totalRows > MAX_ROWS) {
      return actionError(`En fazla ${MAX_ROWS} satır içe aktarılabilir`);
    }

    const suggestedMapping = suggestColumnMapping(parsed.headers);

    return actionSuccess({
      headers: parsed.headers,
      preview: previewRows(parsed.rows),
      totalRows: parsed.totalRows,
      suggestedMapping,
      fileToken: encodeRowsToken(parsed.rows),
    });
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "Dosya okunamadı"
    );
  }
}

export async function importCustomersAction(
  payload: unknown
): Promise<ActionResult<CustomerImportResult>> {
  const user = await requirePermission("customer:import");

  const body =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : null;

  if (!body) {
    return actionError("Geçersiz istek");
  }

  const mappingParsed = columnMappingSchema.safeParse(body.mapping);
  if (!mappingParsed.success) {
    return actionError(
      "Alan eşleştirmesi eksik",
      Object.fromEntries(
        mappingParsed.error.issues.map((i) => [i.path.join("."), [i.message]])
      )
    );
  }

  const rowsToken =
    typeof body.fileToken === "string" ? body.fileToken : null;
  if (!rowsToken) {
    return actionError("Dosya oturumu süresi doldu, lütfen dosyayı yeniden yükleyin");
  }

  const rows = decodeRowsToken(rowsToken);
  if (!rows?.length) {
    return actionError("Aktarılacak satır bulunamadı");
  }

  const payloadCheck = importCustomersPayloadSchema.safeParse({
    mapping: mappingParsed.data,
    rows,
  });

  if (!payloadCheck.success) {
    return actionError("İçe aktarma verisi geçersiz");
  }

  try {
    const result = await importCustomersFromLogo(
      user,
      mappingParsed.data,
      rows
    );

    revalidatePath("/customers");

    return actionSuccess(result);
  } catch (e) {
    return actionError(
      e instanceof Error ? e.message : "İçe aktarma başarısız"
    );
  }
}
