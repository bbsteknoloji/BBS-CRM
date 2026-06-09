/**
 * Türkçe karakter normalleştirme + küçük harfe dönüştürme.
 * Hem client (arama kutusu) hem de server (Prisma query) tarafında kullanılır.
 *
 * Dönüşümler:
 *   ş/Ş → s  |  ı/I → i  |  İ → i
 *   ğ/Ğ → g  |  ü/Ü → u  |  ö/Ö → o  |  ç/Ç → c
 */
export function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i"); // toLowerCase zaten İ→i yapabilir ama garanti için explicit
}
