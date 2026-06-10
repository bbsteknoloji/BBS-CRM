export function serviceTicketPdfDownloadFilename(ticketNo: string): string {
  const safe = ticketNo.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `servis-${safe}.pdf`;
}
