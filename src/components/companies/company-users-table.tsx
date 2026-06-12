"use client";

import { Badge } from "@/components/ui/badge";

type UserRole = { role: { code: string; name: string } };
type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  userRoles: UserRole[];
};

export function CompanyUsersTable({
  users,
  companyId: _companyId,
}: {
  users: User[];
  companyId: string;
}) {
  if (users.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Bu firmaya henüz kullanıcı atanmamış.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium">Ad Soyad</th>
            <th className="px-4 py-3 text-left font-medium">E-posta</th>
            <th className="px-4 py-3 text-left font-medium">Rol</th>
            <th className="px-4 py-3 text-center font-medium">Durum</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-medium">
                {u.firstName} {u.lastName}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {u.userRoles.map((ur) => (
                    <Badge key={ur.role.code} variant="outline" className="text-xs">
                      {ur.role.name}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={u.status === "ACTIVE" ? "default" : "secondary"}>
                  {u.status === "ACTIVE" ? "Aktif" : "Pasif"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
