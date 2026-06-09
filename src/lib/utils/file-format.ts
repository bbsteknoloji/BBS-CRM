import type { FileCenterModule } from "@/lib/services/file-center-types";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const FILE_MODULE_LABELS: Record<FileCenterModule, string> = {
  QUOTE: "Teklif",
  CONTRACT: "Sözleşme",
  CUSTOMER: "Müşteri",
  SERVICE_TICKET: "Servis Talebi",
  VISIT: "Saha Ziyareti",
};

export function mimeToFileType(mimeType: string): "PDF" | "ATTACHMENT" {
  return mimeType === "application/pdf" ? "PDF" : "ATTACHMENT";
}
