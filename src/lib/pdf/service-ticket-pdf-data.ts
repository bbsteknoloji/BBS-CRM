import { prisma } from "@/lib/db";
import type { ServiceTicketPdfData } from "@/lib/pdf/service-ticket-pdf-document";
import { getCompanyProfile } from "@/lib/company-profile";
import { format } from "@/lib/utils/date-format";
import { loadQuoteLogoDataUri } from "@/lib/pdf/quote-brand";
import {
  SERVICE_TYPE_LABELS,
  SYSTEM_TYPE_LABELS,
  SERVICE_TICKET_STATUS_LABELS,
  SERVICE_PRIORITY_LABELS,
} from "@/lib/services/service-ticket-state-machine";
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
    const isActualPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const mime = isActualPng ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }
  return null;
}

function formatMoney(value: { toString(): string }, currency: string): string {
  const n = Number(value.toString());
  if (!Number.isFinite(n)) return "0,00";
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
  const fmt = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${fmt} ${sym}`;
}

function currencySymbol(currency: string): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return "₺";
}

export async function getServiceTicketPdfData(
  ticketId: string,
  includeTechNotes = false
): Promise<ServiceTicketPdfData> {
  const ticket = await prisma.serviceTicket.findFirstOrThrow({
    where: { id: ticketId, deletedAt: null },
    select: {
      ticketNo: true,
      title: true,
      status: true,
      priority: true,
      serviceType: true,
      systemType: true,
      brand: true,
      model: true,
      serialNo: true,
      location: true,
      inventoryNo: true,
      description: true,
      workDone: true,
      techNotes: true,
      currency: true,
      subtotal: true,
      taxTotal: true,
      total: true,
      openedAt: true,
      customer: {
        select: {
          legalName: true,
          addresses: {
            select: { line1: true, city: true, district: true },
            where: { type: "HEADQUARTERS" },
            take: 1,
          },
          contacts: {
            select: { fullName: true, phone: true, email: true },
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      assignedUser: {
        select: { firstName: true, lastName: true },
      },
      lineItems: {
        select: {
          description: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          taxRate: true,
          lineTotal: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const company = await getCompanyProfile();
  const logoUri = loadQuoteLogoDataUri();
  const stampUri = loadStampDataUri();

  const contact = ticket.customer.contacts[0];
  const address = ticket.customer.addresses[0];
  const addressStr = address
    ? [address.line1, address.district, address.city].filter(Boolean).join(", ")
    : null;

  const cur = ticket.currency as string;
  const sym = currencySymbol(cur);

  return {
    companyName: company?.companyName ?? "BBS Teknoloji",
    companyAddress: company?.address ?? "",
    companyPhone: company?.phone ?? "",
    companyEmail: company?.email ?? "",
    logoImagePath: logoUri ?? null,
    stampImagePath: stampUri,
    ticketNo: ticket.ticketNo,
    openedAt: format(ticket.openedAt, "date"),
    serviceTypeLabel: SERVICE_TYPE_LABELS[ticket.serviceType] ?? ticket.serviceType,
    priorityLabel: SERVICE_PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
    statusLabel: SERVICE_TICKET_STATUS_LABELS[ticket.status] ?? ticket.status,
    systemTypeLabel: ticket.systemType ? (SYSTEM_TYPE_LABELS[ticket.systemType] ?? ticket.systemType) : null,
    brand: ticket.brand,
    model: ticket.model,
    serialNo: ticket.serialNo,
    location: ticket.location,
    inventoryNo: ticket.inventoryNo,
    customer: {
      legalName: ticket.customer.legalName,
      contactName: contact?.fullName ?? null,
      phone: contact?.phone ?? null,
      email: contact?.email ?? null,
      address: addressStr,
    },
    description: ticket.description,
    workDone: ticket.workDone,
    techNotes: ticket.techNotes,
    includeTechNotes,
    lineItems: ticket.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity.toString()).toLocaleString("tr-TR"),
      unit: li.unit,
      unitPrice: `${Number(li.unitPrice.toString()).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${sym}`,
      taxRate: Number(li.taxRate.toString()).toString(),
      lineTotal: `${Number(li.lineTotal.toString()).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${sym}`,
    })),
    subtotal: formatMoney(ticket.subtotal, cur),
    taxTotal: formatMoney(ticket.taxTotal, cur),
    total: formatMoney(ticket.total, cur),
    currency: sym,
    assignedUserName: ticket.assignedUser
      ? `${ticket.assignedUser.firstName} ${ticket.assignedUser.lastName}`.trim()
      : null,
  };
}
