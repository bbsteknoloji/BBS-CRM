"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { PremiumEmptyState } from "@/components/premium/premium-empty-state";
import { type ColumnDef } from "@tanstack/react-table";
import {
  createCustomerDeviceAction,
  updateCustomerDeviceAction,
  deleteCustomerDeviceAction,
} from "@/actions/customers/device-actions";
import type { CustomerDeviceRow } from "@/lib/services/customer-device-service";
import {
  getDeviceLocationDisplay,
  getDeviceStatusLabel,
  getWarrantyExpiryDisplay,
  isDeviceInactive,
} from "@/lib/customers/device-display";
import { cn } from "@/lib/utils";

type Props = {
  customerId: string;
  devices: CustomerDeviceRow[];
  canWrite: boolean;
};

type DeviceFormValues = {
  deviceName: string;
  brand: string;
  model: string;
  serialNumber: string;
  notes: string;
};

function inactiveCellClass(inactive: boolean) {
  return cn(inactive && "text-muted-foreground opacity-60");
}

function DeviceFormFields({
  idPrefix,
  defaultValues,
}: {
  idPrefix: string;
  defaultValues?: DeviceFormValues;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-deviceName`}>Cihaz adı *</Label>
        <Input
          id={`${idPrefix}-deviceName`}
          name="deviceName"
          required
          maxLength={255}
          defaultValue={defaultValues?.deviceName}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-brand`}>Marka</Label>
          <Input
            id={`${idPrefix}-brand`}
            name="brand"
            maxLength={100}
            defaultValue={defaultValues?.brand}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-model`}>Model</Label>
          <Input
            id={`${idPrefix}-model`}
            name="model"
            maxLength={100}
            defaultValue={defaultValues?.model}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-serialNumber`}>Seri no</Label>
        <Input
          id={`${idPrefix}-serialNumber`}
          name="serialNumber"
          maxLength={100}
          defaultValue={defaultValues?.serialNumber}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`}>Not</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          name="notes"
          rows={3}
          maxLength={5000}
          defaultValue={defaultValues?.notes}
        />
      </div>
    </>
  );
}

function toFormValues(device: CustomerDeviceRow): DeviceFormValues {
  return {
    deviceName: device.deviceName,
    brand: device.brand ?? "",
    model: device.model ?? "",
    serialNumber: device.serialNumber ?? "",
    notes: device.notes ?? "",
  };
}

export function CustomerDevicesPanel({
  customerId,
  devices,
  canWrite,
}: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<CustomerDeviceRow | null>(null);
  const [pending, startTransition] = useTransition();

  const activeCount = devices.filter((d) => !isDeviceInactive(d)).length;
  const inactiveCount = devices.length - activeCount;

  const columns = useMemo<ColumnDef<CustomerDeviceRow>[]>(() => {
    const cols: ColumnDef<CustomerDeviceRow>[] = [
      {
        id: "serialNumber",
        header: "Seri No",
        cell: ({ row }) => {
          const inactive = isDeviceInactive(row.original);
          return (
            <span className={cn("font-mono text-sm", inactiveCellClass(inactive))}>
              {row.original.serialNumber ?? "—"}
            </span>
          );
        },
      },
      {
        id: "model",
        header: "Model",
        cell: ({ row }) => {
          const inactive = isDeviceInactive(row.original);
          return (
            <span className={inactiveCellClass(inactive)}>
              {row.original.model ?? row.original.deviceName ?? "—"}
            </span>
          );
        },
      },
      {
        id: "location",
        header: "Konum",
        cell: ({ row }) => {
          const inactive = isDeviceInactive(row.original);
          return (
            <span
              className={cn(
                "line-clamp-2 max-w-[220px] text-sm",
                inactiveCellClass(inactive)
              )}
            >
              {getDeviceLocationDisplay(row.original.notes)}
            </span>
          );
        },
      },
      {
        id: "warrantyExpiry",
        header: "Hizmet Sonu",
        cell: ({ row }) => {
          const inactive = isDeviceInactive(row.original);
          return (
            <span className={cn("text-sm", inactiveCellClass(inactive))}>
              {getWarrantyExpiryDisplay(row.original.notes)}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => {
          const inactive = isDeviceInactive(row.original);
          return (
            <Badge variant={inactive ? "muted" : "success"}>
              {getDeviceStatusLabel(row.original)}
            </Badge>
          );
        },
      },
    ];

    if (canWrite) {
      cols.push({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const inactive = isDeviceInactive(row.original);
          return (
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Düzenle"
                disabled={pending}
                onClick={() => setEditDevice(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {!inactive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Sil"
                  disabled={pending}
                  onClick={() => {
                    const device = row.original;
                    const ok = window.confirm(
                      `"${device.deviceName}" cihazını kullanım dışı olarak işaretlemek istediğinize emin misiniz?`
                    );
                    if (!ok) return;
                    startTransition(async () => {
                      const res = await deleteCustomerDeviceAction(
                        customerId,
                        device.id
                      );
                      if (res.success) {
                        toast.success("Cihaz kullanım dışı olarak işaretlendi");
                        router.refresh();
                      } else toast.error(res.error);
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ) : null}
            </div>
          );
        },
      });
    }

    return cols;
  }, [canWrite, customerId, pending, router]);

  return (
    <div className="space-y-4">
      {devices.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Toplam {devices.length} cihaz
          {inactiveCount > 0
            ? ` · ${activeCount} aktif · ${inactiveCount} kullanım dışı`
            : null}
        </p>
      ) : null}

      {canWrite ? (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Yeni cihaz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni cihaz</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                fd.set("customerId", customerId);
                startTransition(async () => {
                  const res = await createCustomerDeviceAction(fd);
                  if (res.success) {
                    toast.success("Cihaz eklendi");
                    setAddOpen(false);
                    form.reset();
                    router.refresh();
                  } else toast.error(res.error);
                });
              }}
            >
              <input type="hidden" name="customerId" value={customerId} />
              <DeviceFormFields idPrefix="add" />
              <Button type="submit" disabled={pending}>
                Kaydet
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {devices.length === 0 ? (
        <PremiumEmptyState
          title="Cihaz kaydı yok"
          description="Bu müşteriye henüz cihaz eklenmemiş."
        />
      ) : (
        <PremiumDataTable data={devices} columns={columns} compact />
      )}

      <Dialog
        open={editDevice !== null}
        onOpenChange={(open) => {
          if (!open) setEditDevice(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cihaz düzenle</DialogTitle>
          </DialogHeader>
          {editDevice ? (
            <form
              key={editDevice.id}
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("customerId", customerId);
                const deviceId = editDevice.id;
                startTransition(async () => {
                  const res = await updateCustomerDeviceAction(
                    customerId,
                    deviceId,
                    fd
                  );
                  if (res.success) {
                    toast.success("Cihaz güncellendi");
                    setEditDevice(null);
                    router.refresh();
                  } else toast.error(res.error);
                });
              }}
            >
              <input type="hidden" name="customerId" value={customerId} />
              <DeviceFormFields
                idPrefix="edit"
                defaultValues={toFormValues(editDevice)}
              />
              <Button type="submit" disabled={pending}>
                Güncelle
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
