export const SERVICE_TICKET_DETAIL_TABS = [
  { id: "general", label: "Genel Bilgiler" },
  { id: "visits", label: "Saha Ziyaretleri" },
  { id: "files", label: "Dosyalar" },
  { id: "activity", label: "Aktivite Geçmişi" },
  { id: "audit", label: "Audit Geçmişi" },
] as const;

export type ServiceTicketTabId =
  (typeof SERVICE_TICKET_DETAIL_TABS)[number]["id"];

export function parseServiceTicketTab(tab?: string): ServiceTicketTabId {
  if (tab && SERVICE_TICKET_DETAIL_TABS.some((t) => t.id === tab)) {
    return tab as ServiceTicketTabId;
  }
  return "general";
}
