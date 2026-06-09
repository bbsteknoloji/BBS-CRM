/** İndirilebilir teklif PDF dosya adı */
export function quotePdfDownloadFilename(quoteNumber: string): string {
  const safe = quoteNumber.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `quote-${safe}.pdf`;
}
