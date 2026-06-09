import { prisma } from "@/lib/db";
import type { ContractPdfData } from "@/lib/pdf/contract-pdf-document";
import { getCompanyProfile } from "@/lib/company-profile";
import { format } from "@/lib/utils/date-format";
import {
  loadQuoteLogoDataUri,
  loadQuoteAssetDataUri,
  quoteBrand,
} from "@/lib/pdf/quote-brand";
import fs from "node:fs";
import path from "node:path";

const STAMP_CANDIDATES = [
  "public/assets/signatures/bbs-kase-imza.png",
  "public/assets/signatures/bbs-kase-imza.jpg",
];

function loadStampDataUri(): string | null {
  for (const rel of STAMP_CANDIDATES) {
    const abs = path.join(process.cwd(), rel);
    if (!fs.existsSync(abs)) continue;
    const buf = fs.readFileSync(abs);
    // Magic byte tespiti: PNG → 89 50 4E 47, JPEG → FF D8
    // bbs-kase-imza.png aslında JPEG formatında — uzantıya güvenilmez
    const isActualPng =
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const mime = isActualPng ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }
  return null;
}

function loadZarfDataUri(): string | null {
  try {
    const abs = path.join(process.cwd(), "public/zarf.jpg");
    if (!fs.existsSync(abs)) return null;
    const buf = fs.readFileSync(abs);
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function formatAmount(value: { toString(): string }, currency: string): string {
  const n = Number(value.toString());
  if (!Number.isFinite(n) || n === 0) return "—";
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} ${currency === "TRY" ? "TL" : currency} (KDV Hariç)`;
}

function formatAddress(parts: {
  line1: string;
  line2?: string | null;
  district?: string | null;
  city?: string | null;
}): string {
  return [parts.line1, parts.line2, parts.district, parts.city]
    .filter(Boolean)
    .join(", ");
}

export async function buildContractPdfData(
  contractId: string
): Promise<ContractPdfData | null> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    select: {
      number: true,
      contractDate: true,
      signedAt: true,
      createdAt: true,
      startDate: true,
      endDate: true,
      total: true,
      currency: true,
      status: true,
      invoiceNumber: true,
      customer: {
        select: {
          legalName: true,
          taxNumber: true,
          taxOffice: true,
          addresses: {
            where: { deletedAt: null },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            select: { line1: true, line2: true, district: true, city: true, isPrimary: true },
          },
          contacts: {
            where: { deletedAt: null },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            select: { fullName: true, phone: true, mobile: true, email: true, isPrimary: true },
          },
        },
      },
      contractDevices: {
        orderBy: { createdAt: "asc" },
        select: {
          device: {
            select: { deviceName: true, brand: true, model: true, serialNumber: true },
          },
        },
      },
    },
  });

  if (!contract) return null;

  const company = await getCompanyProfile();
  const invoiceNumber = contract.invoiceNumber?.trim() || "";

  const addr = contract.customer.addresses[0];
  const contact = contract.customer.contacts[0];
  const contractDate = contract.contractDate ?? contract.signedAt ?? contract.createdAt;
  const isSigned = contract.status === "SIGNED" || contract.status === "ACTIVE" || !!contract.signedAt;

  return {
    companyAddress: company.address,
    companyPhone: company.phone,
    companyEmail: company.email,
    logoImagePath: loadQuoteLogoDataUri(),
    accentImagePath: loadQuoteAssetDataUri(quoteBrand.assets.accent),
    stampImagePath: isSigned ? loadStampDataUri() : null,
    zarfImagePath: loadZarfDataUri(),

    contractNumber: contract.number,
    contractDate: format(contractDate, "date"),
    contractStartDate: format(contract.startDate, "date"),
    contractEndDate: contract.endDate ? format(contract.endDate, "date") : "—",

    customer: {
      legalName: contract.customer.legalName,
      taxNumber: contract.customer.taxNumber ?? "",
      taxOffice: contract.customer.taxOffice?.trim() || "—",
      address: addr ? formatAddress(addr) : "—",
      phone: contact?.phone?.trim() || contact?.mobile?.trim() || "—",
      email: contact?.email?.trim() || "—",
      contactName: contact?.fullName ?? null,
    },

    contractAmount: formatAmount(contract.total, contract.currency),
    invoiceNumber,
    devices: contract.contractDevices.map((cd) => cd.device),

    isSigned,
    signedAt: contract.signedAt ? format(contract.signedAt, "date") : null,
  };
}
