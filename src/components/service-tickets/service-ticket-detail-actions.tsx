"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ServiceTicketStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  startServiceTicketAction,
  waitCustomerServiceTicketAction,
  resumeServiceTicketAction,
  resolveServiceTicketAction,
  closeServiceTicketAction,
  assignServiceTicketAction,
} from "@/actions/service-tickets/status-actions";
import { deleteServiceTicketAction } from "@/actions/service-tickets/delete-service-ticket";
import { isServiceTicketEditable } from "@/lib/services/service-ticket-state-machine";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";

type UserOption = { id: string; firstName: string; lastName: string };

type Props = {
  serviceTicketId: string;
  ticketNo: string;
  status: ServiceTicketStatus;
  canWrite: boolean;
  canAssign: boolean;
  canClose: boolean;
  canDelete: boolean;
  canPdf: boolean;
  users: UserOption[];
};

export function ServiceTicketDetailActions({
  serviceTicketId,
  ticketNo,
  status,
  canWrite,
  canAssign,
  canClose,
  canDelete,
  canPdf,
  users,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        toast.success("İşlem tamamlandı");
        router.refresh();
      } else toast.error(res.error ?? "Hata");
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canWrite && isServiceTicketEditable(status) ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/service-tickets/${serviceTicketId}/edit`}>
            Düzenle
          </Link>
        </Button>
      ) : null}

      {canWrite && status === "OPEN" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => startServiceTicketAction(serviceTicketId))}
        >
          İşleme al
        </Button>
      ) : null}

      {canWrite && status === "IN_PROGRESS" ? (
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Müşteri bekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Müşteri yanıtı bekleniyor</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("serviceTicketId", serviceTicketId);
                  run(() => waitCustomerServiceTicketAction(fd));
                }}
              >
                <Textarea name="reason" rows={2} placeholder="Not (opsiyonel)" />
                <Button className="mt-4" type="submit" disabled={pending}>
                  Kaydet
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">Çözüldü</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Çözüm notu</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("serviceTicketId", serviceTicketId);
                  run(() => resolveServiceTicketAction(fd));
                }}
              >
                <Textarea name="reason" rows={3} />
                <Button className="mt-4" type="submit" disabled={pending}>
                  Çözüldü işaretle
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      {canWrite && status === "WAITING_CUSTOMER" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => resumeServiceTicketAction(serviceTicketId))}
        >
          Devam et
        </Button>
      ) : null}

      {canClose && status === "RESOLVED" ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Kapat</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Talebi kapat</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("serviceTicketId", serviceTicketId);
                run(() => closeServiceTicketAction(fd));
              }}
            >
              <Textarea name="reason" rows={2} placeholder="Kapanış notu" />
              <Button className="mt-4" type="submit" disabled={pending}>
                Kapat
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {canAssign && status !== "CLOSED" ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Personel ata
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Personel ata</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("serviceTicketId", serviceTicketId);
                run(() => assignServiceTicketAction(fd));
              }}
            >
              <Label htmlFor="assignedUserId">Personel</Label>
              <select
                id="assignedUserId"
                name="assignedUserId"
                required
                className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="">Seçin</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
              <Button className="mt-4" type="submit" disabled={pending}>
                Ata
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Servis fişi — her role açık, tarayıcıda yazdırılabilir */}
      <Button variant="outline" size="sm" asChild>
        <a
          href={`/service-tickets/${serviceTicketId}/print`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Servis Fişi
        </a>
      </Button>

      {canPdf ? (
        <Button variant="outline" size="sm" asChild>
          <a
            href={`/api/service-tickets/${serviceTicketId}/pdf?inline=1&regenerate=1`}
            target="_blank"
            rel="noopener noreferrer"
          >
            PDF Önizle
          </a>
        </Button>
      ) : null}

      {canPdf ? (
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/service-tickets/${serviceTicketId}/pdf?download=1&regenerate=1`}>
            PDF İndir
          </a>
        </Button>
      ) : null}

      {canDelete ? (
        <DeleteConfirmDialog
          label={`Servis Talebi ${ticketNo}`}
          description={`"${ticketNo}" numaralı servis talebi kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
          onDelete={() => deleteServiceTicketAction(serviceTicketId)}
          redirectTo="/service-tickets"
        />
      ) : null}
    </div>
  );
}
