"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ContractStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/premium/premium-button";
import { contractPdfDownloadFilename } from "@/lib/pdf/contract-pdf-filename";
import {
  activateContractAction,
  signContractAction,
  suspendContractAction,
  resumeContractAction,
  terminateContractAction,
  expireContractAction,
  renewContractAction,
  generateContractPdfAction,
} from "@/actions/contracts/status-actions";
import { deleteContractAction } from "@/actions/contracts/delete-contract";
import { isContractEditable, canSignContract } from "@/lib/services/contract-state-machine";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  contractId: string;
  contractNumber: string;
  status: ContractStatus;
  endDate: string | null;
  canWrite: boolean;
  canRenew: boolean;
  canTerminate: boolean;
  canDelete: boolean;
};

export function ContractDetailActions({
  contractId,
  contractNumber,
  status,
  endDate,
  canWrite,
  canRenew,
  canTerminate,
  canDelete,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run<T extends { success: boolean; error?: string }>(
    action: () => Promise<T>,
    onSuccess?: (data: T) => void
  ) {
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        toast.success("İşlem tamamlandı");
        if (onSuccess) onSuccess(res);
        else router.refresh();
      } else toast.error(res.error ?? "Hata");
    });
  }

  const defaultNewStart = endDate
    ? new Date(new Date(endDate).getTime() + 86400000)
        .toISOString()
        .slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const pdfDownloadName = contractPdfDownloadFilename(contractNumber);
  const pdfDownloadUrl = `/api/contracts/${contractId}/pdf?download=1`;

  function runPdfGenerate() {
    startTransition(async () => {
      const res = await generateContractPdfAction(contractId);
      if (res.success) {
        toast.success("Word ve PDF sözleşme belgeleri oluşturuldu");
        router.refresh();
        window.open(pdfDownloadUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.error ?? "Belge oluşturulamadı");
      }
    });
  }

  function runSign() {
    const ok = window.confirm(
      "Sözleşme imzalanacak, BBS kaşe-imzası PDF'ye basılacak ve kayıt kilitlenecek. Devam edilsin mi?"
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await signContractAction(contractId);
      if (res.success) {
        toast.success("Sözleşme imzalandı");
        router.refresh();
        window.open(pdfDownloadUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error(res.error ?? "İmzalama başarısız");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canWrite && isContractEditable(status) ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/contracts/${contractId}/edit`}>Düzenle</Link>
        </Button>
      ) : null}

      {(canWrite || canRenew) && status === "DRAFT" ? (
        <PremiumButton
          size="sm"
          disabled={pending}
          onClick={runPdfGenerate}
        >
          Taslak Word + PDF
        </PremiumButton>
      ) : null}
      <PremiumButton premiumVariant="outline" size="sm" asChild>
        <a href={pdfDownloadUrl} download={pdfDownloadName}>
          PDF İndir
        </a>
      </PremiumButton>
      <PremiumButton premiumVariant="outline" size="sm" asChild>
        <a
          href={`/api/contracts/${contractId}/pdf?inline=1`}
          target="_blank"
          rel="noreferrer"
        >
          PDF Önizle
        </a>
      </PremiumButton>

      {canWrite && canSignContract(status) ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={runSign}
        >
          İmzala
        </Button>
      ) : null}

      {canWrite && status === "SIGNED" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => activateContractAction(contractId))}
        >
          Aktifleştir
        </Button>
      ) : null}

      {canWrite && status === "ACTIVE" ? (
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Askıya al
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Askıya al</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("contractId", contractId);
                  run(() => suspendContractAction(fd));
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="reason">Gerekçe</Label>
                  <Textarea id="reason" name="reason" rows={2} />
                </div>
                <Button className="mt-4" type="submit" disabled={pending}>
                  Onayla
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run(() => expireContractAction(contractId))}
          >
            Süresi doldu
          </Button>
        </>
      ) : null}

      {canWrite && status === "SUSPENDED" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => resumeContractAction(contractId))}
        >
          Devam ettir
        </Button>
      ) : null}

      {canTerminate && status === "ACTIVE" ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Feshet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sözleşmeyi feshet</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("contractId", contractId);
                run(() => terminateContractAction(fd));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="term-reason">Gerekçe</Label>
                <Textarea id="term-reason" name="reason" rows={2} required />
              </div>
              <Button
                className="mt-4"
                variant="destructive"
                type="submit"
                disabled={pending}
              >
                Feshet
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {canDelete ? (
        <DeleteConfirmDialog
          label={`Sözleşme ${contractNumber}`}
          description={`"${contractNumber}" numaralı sözleşme kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
          onDelete={() => deleteContractAction(contractId)}
          redirectTo="/contracts"
        />
      ) : null}

      {canRenew && status === "ACTIVE" ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Yenile</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sözleşmeyi yenile</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("contractId", contractId);
                startTransition(async () => {
                  const res = await renewContractAction(fd);
                  if (res.success) {
                    toast.success(
                      `Yeni sözleşme: ${res.data.contractNumber}`
                    );
                    router.push(`/contracts/${res.data.contractId}`);
                  } else {
                    toast.error(res.error ?? "Yenileme hatası");
                  }
                });
              }}
            >
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="newStartDate">Yeni başlangıç *</Label>
                  <Input
                    id="newStartDate"
                    name="newStartDate"
                    type="date"
                    required
                    defaultValue={defaultNewStart}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEndDate">Yeni bitiş</Label>
                  <Input id="newEndDate" name="newEndDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renew-notes">Not</Label>
                  <Textarea id="renew-notes" name="notes" rows={2} />
                </div>
              </div>
              <Button className="mt-4" type="submit" disabled={pending}>
                Yenile ve yeni sözleşme oluştur
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
