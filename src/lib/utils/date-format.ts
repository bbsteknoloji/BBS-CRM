const TZ = "Europe/Istanbul";

type FormatKind = "date" | "datetime" | "short";

export function format(
  value: Date | string,
  kind: FormatKind = "date"
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (kind === "datetime") {
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
  if (kind === "short") {
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: TZ,
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(d);
  }
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
