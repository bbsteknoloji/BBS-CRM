import type { CustomerStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions/types";
import { normalizeSearch } from "@/lib/utils/normalize-search";
import { hasRole, isSuperAdmin } from "@/lib/permissions/check";
import type {
  CustomerFormInput,
  CustomerListQuery,
  ContactFormInput,
  CustomerTaskFormInput,
} from "@/lib/validations/customer";
import { createAuditLog } from "@/lib/audit/audit-service";
import { createActivity } from "@/lib/activity/activity-service";
import { isDeviceInactive } from "@/lib/customers/device-display";

const CUSTOMER_SELECT_LIST = {
  id: true,
  legalName: true,
  tradeName: true,
  taxNumber: true,
  taxOffice: true,
  status: true,
  website: true,
  createdAt: true,
  addresses: {
    where: { deletedAt: null, isPrimary: true },
    take: 1,
    select: { city: true },
  },
  _count: {
    select: {
      devices: { where: { deletedAt: null } },
    },
  },
  devices: {
    where: { deletedAt: null },
    take: 1,
    orderBy: { createdAt: "asc" as const },
    select: { serialNumber: true },
  },
} as const;

function sortCustomerListItems<
  T extends { city: string | null; legalName: string }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aHasCity = Boolean(a.city?.trim());
    const bHasCity = Boolean(b.city?.trim());
    if (aHasCity !== bHasCity) return aHasCity ? -1 : 1;

    const cityCmp = (a.city ?? "").localeCompare(b.city ?? "", "tr");
    if (cityCmp !== 0) return cityCmp;

    return a.legalName.localeCompare(b.legalName, "tr");
  });
}

function buildAccessFilter(user: SessionUser): Prisma.CustomerWhereInput {
  if (
    isSuperAdmin(user) ||
    hasRole(user, "ADMIN")
  ) {
    return {};
  }
  if (hasRole(user, "SALES")) {
    return {
      OR: [
        { assignedToId: user.id },
        { createdById: user.id },
      ],
    };
  }
  return { id: "00000000-0000-0000-0000-000000000000" };
}

function buildListWhere(
  user: SessionUser,
  query: CustomerListQuery
): Prisma.CustomerWhereInput {
  const base: Prisma.CustomerWhereInput = {
    deletedAt: null,
    ...buildAccessFilter(user),
  };

  if (query.status) base.status = query.status;
  if (query.assignedToId) base.assignedToId = query.assignedToId;
  if (query.city) {
    base.addresses = {
      some: {
        deletedAt: null,
        city: { equals: query.city, mode: "insensitive" },
      },
    };
  }
  if (query.q?.trim()) {
    const term = normalizeSearch(query.q.trim());
    base.OR = [
      { legalName: { contains: term, mode: "insensitive" } },
      { tradeName: { contains: term, mode: "insensitive" } },
      { taxNumber: { contains: term } },
      { taxOffice: { contains: term, mode: "insensitive" } },
      {
        addresses: {
          some: {
            deletedAt: null,
            city: { contains: term, mode: "insensitive" },
          },
        },
      },
      {
        devices: {
          some: {
            deletedAt: null,
            serialNumber: { contains: term, mode: "insensitive" },
          },
        },
      },
      {
        contacts: {
          some: {
            deletedAt: null,
            fullName: { contains: term, mode: "insensitive" },
          },
        },
      },
    ];
  }

  return base;
}

export type CustomerCursor = {
  offset: number;
};

export function encodeCursor(cursor: CustomerCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(raw?: string): CustomerCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as CustomerCursor & { createdAt?: string; id?: string };
    if (typeof parsed.offset === "number" && parsed.offset >= 0) {
      return { offset: parsed.offset };
    }
  } catch {
    return null;
  }
  return null;
}

export async function listCustomers(
  user: SessionUser,
  query: CustomerListQuery
) {
  const where = buildListWhere(user, query);
  const limit = query.limit;
  const cursor = decodeCursor(query.cursor);
  const offset = cursor?.offset ?? 0;

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      select: CUSTOMER_SELECT_LIST,
    }),
  ]);

  const sorted = sortCustomerListItems(
    rows.map((c) => ({
      id: c.id,
      legalName: c.legalName,
      tradeName: c.tradeName,
      taxNumber: c.taxNumber,
      taxOffice: c.taxOffice,
      status: c.status,
      website: c.website,
      city: c.addresses[0]?.city ?? null,
      deviceCount: c._count.devices,
      firstDeviceSerial: c.devices[0]?.serialNumber ?? null,
      createdAt: c.createdAt,
    }))
  );

  const pageItems = sorted.slice(offset, offset + limit);
  const nextOffset = offset + limit;
  const hasMore = nextOffset < sorted.length;
  const nextCursor = hasMore ? encodeCursor({ offset: nextOffset }) : null;

  return {
    items: pageItems,
    total,
    nextCursor,
    hasMore,
  };
}

export async function getDistinctCities(user: SessionUser) {
  const access = buildAccessFilter(user);
  const rows = await prisma.customerAddress.findMany({
    where: {
      deletedAt: null,
      customer: { deletedAt: null, ...access },
    },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
    take: 100,
  });
  return rows.map((r) => r.city);
}

export async function getAssignableUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

export async function getCustomerForAccess(
  user: SessionUser,
  customerId: string
) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
      ...buildAccessFilter(user),
    },
    select: { id: true },
  });
  return customer;
}

export async function getCustomerDetail(
  user: SessionUser,
  customerId: string
) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
      ...buildAccessFilter(user),
    },
    select: {
      id: true,
      legalName: true,
      tradeName: true,
      taxNumber: true,
      taxOffice: true,
      sector: true,
      website: true,
      status: true,
      notes: true,
      healthStatus: true,
      healthComputedAt: true,
      createdAt: true,
      updatedAt: true,
      assignedTo: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      createdBy: {
        select: { firstName: true, lastName: true },
      },
      addresses: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          line1: true,
          line2: true,
          district: true,
          city: true,
          postalCode: true,
          isPrimary: true,
        },
      },
      contacts: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
          title: true,
          email: true,
          phone: true,
          mobile: true,
          isPrimary: true,
        },
      },
      devices: {
        orderBy: [{ deviceName: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          deviceName: true,
          brand: true,
          model: true,
          serialNumber: true,
          notes: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!customer) return null;

  const devices = [...customer.devices].sort((a, b) => {
    const aInactive = isDeviceInactive(a);
    const bInactive = isDeviceInactive(b);
    if (aInactive !== bInactive) return aInactive ? 1 : -1;
    return a.deviceName.localeCompare(b.deviceName, "tr");
  });

  return { ...customer, devices };
}

export async function createCustomer(
  user: SessionUser,
  input: CustomerFormInput
) {
  const assignedToId = input.assignedToId || user.id;

  const customer = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        legalName: input.legalName.trim(),
        tradeName: input.tradeName?.trim() || null,
        taxNumber: input.taxNumber.trim(),
        taxOffice: input.taxOffice?.trim() || null,
        website: input.website?.trim() || null,
        status: input.status as CustomerStatus,
        notes: input.notes?.trim() || null,
        assignedToId,
        createdById: user.id,
        updatedById: user.id,
      },
      select: { id: true, legalName: true },
    });

    await tx.customerAddress.create({
      data: {
        customerId: created.id,
        line1: input.addressLine.trim(),
        district: input.district?.trim() || null,
        city: input.city.trim(),
        postalCode: input.postalCode?.trim() || null,
        isPrimary: true,
        createdById: user.id,
      },
    });

    if (input.authorizedPerson?.trim() || input.phone || input.email) {
      await tx.customerContact.create({
        data: {
          customerId: created.id,
          fullName: input.authorizedPerson?.trim() || input.legalName.trim(),
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          isPrimary: true,
          createdById: user.id,
        },
      });
    }

    return created;
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "customer",
    entityId: customer.id,
    changes: { legalName: input.legalName, taxNumber: input.taxNumber },
  });

  await createActivity({
    customerId: customer.id,
    type: "NOTE",
    title: "Müşteri oluşturuldu",
    description: `${customer.legalName} kaydı açıldı.`,
    userId: user.id,
    createdById: user.id,
    metadata: { event: "customer_created" },
  });

  return customer.id;
}

export async function updateCustomer(
  user: SessionUser,
  customerId: string,
  input: CustomerFormInput
) {
  const existing = await getCustomerForAccess(user, customerId);
  if (!existing) return null;

  const assignedToId = input.assignedToId || null;

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customerId },
      data: {
        legalName: input.legalName.trim(),
        tradeName: input.tradeName?.trim() || null,
        taxNumber: input.taxNumber.trim(),
        taxOffice: input.taxOffice?.trim() || null,
        website: input.website?.trim() || null,
        status: input.status as CustomerStatus,
        notes: input.notes?.trim() || null,
        assignedToId: assignedToId || undefined,
        updatedById: user.id,
      },
    });

    const primaryAddress = await tx.customerAddress.findFirst({
      where: { customerId, deletedAt: null, isPrimary: true },
      select: { id: true },
    });

    if (primaryAddress) {
      await tx.customerAddress.update({
        where: { id: primaryAddress.id },
        data: {
          line1: input.addressLine.trim(),
          district: input.district?.trim() || null,
          city: input.city.trim(),
          postalCode: input.postalCode?.trim() || null,
          updatedById: user.id,
        },
      });
    } else {
      await tx.customerAddress.create({
        data: {
          customerId,
          line1: input.addressLine.trim(),
          district: input.district?.trim() || null,
          city: input.city.trim(),
          postalCode: input.postalCode?.trim() || null,
          isPrimary: true,
          createdById: user.id,
        },
      });
    }

    const primaryContact = await tx.customerContact.findFirst({
      where: { customerId, deletedAt: null, isPrimary: true },
      select: { id: true },
    });

    const contactName =
      input.authorizedPerson?.trim() || input.legalName.trim();

    if (primaryContact) {
      await tx.customerContact.update({
        where: { id: primaryContact.id },
        data: {
          fullName: contactName,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          updatedById: user.id,
        },
      });
    } else if (input.authorizedPerson || input.phone || input.email) {
      await tx.customerContact.create({
        data: {
          customerId,
          fullName: contactName,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          isPrimary: true,
          createdById: user.id,
        },
      });
    }
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "customer",
    entityId: customerId,
    changes: { legalName: input.legalName, status: input.status },
  });

  await createActivity({
    customerId,
    type: "NOTE",
    title: "Müşteri güncellendi",
    description: "Firma bilgileri güncellendi.",
    userId: user.id,
    createdById: user.id,
    metadata: { event: "customer_updated" },
  });

  return customerId;
}

export async function archiveCustomer(
  user: SessionUser,
  customerId: string
) {
  const existing = await prisma.customer.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
      ...buildAccessFilter(user),
    },
    select: { id: true, legalName: true },
  });
  if (!existing) return false;

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      deletedAt: new Date(),
      status: "INACTIVE",
      updatedById: user.id,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "SOFT_DELETE",
    entityType: "customer",
    entityId: customerId,
    changes: { legalName: existing.legalName },
  });

  await createActivity({
    customerId,
    type: "STATUS_CHANGE",
    title: "Müşteri arşivlendi",
    description: "Kayıt arşive alındı.",
    userId: user.id,
    createdById: user.id,
    metadata: { event: "customer_archived" },
  });

  return true;
}

export async function listCustomerActivities(
  user: SessionUser,
  customerId: string,
  limit = 50
) {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return [];

  return prisma.activity.findMany({
    where: { customerId, deletedAt: null },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      occurredAt: true,
      user: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
}

export async function listCustomerTasks(
  user: SessionUser,
  customerId: string
) {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return [];

  return prisma.task.findMany({
    where: { customerId, deletedAt: null },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueAt: true,
      assignedTo: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function createCustomerTask(
  user: SessionUser,
  input: CustomerTaskFormInput
) {
  const access = await getCustomerForAccess(user, input.customerId);
  if (!access) return null;

  const task = await prisma.task.create({
    data: {
      customerId: input.customerId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assignedToId: input.assignedToId,
      priority: input.priority,
      dueAt:
        input.dueAt && input.dueAt.length > 0
          ? new Date(input.dueAt)
          : null,
      createdById: user.id,
    },
    select: { id: true, title: true },
  });

  await createActivity({
    customerId: input.customerId,
    type: "TASK_CREATED",
    title: "Görev oluşturuldu",
    description: task.title,
    userId: user.id,
    createdById: user.id,
    taskId: task.id,
  });

  return task.id;
}

export async function listCustomerContacts(
  user: SessionUser,
  customerId: string
) {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return [];

  return prisma.customerContact.findMany({
    where: { customerId, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      title: true,
      email: true,
      phone: true,
      isPrimary: true,
    },
    orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
  });
}

export async function createCustomerContact(
  user: SessionUser,
  input: ContactFormInput
) {
  const access = await getCustomerForAccess(user, input.customerId);
  if (!access) return null;

  const contact = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.customerContact.updateMany({
        where: { customerId: input.customerId, deletedAt: null },
        data: { isPrimary: false },
      });
    }

    return tx.customerContact.create({
      data: {
        customerId: input.customerId,
        fullName: input.fullName.trim(),
        title: input.title?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        isPrimary: input.isPrimary,
        createdById: user.id,
      },
      select: { id: true, fullName: true },
    });
  });

  await createActivity({
    customerId: input.customerId,
    type: "NOTE",
    title: "İletişim kişisi eklendi",
    description: contact.fullName,
    userId: user.id,
    createdById: user.id,
    metadata: { event: "contact_added", contactId: contact.id },
  });

  return contact.id;
}

export async function deleteCustomerContact(
  user: SessionUser,
  customerId: string,
  contactId: string
) {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return false;

  await prisma.customerContact.update({
    where: { id: contactId, customerId },
    data: { deletedAt: new Date() },
  });
  return true;
}

export async function listCustomerQuotes(
  user: SessionUser,
  customerId: string
) {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return [];

  return prisma.quote.findMany({
    where: { customerId, deletedAt: null },
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function listCustomerContracts(
  user: SessionUser,
  customerId: string
) {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return [];

  return prisma.contract.findMany({
    where: { customerId, deletedAt: null },
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function listCustomerDocuments(
  user: SessionUser,
  customerId: string
) {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return [];

  const links = await prisma.documentLink.findMany({
    where: {
      entityType: "CUSTOMER",
      entityId: customerId,
      document: { deletedAt: null, status: "ACTIVE" },
    },
    select: {
      id: true,
      label: true,
      createdAt: true,
      document: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return links;
}

export function customerToFormInput(
  customer: NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>
): CustomerFormInput {
  const addr = customer.addresses.find((a) => a.isPrimary) ?? customer.addresses[0];
  const contact =
    customer.contacts.find((c) => c.isPrimary) ?? customer.contacts[0];

  return {
    legalName: customer.legalName,
    tradeName: customer.tradeName ?? "",
    taxNumber: customer.taxNumber ?? "",
    taxOffice: customer.taxOffice ?? "",
    website: customer.website ?? "",
    status: customer.status,
    assignedToId: customer.assignedTo?.id ?? "",
    notes: customer.notes ?? "",
    authorizedPerson: contact?.fullName ?? "",
    phone: contact?.phone ?? "",
    email: contact?.email ?? "",
    addressLine: addr?.line1 ?? "",
    city: addr?.city ?? "",
    district: addr?.district ?? "",
    postalCode: addr?.postalCode ?? "",
  };
}
