/** Logo İşbaşı → CRM alan eşleştirmesi */
export const CRM_IMPORT_FIELDS = [
  {
    key: "customerCode",
    label: "Cari Kodu",
    required: true,
    description: "metadata.logoCustomerCode olarak saklanır",
  },
  {
    key: "companyName",
    label: "Cari Ünvanı / Firma Adı",
    required: true,
  },
  {
    key: "taxNumber",
    label: "Vergi No",
    required: true,
  },
  {
    key: "phone",
    label: "Telefon",
    required: false,
  },
  {
    key: "email",
    label: "E-posta",
    required: false,
  },
  {
    key: "address",
    label: "Adres",
    required: false,
  },
  {
    key: "contactPerson",
    label: "Yetkili",
    required: false,
  },
] as const;

export type CrmImportFieldKey = (typeof CRM_IMPORT_FIELDS)[number]["key"];

export type ColumnMapping = Partial<Record<CrmImportFieldKey, string>>;

const AUTO_MAP: Record<CrmImportFieldKey, string[]> = {
  customerCode: [
    "müşteri kodu",
    "musteri kodu",
    "cari kodu",
    "cari kod",
    "carikodu",
    "cari_kodu",
    "kod",
    "code",
  ],
  companyName: [
    "müşteri ünvanı",
    "musteri unvani",
    "cari ünvanı",
    "cari unvan",
    "cari unvani",
    "ünvan",
    "unvan",
    "firma adı",
    "firma adi",
    "legal name",
    "ticari unvan",
  ],
  taxNumber: [
    "müşteri vkn-tckn",
    "musteri vkn-tckn",
    "vergi no",
    "vergi numarası",
    "vergi numarasi",
    "vkn",
    "tckn",
    "tax number",
    "vergi kimlik no",
  ],
  phone: ["telefon", "tel", "phone", "gsm", "cep"],
  email: ["e-posta", "e posta", "eposta", "email", "mail"],
  address: ["adres", "address", "açık adres", "acik adres"],
  contactPerson: [
    "yetkili",
    "yetkili kişi",
    "yetkili kisi",
    "contact",
    "ilgili kişi",
    "ilgili kisi",
  ],
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ");
}

/** Excel başlıklarından otomatik eşleştirme öner */
export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();

  for (const field of CRM_IMPORT_FIELDS) {
    const aliases = AUTO_MAP[field.key];
    const match = headers.find((h) => {
      if (used.has(h)) return false;
      const n = normalizeHeader(h);
      return aliases.some((a) => n === a || n.includes(a));
    });
    if (match) {
      mapping[field.key] = match;
      used.add(match);
    }
  }

  return mapping;
}

export const LOGO_METADATA_KEY = "logoCustomerCode";
export const LOGO_IMPORT_SOURCE = "logo_isbasi";
