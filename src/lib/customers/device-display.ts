/** Import scriptlerinin notes alanına yazdığı yapılandırılmış metni parse eder. */

export function parseDeviceLocation(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/^Konum \/ Açıklama:\s*(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

export function parseWarrantyExpiry(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/^Hizmet Sonu(?: \(warrantyExpiry\))?:\s*(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

export function getDeviceLocationDisplay(notes: string | null): string {
  const parsed = parseDeviceLocation(notes);
  if (parsed) return parsed;

  if (!notes?.trim()) return "—";

  const lines = notes
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith("Kaynak:") &&
        !l.startsWith("Durum:") &&
        !l.startsWith("Hizmet Sonu")
    );

  return lines.join(" ").trim() || "—";
}

export function getWarrantyExpiryDisplay(notes: string | null): string {
  return parseWarrantyExpiry(notes) ?? "—";
}

export function parseOperationalStatus(
  notes: string | null
): "ACTIVE" | "INACTIVE" {
  if (!notes) return "ACTIVE";
  const match = notes.match(/^Durum:\s*(.+)$/m);
  if (!match) return "ACTIVE";
  const label = match[1].trim().toLowerCase();
  return label === "kullanım dışı" || label === "kullanim disi"
    ? "INACTIVE"
    : "ACTIVE";
}

export function isDeviceInactive(device: {
  deletedAt: Date | string | null;
  notes?: string | null;
}): boolean {
  if (device.deletedAt != null) return true;
  return parseOperationalStatus(device.notes ?? null) === "INACTIVE";
}

export function getDeviceStatusLabel(device: {
  deletedAt: Date | string | null;
  notes?: string | null;
}): string {
  return isDeviceInactive(device) ? "Kullanım Dışı" : "Aktif";
}
