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
import { formatMoneyWithCurrency } from "@/lib/utils/currency-format";
import { format } from "@/lib/utils/date-format";
import type { ComponentProps } from "react";

import type { QuoteTabId } from "@/lib/quotes/quote-tabs";
import { QUOTE_DETAIL_TABS } from "@/lib/quotes/quote-tabs";
type QuoteDetail = {
  id: string;
  number: string;
  title: string;
  notes: string | null;
  terms: string | null;
  currency: string;
  subtotal: { toString(): string };
  taxTotal: { toString(): string };
  total: { toString(): string };
  validUntil: Date | null;
  sentAt: Date | null;
  approvedAt: Date | null;
  convertedContract: { id: string; number: string } | null;
  customer: { id: string; legalName: string };
  lineItems: Array<{
    description: string;
    quantity: { toString(): string };
    unit: string;
    unitPrice: { toString(): string };
    taxRate: { toString(): string };
    lineTotal: { toString(): string };
  }>;
};

type LineItemRow = QuoteDetail["lineItems"][number];

type PdfVersionRow = {
  id: string;
  quoteVersion: number;
  sizeBytes: number;
  createdAt: Date;
};

type RevisionRow = {
  id: string;
  version: number;
  title: string;
  total: { toString(): string };
  createdAt: Date;
};

type DocumentRow = {
  id: string;
  label: string | null;
  document: { originalName: string; sizeBytes: number };
};

type Props = {
  quote: QuoteDetail;
  activeTab: QuoteTabId;
  activities: ComponentProps<typeof CustomerTimeline>["activities"];
  pdfVersions: PdfVersionRow[];
  revisions: RevisionRow[];
  documents: DocumentRow[];
};

function money(v: { toString(): string }, currency: string) {
  return formatMoneyWithCurrency(v, currency);
}

export function QuoteDetailTabs({
  quote,
  activeTab,
  activities,
  pdfVersions,
  revisions,
  documents,
}: Props) {
  const base = `/quotes/${quote.id}`;

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
            {money(row.original.unitPrice, quote.currency)}
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
            {money(row.original.lineTotal, quote.currency)}
          </span>
        ),
      },
    ],
    [quote.currency]
  );

  const pdfVersionColumns = useMemo<ColumnDef<PdfVersionRow>[]>(
    () => [
      {
        id: "info",
        header: "Sürüm",
        cell: ({ row }) => (
          <span>
            v{row.original.quoteVersion} ·{" "}
            {format(row.original.createdAt, "datetime")}
          </span>
        ),
      },
      {
        id: "action",
        header: () => <span className="block w-full text-right">İşlem</span>,
        cell: ({ row }) => (
          <a
            className="block text-right text-primary hover:underline"
            href={`/api/quotes/${quote.id}/pdf?versionId=${row.original.id}&inline=1`}
            target="_blank"
            rel="noreferrer"
          >
            Görüntüle
          </a>
        ),
      },
    ],
    [quote.id]
  );

  const documentColumns = useMemo<ColumnDef<DocumentRow>[]>(
    () => [
      {
        id: "name",
        header: "Dosya",
        cell: ({ row }) => row.original.document.originalName,
      },
    ],
    []
  );

  const revisionColumns = useMemo<ColumnDef<RevisionRow>[]>(
    () => [
      {
        id: "revision",
        header: "Revizyon",
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-medium">
              Revizyon v{row.original.version} — {row.original.title}
            </p>
            <p className="text-muted-foreground">
              {format(row.original.createdAt, "datetime")} ·{" "}
              {money(row.original.total, quote.currency)}
            </p>
          </div>
        ),
      },
    ],
    [quote.currency]
  );

  return (
    <div>
      <PremiumTabNav tabs={QUOTE_DETAIL_TABS} activeTab={activeTab} baseHref={base} />

      <PremiumTabPanel>
        {activeTab === "general" && (
          <PremiumSection>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Müşteri</dt>
              <dd>
                <Link
                  href={`/customers/${quote.customer.id}`}
                  className="font-medium hover:underline"
                >
                  {quote.customer.legalName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Geçerlilik</dt>
              <dd>
                {quote.validUntil
                  ? format(quote.validUntil, "date")
                  : "—"}
              </dd>
            </div>
            {quote.convertedContract ? (
              <div>
                <dt className="text-muted-foreground">Sözleşme</dt>
                <dd>
                  <Link
                    href={`/contracts/${quote.convertedContract.id}`}
                    className="font-mono hover:underline"
                  >
                    {quote.convertedContract.number}
                  </Link>
                </dd>
              </div>
            ) : null}
            {quote.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Notlar</dt>
                <dd className="whitespace-pre-wrap">{quote.notes}</dd>
              </div>
            ) : null}
            {quote.terms ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Şartlar</dt>
                <dd className="whitespace-pre-wrap">{quote.terms}</dd>
              </div>
            ) : null}
          </dl>
          </PremiumSection>
        )}

        {activeTab === "lines" && (
          <PremiumSection>
            <PremiumDataTable
              data={quote.lineItems}
              columns={lineItemColumns}
            />
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Ara toplam</span>
                <span>{money(quote.subtotal, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>KDV</span>
                <span>{money(quote.taxTotal, quote.currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Genel toplam</span>
                <span>{money(quote.total, quote.currency)}</span>
              </div>
            </div>
          </PremiumSection>
        )}

        {activeTab === "activity" && (
          <PremiumSection>
            <CustomerTimeline activities={activities} />
          </PremiumSection>
        )}

        {activeTab === "files" && (
          <PremiumSection>
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
        {activeTab === "files" && documents.length > 0 && (
          <PremiumSection className="mt-6">
            <h3 className="text-sm font-medium">Diğer dosyalar</h3>
            <PremiumDataTable
              data={documents}
              columns={documentColumns}
              compact
            />
          </PremiumSection>
        )}

        {activeTab === "revisions" && (
          <PremiumSection>
            {revisions.length === 0 ? (
              <PremiumEmptyState
                title="Veri Yok"
                description="Revizyon kaydı yok."
              />
            ) : (
              <PremiumDataTable
                data={revisions}
                columns={revisionColumns}
                compact
              />
            )}
          </PremiumSection>
        )}
      </PremiumTabPanel>
    </div>
  );
}
