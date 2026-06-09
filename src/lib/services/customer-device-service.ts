import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions/types";
import { createAuditLog } from "@/lib/audit/audit-service";
import { isDeviceInactive } from "@/lib/customers/device-display";
import { getCustomerForAccess } from "@/lib/services/customer-service";
import type { CustomerDeviceFormInput } from "@/lib/validations/customer-device";

const DEVICE_SELECT = {
  id: true,
  deviceName: true,
  brand: true,
  model: true,
  serialNumber: true,
  notes: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type CustomerDeviceRow = {
  id: string;
  deviceName: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  notes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeInput(input: CustomerDeviceFormInput) {
  return {
    deviceName: input.deviceName.trim(),
    brand: input.brand?.trim() || null,
    model: input.model?.trim() || null,
    serialNumber: input.serialNumber?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

function sortCustomerDevices<
  T extends { deletedAt: Date | null; deviceName: string; notes: string | null }
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aInactive = isDeviceInactive(a);
    const bInactive = isDeviceInactive(b);
    if (aInactive !== bInactive) return aInactive ? 1 : -1;
    return a.deviceName.localeCompare(b.deviceName, "tr");
  });
}

export async function listCustomerDevices(
  user: SessionUser,
  customerId: string
): Promise<CustomerDeviceRow[]> {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return [];

  const rows = await prisma.customerDevice.findMany({
    where: { customerId },
    select: DEVICE_SELECT,
    orderBy: [{ deviceName: "asc" }, { createdAt: "desc" }],
  });

  return sortCustomerDevices(rows);
}

/** @alias listCustomerDevices */
export const getCustomerDevices = listCustomerDevices;

export async function createCustomerDevice(
  user: SessionUser,
  input: CustomerDeviceFormInput
): Promise<string | null> {
  const access = await getCustomerForAccess(user, input.customerId);
  if (!access) return null;

  const data = normalizeInput(input);

  const device = await prisma.customerDevice.create({
    data: {
      customerId: input.customerId,
      ...data,
      createdById: user.id,
      updatedById: user.id,
    },
    select: { id: true, deviceName: true, serialNumber: true },
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entityType: "customer_device",
    entityId: device.id,
    changes: {
      customerId: input.customerId,
      deviceName: data.deviceName,
      serialNumber: data.serialNumber,
    },
  });

  return device.id;
}

export async function updateCustomerDevice(
  user: SessionUser,
  customerId: string,
  deviceId: string,
  input: CustomerDeviceFormInput
): Promise<boolean> {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return false;

  const existing = await prisma.customerDevice.findFirst({
    where: { id: deviceId, customerId },
    select: {
      deviceName: true,
      brand: true,
      model: true,
      serialNumber: true,
      notes: true,
      deletedAt: true,
    },
  });
  if (!existing) return false;

  const data = normalizeInput(input);

  await prisma.customerDevice.update({
    where: { id: deviceId },
    data: {
      ...data,
      updatedById: user.id,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "customer_device",
    entityId: deviceId,
    changes: {
      customerId,
      before: existing,
      after: data,
    },
  });

  return true;
}

export async function deleteCustomerDevice(
  user: SessionUser,
  customerId: string,
  deviceId: string
): Promise<boolean> {
  const access = await getCustomerForAccess(user, customerId);
  if (!access) return false;

  const existing = await prisma.customerDevice.findFirst({
    where: { id: deviceId, customerId, deletedAt: null },
    select: { id: true, deviceName: true, serialNumber: true },
  });
  if (!existing) return false;

  await prisma.customerDevice.update({
    where: { id: deviceId },
    data: { deletedAt: new Date(), updatedById: user.id },
  });

  await createAuditLog({
    userId: user.id,
    action: "SOFT_DELETE",
    entityType: "customer_device",
    entityId: deviceId,
    changes: {
      customerId,
      deviceName: existing.deviceName,
      serialNumber: existing.serialNumber,
    },
  });

  return true;
}
