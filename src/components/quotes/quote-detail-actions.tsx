"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { QuoteStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/premium/premium-button";
import { quotePdfDownloadFilename } from "@/lib/pdf/quote-pdf-filename";
import {
  sendQuoteAction,
  approveQuoteAction,
  rejectQuoteAction,
  revisionQuoteAction,
  resendQuoteAction,
  convertQuoteAction,
  generateQuotePdfAction,
  signQuoteAction,
} from "@/actions/quotes/status-actions";
import { deleteQuoteAction } from "@/actions/quotes/delete-quote";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { isQuoteEditable } from "@/lib/services/quote-state-machine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  quoteId: string;
  quoteNumber: string;
  status: QuoteStatus;
  canWrite: boolean;
  canApprove: boolean;
  canDelete: boolean;
};

export function QuoteDetailActions({
  quoteId,
  quoteNumber,
  status,
  canWrite,
  canApprove,
  canDelete,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pdfDownloadName = quotePdfDownloadFilename(quoteNumber);
  const pdfRegenerateQuery =
    canWrite || canApprove ? "&regenerate=1" : "";
  const pdfDownloadUrl = `/api/quotes/${quoteId}/pdf?download=1${pdfRegenerateQuery}`;
  const pdfPreviewUrl = `/api/quotes/${quoteId}/pdf?inline=1${pdfRegenerateQuery}`;

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        toast.success("İşlem tamamlandı");
        router.refresh();
      } else toast.error(res.error ?? "Hata");
    });
  }

  function runPdfGenerate() {
    startTransition(async () => {
      const res = await generateQuotePdfAction(quoteId);
      if (res.success) {
        toast.success("PDF oluşturuldu");
        router.refresh();
        window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.error ?? "PDF oluşturulamadı");
      }
    });
  }

  function runSign() {
    const ok = window.confirm("BBS kaşe-imzası PDF'ye basılacak. Devam edilsin mi?");
    if (!ok) return;
    startTransition(async () => {
      const res = await signQuoteAction(quoteId);
      if (res.success) {
        toast.success("Teklif imzalandı");
        router.refresh();
        window.open(`/api/quotes/${quoteId}/pdf?inline=1`, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.error ?? "İmzalama başarısız");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canWrite && isQuoteEditable(status) ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/quotes/${quoteId}/edit`}>Düzenle</Link>
        </Button>
      ) : null}

      {canWrite && status === "DRAFT" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => sendQuoteAction(quoteId))}
        >
          Gönder
        </Button>
      ) : null}

      {canWrite && status === "SENT" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run(() => revisionQuoteAction(quoteId))}
        >
          Revizyona al
        </Button>
      ) : null}

      {canWrite && status === "REVISION" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => resendQuoteAction(quoteId))}
        >
          Yeniden gönder
        </Button>
      ) : null}

      {canApprove && status === "SENT" ? (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => approveQuoteAction(quoteId))}
          >
            Onayla
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Reddet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Teklifi reddet</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("quoteId", quoteId);
                  run(() => rejectQuoteAction(fd));
                }}
              >
                <input type="hidden" name="quoteId" value={quoteId} />
                <div className="space-y-2">
                  <Label htmlFor="reason">Gerekçe</Label>
                  <Input id="reason" name="reason" />
                </div>
                <Button type="submit" className="mt-4" disabled={pending}>
                  Reddet
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      {canApprove && status === "APPROVED" ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Sözleşmeye dönüştür</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sözleşme oluştur</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("quoteId", quoteId);
                startTransition(async () => {
                  const res = await convertQuoteAction(fd);
                  if (res.success) {
                    toast.success(
                      `Sözleşme ${res.data.contractNumber} oluşturuldu`
                    );
                    router.push(`/contracts/${res.data.contractId}`);
                  } else toast.error(res.error);
                });
              }}
            >
              <input type="hidden" name="quoteId" value={quoteId} />
              <div className="space-y-3">
                <div>
                  <Label htmlFor="startDate">Başlangıç *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Bitiş</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
              </div>
              <Button type="submit" className="mt-4" disabled={pending}>
                Dönüştür
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {(canWrite || canApprove) ? (
        <PremiumButton
          size="sm"
          disabled={pending}
          onClick={runPdfGenerate}
        >
          PDF Oluştur
        </PremiumButton>
      ) : null}

      {(canWrite || canApprove) ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={runSign}
        >
          İmzala
        </Button>
      ) : null}
      <PremiumButton premiumVariant="outline" size="sm" asChild>
        <a href={pdfDownloadUrl} download={pdfDownloadName}>
          PDF İndir
        </a>
      </PremiumButton>
      <PremiumButton premiumVariant="outline" size="sm" asChild>
        <a
          href={pdfPreviewUrl}
          target="_blank"
          rel="noreferrer"
        >
          PDF Önizle
        </a>
      </PremiumButton>

      {canDelete ? (
        <DeleteConfirmDialog
          label={`Teklif ${quoteNumber}`}
          description={`"${quoteNumber}" numaralı teklif kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
          onDelete={() => deleteQuoteAction(quoteId)}
          redirectTo="/quotes"
        />
      ) : null}
    </div>
  );
}
