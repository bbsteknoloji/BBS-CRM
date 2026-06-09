"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createContactAction,
  deleteContactAction,
} from "@/actions/customers/contact-actions";
import { Badge } from "@/components/ui/badge";
import { PremiumEmptyState } from "@/components/premium/premium-empty-state";

type Contact = {
  id: string;
  fullName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
};

type Props = {
  customerId: string;
  contacts: Contact[];
  canWrite: boolean;
};

export function CustomerContactsPanel({
  customerId,
  contacts,
  canWrite,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {canWrite ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Kişi ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni iletişim kişisi</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("customerId", customerId);
                startTransition(async () => {
                  const res = await createContactAction(fd);
                  if (res.success) {
                    toast.success("Kişi eklendi");
                    setOpen(false);
                  } else toast.error(res.error);
                });
              }}
            >
              <input type="hidden" name="customerId" value={customerId} />
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad soyad *</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Ünvan</Label>
                <Input id="title" name="title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPrimary" value="true" />
                Birincil kişi
              </label>
              <Button type="submit" disabled={pending}>
                Kaydet
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {contacts.length === 0 ? (
        <PremiumEmptyState
          title="Veri Yok"
          description="İletişim kişisi yok."
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-4 p-4"
            >
              <div>
                <p className="font-medium">
                  {c.fullName}
                  {c.isPrimary ? (
                    <Badge variant="secondary" className="ml-2">
                      Birincil
                    </Badge>
                  ) : null}
                </p>
                {c.title ? (
                  <p className="text-sm text-muted-foreground">{c.title}</p>
                ) : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              {canWrite && !c.isPrimary ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Sil"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const res = await deleteContactAction(
                        customerId,
                        c.id
                      );
                      if (res.success) toast.success("Kişi kaldırıldı");
                      else toast.error(res.error);
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
