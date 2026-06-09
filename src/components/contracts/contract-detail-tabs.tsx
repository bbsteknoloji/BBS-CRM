"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  PremiumTabNav,
  PremiumTabPanel,
} from "@/components/premium/premium-tab-nav";
import { PremiumDataTable } from "@/components/premium/premium-data-table";
import { PremiumEmptyState } from "@/components/premium/premium-empty-state";
import { PremiumSection } from "@/components/premium/premium-section";
import { CustomerTimeline } from "@/components/customers/customer-timeline";
import { ContractFileUpload } from "./contract-file-upload";
import { format } from "@/lib/utils/date-format";
import type { ComponentProps } from "react";
import {
  CONTRACT_DETAIL_TABS,
  type ContractTabId,
} from "@/lib/contracts/contract-tabs";

export type { ContractTabId };

type ContractDetail = {
  id: string;
  number: string;
  title: string;
  notes: string | null;
  terms: string | null;
  currency: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
  renewalNoticeDays: number;
  signedAt: Date | null;
  subtotal: { toString(): string };
  taxTotal: { toString(): string };
  total: { toString(): string };
  customer: { id: string; legalName: string };
  sourceQuote: { id: string; number: string; status: string } | null;
  parentContract: { id: string; number: string } | null;
  owner: { firstName: string; lastName: string };
  lineItems: Array<{
    description: string;
    quantity: { toString(): string };
    unit: string;
    unitPrice: { toString(): string };
    taxRate: { toString(): string };
    lineTotal: { toString(): string };
  }>;
  contractDevices?: Array<{
    device: {
      id: string;
      deviceName: string;
      brand: string | null;
      model: string | null;
      serialNumber: string | null;
    };
  }>;
};

type LineItemRow = ContractDetail["lineItems"][number];

type PdfVersionRow = {
  id: string;
  version: number;
  sizeBytes: number;
  createdAt: Date;
};

type DocumentRow = {
  id: string;
  label: string | null;
  document: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
};

type RenewalRow = {
  id: string;
  status: string;
  previousEndDate: Date;
  newStartDate: Date;
  newEndDate: Date | null;
  renewedAt: Date | null;
  newContractId: string | null;
  createdAt: Date;
};

type AuditLogRow = {
  id: string;
  action: string;
  changes: unknown;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

type Props = {
  contract: ContractDetail;
  activeTab: ContractTabId;
  activities: ComponentProps<typeof CustomerTimeline>["activities"];
  pdfVersions: PdfVersionRow[];
  renewals: RenewalRow[];
  documents: DocumentRow[];
  auditLogs: AuditLogRow[];
  canUpload: boolean;
};

function money(v: { toString(): string }, currency: string) {
  return `${Number(v.toString()).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
  })} ${currency}`;
}

export function ContractDetailTabs({
  contract,
  activeTab,
  activities,
  pdfVersions,
  renewals,
  documents,
  auditLogs,
  canUpload,
}: Props) {
  const base = `/contracts/${contract.id}`;

  const lineItemColumns = useMemo<ColumnDef<LineItemRow>[]>(
    () => [
      {
        id: "description",
        header: "Açıklama",
        cell: ({ row }) => row.original.description,
      },
      {
        id: "quantity",
        header: () => (
          <span className="block w-full text-right">Miktar</span>
        ),
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {Number(row.original.quantity.toString())}
          </span>
        ),
      },
      {
        id: "unit",
        header: "Birim",
        cell: ({ row }) => row.original.unit,
      },
      {
        id: "unitPrice",
        header: () => (
          <span className="block w-full text-right">Fiyat</span>
        ),
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {money(row.original.unitPrice, contract.currency)}
          </span>
        ),
      },
      {
        id: "taxRate",
        header: () => <span className="block w-full text-right">KDV</span>,
        cell: ({ row }) => (
          <span className="block text-right">
            %{Number(row.original.taxRate.toString())}
          </span>
        ),
      },
      {
        id: "lineTotal",
        header: () => (
          <span className="block w-full text-right">Toplam</span>
        ),
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {money(row.original.lineTotal, contract.currency)}
          </span>
        ),
      },
    ],
    [contract.currency]
  );

  const pdfVersionColumns = useMemo<ColumnDef<PdfVersionRow>[]>(
    () => [
      {
        id: "info",
        header: "Sürüm",
        cell: ({ row }) => (
          <span>
            Sürüm {row.original.version} ·{" "}
            {format(row.original.createdAt, "datetime")} ·{" "}
            {(row.original.sizeBytes / 1024).toFixed(0)} KB
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="block w-full text-right">İşlem</span>,
        cell: ({ row }) => (
          <span className="flex justify-end gap-3">
            <a
              className="text-primary hover:underline"
              href={`/api/contracts/${contract.id}/pdf?versionId=${row.original.id}&inline=1`}
              target="_blank"
              rel="noreferrer"
            >
              Görüntüle
            </a>
            <a
              className="text-primary hover:underline"
              href={`/api/contracts/${contract.id}/pdf?versionId=${row.original.id}`}
              download
            >
              İndir
            </a>
          </span>
        ),
      },
    ],
    [contract.id]
  );

  const documentColumns = useMemo<ColumnDef<DocumentRow>[]>(
    () => [
      {
        id: "name",
        header: "Dosya",
        cell: ({ row }) => (
          <span>
            {row.original.label ? `${row.original.label} · ` : ""}
            {row.original.document.originalName}
          </span>
        ),
      },
      {
        id: "action",
        header: () => <span className="block w-full text-right">İşlem</span>,
        cell: ({ row }) => (
          <a
            className="block text-right text-primary hover:underline"
            href={`/api/contracts/${contract.id}/documents/${row.original.document.id}`}
            target="_blank"
            rel="noreferrer"
          >
            {row.original.document.mimeType === "application/pdf"
              ? "Görüntüle"
              : "İndir"}
          </a>
        ),
      },
    ],
    [contract.id]
  );

  const renewalColumns = useMemo<ColumnDef<RenewalRow>[]>(
    () => [
      {
        id: "renewal",
        header: "Yenileme",
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-medium">
              {format(row.original.newStartDate, "date")}
              {row.original.newEndDate
                ? ` — ${format(row.original.newEndDate, "date")}`
                : ""}
            </p>
            <p className="text-muted-foreground">
              {format(row.original.createdAt, "datetime")} · {row.original.status}
              {row.original.newContractId ? (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={`/contracts/${row.original.newContractId}`}
                    className="text-primary hover:underline"
                  >
                    Yeni sözleşme
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        ),
      },
    ],
    []
  );

  const auditColumns = useMemo<ColumnDef<AuditLogRow>[]>(
    () => [
      {
        id: "audit",
        header: "Kayıt",
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-medium">
              {row.original.action} · {format(row.original.createdAt, "datetime")}
            </p>
            <p className="text-muted-foreground">
              {row.original.user
                ? `${row.original.user.firstName} ${row.original.user.lastName} (${row.original.user.email})`
                : "Sistem"}
            </p>
            {row.original.changes ? (
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(row.original.changes, null, 2)}
              </pre>
            ) : null}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PremiumTabNav tabs={CONTRACT_DETAIL_TABS} activeTab={activeTab} baseHref={base} />

      <PremiumTabPanel>
        {activeTab === "general" && (
          <PremiumSection>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Müşteri</dt>
              <dd>
                <Link
                  href={`/customers/${contract.customer.id}`}
                  className="font-medium hover:underline"
                >
                  {contract.customer.legalName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sahip</dt>
              <dd>
                {contract.owner.firstName} {contract.owner.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Başlangıç</dt>
              <dd>{format(contract.startDate, "date")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bitiş</dt>
              <dd>
                {contract.endDate
                  ? format(contract.endDate, "date")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Yenileme bildirimi</dt>
              <dd>{contract.renewalNoticeDays} gün önce</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Otomatik yenileme</dt>
              <dd>{contract.autoRenew ? "Evet" : "Hayır"}</dd>
            </div>
            {contract.sourceQuote ? (
              <div>
                <dt className="text-muted-foreground">Kaynak teklif</dt>
                <dd>
                  <Link
                    href={`/quotes/${contract.sourceQuote.id}`}
                    className="font-mono hover:underline"
                  >
                    {contract.sourceQuote.number}
                  </Link>
                </dd>
              </div>
            ) : null}
            {contract.parentContract ? (
              <div>
                <dt className="text-muted-foreground">Önceki sözleşme</dt>
                <dd>
                  <Link
                    href={`/contracts/${contract.parentContract.id}`}
                    className="font-mono hover:underline"
                  >
                    {contract.parentContract.number}
                  </Link>
                </dd>
              </div>
            ) : null}
            {contract.signedAt ? (
              <div>
                <dt className="text-muted-foreground">İmza / aktivasyon</dt>
                <dd>{format(contract.signedAt, "datetime")}</dd>
              </div>
            ) : null}
            {contract.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Açıklama</dt>
                <dd className="whitespace-pre-wrap">{contract.notes}</dd>
              </div>
            ) : null}
            {contract.terms ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Şartlar</dt>
                <dd className="whitespace-pre-wrap">{contract.terms}</dd>
              </div>
            ) : null}
          </dl>
          {contract.contractDevices && contract.contractDevices.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                Sözleşmeye dahil cihazlar
              </h3>
              <ul className="space-y-1 text-sm">
                {contract.contractDevices.map(({ device }) => (
                  <li key={device.id}>
                    {device.deviceName}
                    {(device.brand || device.model) && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {[device.brand, device.model].filter(Boolean).join(" ")}
                      </span>
                    )}
                    {device.serialNumber ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · SN: {device.serialNumber}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          </PremiumSection>
        )}

        {activeTab === "lines" && (
          <PremiumSection>
            <PremiumDataTable
              data={contract.lineItems}
              columns={lineItemColumns}
            />
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Ara toplam</span>
                <span>{money(contract.subtotal, contract.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>KDV</span>
                <span>{money(contract.taxTotal, contract.currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Genel toplam</span>
                <span>{money(contract.total, contract.currency)}</span>
              </div>
            </div>
          </PremiumSection>
        )}

        {activeTab === "files" && (
          <PremiumSection>
            {canUpload ? (
              <ContractFileUpload contractId={contract.id} />
            ) : null}
            <h3 className="text-sm font-medium">PDF sürümleri</h3>
            {pdfVersions.length === 0 ? (
              <PremiumEmptyState
                title="Veri Yok"
                description="Henüz PDF üretilmedi."
              />
            ) : (
              <PremiumDataTable
                data={pdfVersions}
                columns={pdfVersionColumns}
                compact
              />
            )}
          </PremiumSection>
        )}
        {activeTab === "files" && (
          <PremiumSection className="mt-6">
            <h3 className="text-sm font-medium">Yüklenen dosyalar</h3>
            {documents.length === 0 ? (
              <PremiumEmptyState
                title="Veri Yok"
                description="Dosya yok."
              />
            ) : (
              <PremiumDataTable
                data={documents}
                columns={documentColumns}
                compact
              />
            )}
          </PremiumSection>
        )}

        {activeTab === "renewals" && (
          <PremiumSection>
            {renewals.length === 0 ? (
              <PremiumEmptyState
                title="Veri Yok"
                description="Yenileme kaydı yok."
              />
            ) : (
              <PremiumDataTable
                data={renewals}
                columns={renewalColumns}
                compact
              />
            )}
          </PremiumSection>
        )}

        {activeTab === "activity" && (
          <PremiumSection>
            <CustomerTimeline activities={activities} />
          </PremiumSection>
        )}

        {activeTab === "audit" && (
          <PremiumSection>
            {auditLogs.length === 0 ? (
              <PremiumEmptyState
                title="Kayıt Bulunamadı"
                description="Denetim kaydı yok."
              />
            ) : (
              <PremiumDataTable
                data={auditLogs}
                columns={auditColumns}
                compact
              />
            )}
          </PremiumSection>
        )}
      </PremiumTabPanel>
    </div>
  );
}
