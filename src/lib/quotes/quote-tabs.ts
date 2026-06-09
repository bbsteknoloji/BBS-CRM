export const QUOTE_DETAIL_TABS = [
  { id: "general", label: "Genel Bilgiler" },
  { id: "lines", label: "Kalemler" },
  { id: "activity", label: "Aktivite" },
  { id: "files", label: "Dosyalar" },
  { id: "revisions", label: "Revizyonlar" },
] as const;

export type QuoteTabId = (typeof QUOTE_DETAIL_TABS)[number]["id"];

export function parseQuoteTab(tab?: string): QuoteTabId {
  if (tab && QUOTE_DETAIL_TABS.some((t) => t.id === tab)) {
    return tab as QuoteTabId;
  }
  return "general";
}
