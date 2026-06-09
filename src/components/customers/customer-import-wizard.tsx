"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CRM_IMPORT_FIELDS,
  type ColumnMapping,
} from "@/lib/imports/logo-customer-fields";
import {
  previewCustomerImportAction,
  importCustomersAction,
  type CustomerImportPreview,
} from "@/actions/customers/import-customers";
import type { CustomerImportResult } from "@/lib/services/customer-import-service";

type Step = "upload" | "mapping" | "result";

export function CustomerImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<CustomerImportPreview | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [result, setResult] = useState<CustomerImportResult | null>(null);

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await previewCustomerImportAction(fd);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setPreview(res.data);
      setMapping(res.data.suggestedMapping);
      setStep("mapping");
      toast.success(`${res.data.totalRows} satır okundu`);
    });
  }

  function handleImport() {
    if (!preview) return;

    const required = CRM_IMPORT_FIELDS.filter((f) => f.required);
    for (const field of required) {
      if (!mapping[field.key]) {
        toast.error(`${field.label} kolonu eşleştirilmeli`);
        return;
      }
    }

    startTransition(async () => {
      const res = await importCustomersAction({
        mapping,
        fileToken: preview.fileToken,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      setResult(res.data);
      setStep("result");

      if (res.data.created > 0 || res.data.updated > 0) {
        toast.success(
          `${res.data.created} kayıt oluşturuldu, ${res.data.updated} kayıt güncellendi`
        );
      } else {
        toast.error("Hiçbir kayıt aktarılamadı");
      }
    });
  }

  function resetWizard() {
    setStep("upload");
    setPreview(null);
    setMapping({});
    setResult(null);
  }

  if (step === "result" && result) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Oluşturulan"
            value={result.created}
            tone="success"
          />
          <StatCard label="Güncellenen" value={result.updated} tone="info" />
          <StatCard label="Atlanan" value={result.skipped} tone="warn" />
        </div>

        {result.errors.length > 0 ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Hatalar ({result.errors.length})
            </h3>
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {result.errors.map((err, i) => (
                <li key={i} className="text-muted-foreground">
                  {err.rowNumber > 0 ? (
                    <>
                      <span className="font-medium text-foreground">
                        Satır {err.rowNumber}
                      </span>
                      {err.customerCode ? ` (${err.customerCode})` : ""}:{" "}
                    </>
                  ) : null}
                  {err.message}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Tüm geçerli kayıtlar başarıyla aktarıldı.
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/customers">Müşteri listesine git</Link>
          </Button>
          <Button type="button" variant="outline" onClick={resetWizard}>
            Yeni içe aktarım
          </Button>
        </div>
      </div>
    );
  }

  if (step === "mapping" && preview) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium">
            {preview.totalRows} satır · {preview.headers.length} kolon
          </p>
          <p className="mt-1 text-muted-foreground">
            Logo İşbaşı kolonlarını CRM alanlarıyla eşleştirin. Cari kodu
            mevcut müşteride varsa güncelleme yapılır.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CRM_IMPORT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`map-${field.key}`}>
                {field.label}
                {field.required ? " *" : ""}
              </Label>
              <select
                id={`map-${field.key}`}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={mapping[field.key] ?? ""}
                onChange={(e) =>
                  setMapping((prev) => ({
                    ...prev,
                    [field.key]: e.target.value || undefined,
                  }))
                }
              >
                <option value="">— Seçin —</option>
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">#</th>
                {preview.headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.preview.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  {preview.headers.map((h) => (
                    <td key={h} className="max-w-[200px] truncate px-3 py-2">
                      {row[h] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
            Önizleme: ilk {preview.preview.length} satır
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("upload")}
            disabled={pending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <Button type="button" onClick={handleImport} disabled={pending}>
            {pending ? "Aktarılıyor…" : "İçe aktarmayı başlat"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpload} className="space-y-6">
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-center">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Logo İşbaşı cari dosyası</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Excel (.xlsx, .xls) veya CSV dosyasını yükleyin. Maks. 5 MB,{" "}
          {5000} satır.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <input
            id="import-file"
            name="file"
            type="file"
            accept=".xlsx,.xls,.csv"
            required
            className="block max-w-sm text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-sm">
        <h3 className="font-medium">Beklenen kolonlar (Logo İşbaşı)</h3>
        <ul className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
          <li>Cari Kodu → customerCode</li>
          <li>Cari Ünvanı → legalName</li>
          <li>Vergi No → taxNumber</li>
          <li>Telefon, E-posta, Adres, Yetkili</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" asChild>
          <Link href="/customers">İptal</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          <Upload className="mr-2 h-4 w-4" />
          {pending ? "Okunuyor…" : "Dosyayı yükle ve önizle"}
        </Button>
      </div>
    </form>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "info" | "warn";
}) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
    warn: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  };

  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
