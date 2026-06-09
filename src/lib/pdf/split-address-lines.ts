/** BBS Teknoloji — teklif PDF üst bilgi adresi */
export const COMPANY_PDF_ADDRESS =
  "Üniversite, İpekyolu Cad ATA TEKNOKENT A Blok No: 22 Yakutiye/Erzurum";

export const COMPANY_PDF_ADDRESS_LINES = [
  "Üniversite, İpekyolu Cad ATA TEKNOKENT A Blok",
  "No: 22 Yakutiye/Erzurum",
] as const;

/** A4, 32pt yatay padding, 9pt kalın metin — satır başına güvenli karakter */
const PDF_ADDRESS_MAX_CHARS = 46;

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** DB veya eski kayıtlardaki bozuk adresleri düzeltir */
export function normalizeCompanyAddress(address: string): string {
  let s = normalizeSpaces(address);

  s = s.replace(/^Erzurum(?=Üniversite)/i, "");
  s = s.replace(/^Erzurum,\s*/i, "");
  s = s.replace(/\s*\/\s*Türkiye\s*$/i, "");
  s = s.replace(/,\s*\d{5}\s*/g, " ");
  s = s.replace(/\s*İç\s*Kapı\s*No:\s*\d+\s*/gi, " ");
  s = s.replace(/Cad\./gi, "Cad");
  s = s.replace(
    /Yakutiye\s*\/?\s*Erzurum/gi,
    "Yakutiye/Erzurum"
  );

  s = normalizeSpaces(s).replace(/^,\s*/, "");

  if (/TEKNOKENT/i.test(s) && /ipekyolu/i.test(s)) {
    return COMPANY_PDF_ADDRESS;
  }

  return s;
}

function splitAtWord(text: string, maxLen: number): [string, string] {
  if (text.length <= maxLen) return [text, ""];

  let splitAt = text.lastIndexOf(" ", maxLen);
  if (splitAt < 16) {
    splitAt = text.indexOf(" ", maxLen);
  }
  if (splitAt < 0) {
    return [text.slice(0, maxLen).trim(), text.slice(maxLen).trim()];
  }

  return [text.slice(0, splitAt).trim(), text.slice(splitAt).trim()];
}

function extractCityPart(address: string): { street: string; city: string } {
  const match = address.match(/^(.+?)\s+(Yakutiye\s*\/?\s*Erzurum)\s*$/i);
  if (!match) {
    return { street: address, city: "" };
  }

  return {
    street: match[1].trim(),
    city: match[2].replace(/\s*\/\s*/, "/").trim(),
  };
}

/** PDF üst bilgi — adres her zaman en fazla 2 satır */
export function splitAddressForPdf(address: string): string[] {
  const normalized = normalizeCompanyAddress(address);
  if (!normalized) return [];

  if (normalized === COMPANY_PDF_ADDRESS) {
    return [...COMPANY_PDF_ADDRESS_LINES];
  }

  const { street, city } = extractCityPart(normalized);

  if (!street && city) return [city];
  if (!city) {
    const [line1, rest] = splitAtWord(street, PDF_ADDRESS_MAX_CHARS);
    if (!rest) return [line1];
    const [, line2] = splitAtWord(rest, PDF_ADDRESS_MAX_CHARS);
    return [line1, line2].filter(Boolean);
  }

  if (street.length <= PDF_ADDRESS_MAX_CHARS) {
    return [street, city];
  }

  const [line1, streetRemainder] = splitAtWord(street, PDF_ADDRESS_MAX_CHARS);
  const line2 = normalizeSpaces(`${streetRemainder} ${city}`);
  return [line1, line2];
}
