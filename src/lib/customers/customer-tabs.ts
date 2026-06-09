export const CUSTOMER_DETAIL_TABS = [
  { id: "general", label: "Genel Bilgiler" },
  { id: "contacts", label: "İletişim Kişileri" },
  { id: "devices", label: "Cihazlar" },
  { id: "services", label: "Servis Talepleri" },
  { id: "visits", label: "Saha Ziyaretleri" },
  { id: "tasks", label: "Görevler" },
  { id: "activity", label: "Aktivite Geçmişi" },
  { id: "quotes", label: "Teklifler" },
  { id: "contracts", label: "Sözleşmeler" },
  { id: "files", label: "Dosyalar" },
] as const;

export type CustomerTabId = (typeof CUSTOMER_DETAIL_TABS)[number]["id"];

export function parseCustomerTab(tab?: string): CustomerTabId {
  if (tab && CUSTOMER_DETAIL_TABS.some((t) => t.id === tab)) {
    return tab as CustomerTabId;
  }
  return "general";
}
