/** İndirilebilir sözleşme PDF dosya adı */
export function contractPdfDownloadFilename(contractNumber: string): string {
  const safe = contractNumber.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `contract-${safe}.pdf`;
}
