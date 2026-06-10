import type { Currency, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { format } from "@/lib/utils/date-format";
import type {
  ContractTemplatePlaceholders,
  ContractTemplateDevice,
} from "./contract-template-types";

type DeviceRow = {
  deviceName: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
};

function formatContractAmount(
  total: Prisma.Decimal | { toString(): string },
  currency: Currency
): string {
  const n = Number(total.toString());
  if (!Number.isFinite(n) || n === 0) return "—";
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  const suffix = currency === "TRY" ? " TL" : ` ${currency}`;
  return `${formatted}${suffix}`;
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

/** Cihazları {{#devices}}...{{/devices}} döngüsü için satır dizisine dönüştür */
export function formatDeviceRows(devices: DeviceRow[]): ContractTemplateDevice[] {
  return devices.map((d, i) => ({
    rowNum: String(i + 1),
    productName: d.model?.trim() || d.deviceName.trim() || "—",
    serialNumber: d.serialNumber?.trim() || "—",
  }));
}

/**
 * Fatura numarasını placeholder değerine dönüştür.
 * Boş ise ""  → "EK-2 : Firmanın Kestiği İlgili Fatura"
 * Dolu ise " No: X" → "EK-2 : Firmanın Kestiği İlgili Fatura No: X"
 */
function formatInvoiceNumber(invoiceNumber: string | null | undefined): string {
  const val = invoiceNumber?.trim();
  if (!val) return "";
  return ` No: ${val}`;
}

export function buildContractTemplatePlaceholders(input: {
  number: string;
  contractDate: Date | null;
  signedAt: Date | null;
  createdAt: Date;
  startDate: Date;
  endDate: Date | null;
  subtotal: Prisma.Decimal | { toString(): string };
  total: Prisma.Decimal | { toString(): string };
  currency: Currency;
  invoiceNumber: string | null | undefined;
  customer: {
    legalName: string;
    taxNumber: string | null;
    taxOffice: string | null;
    addresses: Array<{
      line1: string;
      line2: string | null;
      district: string | null;
      city: string;
      isPrimary: boolean;
    }>;
    contacts: Array<{
      phone: string | null;
      mobile: string | null;
      email: string | null;
      isPrimary: boolean;
    }>;
  };
  devices: DeviceRow[];
}): ContractTemplatePlaceholders {
  const primaryAddress =
    input.customer.addresses.find((a) => a.isPrimary) ??
    input.customer.addresses[0];
  const primaryContact =
    input.customer.contacts.find((c) => c.isPrimary) ??
    input.customer.contacts[0];

  const contractDate = input.contractDate ?? input.signedAt ?? input.createdAt;

  return {
    contractNumber: input.number,
    contractDate: format(contractDate, "date"),
    contractStartDate: format(input.startDate, "date"),
    contractEndDate: input.endDate ? format(input.endDate, "date") : "—",
    customerName: input.customer.legalName,
    taxNumber: input.customer.taxNumber ?? "",
    taxOffice: input.customer.taxOffice?.trim() || "—",
    address: primaryAddress ? formatAddress(primaryAddress) : "—",
    phone:
      primaryContact?.phone?.trim() ||
      primaryContact?.mobile?.trim() ||
      "—",
    email: primaryContact?.email?.trim() || "—",
    contractAmount: formatContractAmount(input.subtotal, input.currency),
    invoiceNumber: formatInvoiceNumber(input.invoiceNumber),
    devices: formatDeviceRows(input.devices),
  };
}

const CONTRACT_TEMPLATE_SELECT = {
  number: true,
  contractDate: true,
  signedAt: true,
  createdAt: true,
  startDate: true,
  endDate: true,
  subtotal: true,
  total: true,
  currency: true,
  invoiceNumber: true,
  customer: {
    select: {
      legalName: true,
      taxNumber: true,
      taxOffice: true,
      addresses: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }],
        select: {
          line1: true,
          line2: true,
          district: true,
          city: true,
          isPrimary: true,
        },
      },
      contacts: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }],
        select: {
          phone: true,
          mobile: true,
          email: true,
          isPrimary: true,
        },
      },
    },
  },
  contractDevices: {
    orderBy: { createdAt: "asc" as const },
    select: {
      device: {
        select: {
          deviceName: true,
          brand: true,
          model: true,
          serialNumber: true,
        },
      },
    },
  },
};

export async function buildContractTemplatePlaceholdersForContract(
  contractId: string
): Promise<ContractTemplatePlaceholders | null> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    select: CONTRACT_TEMPLATE_SELECT,
  });
  if (!contract) return null;

  const devices = contract.contractDevices.map((cd) => cd.device);

  return buildContractTemplatePlaceholders({
    ...contract,
    devices,
    invoiceNumber: contract.invoiceNumber,
  });
}

export function placeholdersToJson(
  placeholders: ContractTemplatePlaceholders
): Prisma.InputJsonValue {
  return placeholders as unknown as Prisma.InputJsonValue;
}
