export const CONTRACT_DETAIL_TABS = [
  { id: "general", label: "Genel Bilgiler" },
  { id: "lines", label: "Kalemler" },
  { id: "files", label: "Dosyalar" },
  { id: "renewals", label: "Yenilemeler" },
  { id: "activity", label: "Aktivite Geçmişi" },
  { id: "audit", label: "Audit Geçmişi" },
] as const;

export type ContractTabId = (typeof CONTRACT_DETAIL_TABS)[number]["id"];

export function parseContractTab(tab?: string): ContractTabId {
  if (tab && CONTRACT_DETAIL_TABS.some((t) => t.id === tab)) {
    return tab as ContractTabId;
  }
  return "general";
}
