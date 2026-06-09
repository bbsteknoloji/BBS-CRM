/**
 * BBS Teknoloji — marka metadatası (metin + logo yolları).
 *
 * Renkler bu dosyada tanımlanmaz.
 * Tek doğruluk kaynağı: src/app/globals.css tema token'ları
 * (--background, --card, --primary, --success, --warning, --danger, …).
 */

export const brand = {
  name: "BBS Teknoloji",

  /** Kısa ürün / panel açıklaması (SEO, login, metadata) */
  description:
    "Network, güvenlik ve saha operasyonları için kurumsal müşteri yönetim paneli",

  /** Opsiyonel slogan — UI'da gösterilmezse boş bırakılabilir */
  slogan: "Kurumsal BT Operasyon Merkezi",

  /**
   * public/ altında opsiyonel dosyalar.
   * Yoksa veya yüklenemezse BbsLogo → brand.name metin fallback.
   */
  logo: {
    default: "/logo.png",
    dark: "/logo.png",
  },
} as const;

export type BrandConfig = typeof brand;
