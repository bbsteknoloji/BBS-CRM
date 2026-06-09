"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";

export type ContractDeviceOption = {
  id: string;
  deviceName: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
};

type Props = {
  customerId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

function deviceLabel(d: ContractDeviceOption): string {
  const parts = [d.deviceName];
  if (d.brand || d.model) {
    parts.push([d.brand, d.model].filter(Boolean).join(" "));
  }
  if (d.serialNumber) parts.push(`SN: ${d.serialNumber}`);
  return parts.join(" · ");
}

export function ContractDeviceSelector({
  customerId,
  selectedIds,
  onChange,
}: Props) {
  const [devices, setDevices] = useState<ContractDeviceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  useEffect(() => {
    if (!customerId) {
      setDevices([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/customers/${customerId}/devices`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Cihazlar yüklenemedi");
        return res.json() as Promise<{ devices: ContractDeviceOption[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setDevices(data.devices);
        const currentIds = selectedIdsRef.current;
        const validIds = currentIds.filter((id) =>
          data.devices.some((d) => d.id === id)
        );
        if (validIds.length !== currentIds.length) {
          onChange(validIds);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Cihaz listesi alınamadı");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customerId, onChange]);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  if (!customerId) {
    return (
      <p className="text-sm text-muted-foreground">
        Cihaz seçmek için önce müşteri seçin.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cihazlar yükleniyor…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (devices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Bu müşteriye kayıtlı cihaz yok. Müşteri detayından cihaz ekleyin.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Sözleşmeye dahil edilecek cihazlar *</Label>
      <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-input p-3">
        {devices.map((d) => (
          <label
            key={d.id}
            className="flex cursor-pointer items-start gap-2 text-sm"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border"
              checked={selectedIds.includes(d.id)}
              onChange={() => toggle(d.id)}
            />
            <span className="select-none">{deviceLabel(d)}</span>
          </label>
        ))}
      </div>
      {selectedIds.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          En az bir cihaz seçmelisiniz.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} cihaz seçildi
        </p>
      )}
    </div>
  );
}
