import { existsSync } from "fs";
import path from "path";
import { company as companyDefaults } from "@/config/company";
import { prisma } from "@/lib/db";
import { splitAddressForPdf, normalizeCompanyAddress } from "@/lib/pdf/split-address-lines";

function resolveLogoPath(logoUrl: string): string | null {
  const local = logoUrl.startsWith("/")
    ? path.join(process.cwd(), "public", logoUrl.slice(1))
    : path.join(process.cwd(), "public", logoUrl);
  if (existsSync(local)) return local;

  const pngFallback = path.join(process.cwd(), "public", "logo.png");
  if (existsSync(pngFallback)) return pngFallback;

  return null;
}

function resolveAddressLines(address: string | undefined): string[] {
  if (!address?.trim()) {
    return splitAddressForPdf(companyDefaults.address);
  }

  return splitAddressForPdf(address);
}

/** PDF ve uygulama için şirket profili: önce DB, sonra config + ayarlar. */
export async function getCompanyProfile() {
  const row = await prisma.company.findFirst({
    select: {
      name: true,
      logoUrl: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  const taxRows = await prisma.setting.findMany({
    where: { key: "company.tax_number" },
    select: { value: true },
  });
  const taxNumber = taxRows[0]?.value?.trim();

  const logoUrl = row?.logoUrl ?? companyDefaults.logo;
  const address = normalizeCompanyAddress(
    row?.address ?? companyDefaults.address
  );

  return {
    companyName: row?.name ?? companyDefaults.name,
    companyTaxNumber: taxNumber || undefined,
    logoPath: resolveLogoPath(logoUrl),
    email: row?.email ?? companyDefaults.email,
    phone: row?.phone ?? companyDefaults.phone,
    mobilePhone: companyDefaults.mobilePhone,
    address,
    addressLines: resolveAddressLines(address),
  };
}
