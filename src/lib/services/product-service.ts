import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeSearch } from "@/lib/utils/normalize-search";
import type { SessionUser } from "@/lib/permissions/types";
import { createAuditLog } from "@/lib/audit/audit-service";
import { toDecimalString } from "@/lib/quotes/calculations";
import { decimalToNumber } from "@/lib/utils/serialize-decimal";
import type { ProductFormInput, ProductListQuery } from "@/lib/validations/product";

const LIST_SELECT = {
  id: true,
  sku: true,
  name: true,
  unit: true,
  unitPrice: true,
  taxRate: true,
  currency: true,
  isActive: true,
  createdAt: true,
} as const;

export type ProductCursor = {
  createdAt: string;
  id: string;
};

export function encodeProductCursor(cursor: ProductCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeProductCursor(raw?: string): ProductCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as ProductCursor;
    if (parsed.createdAt && parsed.id) return parsed;
  } catch {
    return null;
  }
  return null;
}

function buildListWhere(query: ProductListQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (query.isActive === "true") where.isActive = true;
  if (query.isActive === "false") where.isActive = false;

  if (query.q?.trim()) {
    const term = normalizeSearch(query.q.trim());
    where.OR = [
      { sku: { contains: term, mode: "insensitive" } },
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listProducts(_user: SessionUser, query: ProductListQuery) {
  const where = buildListWhere(query);
  const limit = query.limit;
  const cursor = decodeProductCursor(query.cursor);

  const listWhere: Prisma.ProductWhereInput = { ...where };
  if (cursor) {
    const cursorDate = new Date(cursor.createdAt);
    listWhere.AND = [
      ...(Array.isArray(listWhere.AND)
        ? listWhere.AND
        : listWhere.AND
          ? [listWhere.AND]
          : []),
      {
        OR: [
          { createdAt: { lt: cursorDate } },
          { createdAt: cursorDate, id: { lt: cursor.id } },
        ],
      },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where: listWhere,
      select: LIST_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    }),
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.map((row) => ({
    ...row,
    unitPrice: decimalToNumber(row.unitPrice),
    taxRate: decimalToNumber(row.taxRate),
  }));
  const last = items[items.length - 1];

  return {
    items,
    total,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeProductCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null,
  };
}

export async function getProductById(id: string) {
  const row = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      type: true,
      unit: true,
      unitPrice: true,
      currency: true,
      taxRate: true,
      isActive: true,
    },
  });

  if (!row) return null;

  return {
    ...row,
    unitPrice: decimalToNumber(row.unitPrice),
    taxRate: decimalToNumber(row.taxRate),
  };
}

export async function createProduct(user: SessionUser, input: ProductFormInput) {
  const created = await prisma.product.create({
    data: {
      sku: input.sku.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      unit: input.unit.trim(),
      unitPrice: toDecimalString(input.unitPrice),
      currency: input.currency,
      taxRate: toDecimalString(input.taxRate),
      isActive: input.isActive,
      createdById: user.id,
      updatedById: user.id,
    },
    select: { id: true, sku: true, name: true },
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "product",
    entityId: created.id,
    changes: { sku: created.sku, name: created.name },
  });

  return created.id;
}

export async function updateProduct(
  user: SessionUser,
  productId: string,
  input: ProductFormInput
) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.product.update({
    where: { id: productId },
    data: {
      sku: input.sku.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      unit: input.unit.trim(),
      unitPrice: toDecimalString(input.unitPrice),
      currency: input.currency,
      taxRate: toDecimalString(input.taxRate),
      isActive: input.isActive,
      updatedById: user.id,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "product",
    entityId: productId,
    changes: { sku: input.sku, name: input.name, isActive: input.isActive },
  });

  return productId;
}

export async function deleteProduct(user: SessionUser, productId: string) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true, sku: true, name: true },
  });
  if (!existing) return null;

  await prisma.product.update({
    where: { id: productId },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: user.id,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "product",
    entityId: productId,
    changes: { sku: existing.sku, name: existing.name },
  });

  return true;
}

/** Teklif / sözleşme kalem seçimi */
export async function listActiveProducts() {
  return prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      sku: true,
      name: true,
      unit: true,
      unitPrice: true,
      taxRate: true,
      currency: true,
      type: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function quickUpdateProductFields(
  user: SessionUser,
  productId: string,
  fields: {
    sku: string;
    name: string;
    unit: string;
    unitPrice: number;
    taxRate: number;
    currency: import("@prisma/client").Currency;
    isActive: boolean;
  }
) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true, sku: true, name: true },
  });
  if (!existing) return null;

  await prisma.product.update({
    where: { id: productId },
    data: {
      sku: fields.sku.trim(),
      name: fields.name.trim(),
      unit: fields.unit.trim(),
      unitPrice: toDecimalString(fields.unitPrice),
      taxRate: toDecimalString(fields.taxRate),
      currency: fields.currency,
      isActive: fields.isActive,
      updatedById: user.id,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "product",
    entityId: productId,
    changes: { sku: fields.sku, name: fields.name, isActive: fields.isActive },
  });

  return productId;
}

export function productToFormInput(
  product: NonNullable<Awaited<ReturnType<typeof getProductById>>>
): ProductFormInput {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? "",
    type: product.type,
    unit: product.unit,
    unitPrice: product.unitPrice,
    currency: product.currency,
    taxRate: product.taxRate,
    isActive: product.isActive,
  };
}
