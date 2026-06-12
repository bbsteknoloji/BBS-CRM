"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, PowerOff, Power, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleCompanyStatusAction } from "@/actions/companies/update-company";

type Company = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  _count: { users: number; customers: number };
};

export function CompanyTable({ companies }: { companies: Company[] }) {
  if (companies.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Henüz firma kaydı yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium">Firma adı</th>
            <th className="px-4 py-3 text-left font-medium">İletişim</th>
            <th className="px-4 py-3 text-center font-medium">Kullanıcı</th>
            <th className="px-4 py-3 text-center font-medium">Müşteri</th>
            <th className="px-4 py-3 text-center font-medium">Durum</th>
            <th className="px-4 py-3 text-right font-medium">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <CompanyRow key={c.id} company={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompanyRow({ company: c }: { company: Company }) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleCompanyStatusAction(c.id, !c.isActive);
      if (result.success) {
        toast.success(c.isActive ? "Firma pasife alındı" : "Firma aktife alındı");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 font-medium">{c.name}</td>
      <td className="px-4 py-3 text-muted-foreground">
        <div>{c.email ?? "—"}</div>
        {c.phone && <div className="text-xs">{c.phone}</div>}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          {c._count.users}
        </span>
      </td>
      <td className="px-4 py-3 text-center">{c._count.customers}</td>
      <td className="px-4 py-3 text-center">
        <Badge variant={c.isActive ? "default" : "secondary"}>
          {c.isActive ? "Aktif" : "Pasif"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" asChild title="Düzenle">
            <Link href={`/companies/${c.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={pending}
            title={c.isActive ? "Pasife al" : "Aktife al"}
          >
            {c.isActive ? (
              <PowerOff className="h-4 w-4 text-destructive" />
            ) : (
              <Power className="h-4 w-4 text-green-600" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}
