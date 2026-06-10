"use client";

import { signOut } from "next-auth/react";
import { LogOut, User, KeyRound, UserCircle, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PremiumPageHeaderBar } from "@/components/premium/premium-page-header";
import { MobileSidebar } from "./mobile-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavItem } from "@/config/navigation";

type HeaderClientProps = {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  pageActions?: React.ReactNode;
  userName: string;
  userEmail: string;
  userRole: string;
  navItems: NavItem[];
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Süper Admin",
  ADMIN: "Yönetici",
  MANAGER: "Müdür",
  STAFF: "Personel",
  VIEWER: "İzleyici",
};

function roleLabel(code: string) {
  return ROLE_LABELS[code] ?? code;
}

export function HeaderClient({
  title,
  description,
  meta,
  pageActions,
  userName,
  userEmail,
  userRole,
  navItems,
}: HeaderClientProps) {
  return (
    <PremiumPageHeaderBar
      title={title}
      description={description}
      meta={meta}
      leading={<MobileSidebar navItems={navItems} />}
      actions={
        <>
          {pageActions ? (
            <div className="mr-1 flex flex-wrap items-center gap-2">
              {pageActions}
            </div>
          ) : null}
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-left"
              >
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="hidden flex-col items-start sm:flex">
                  <span className="text-sm font-medium leading-tight">
                    {userName || "Hesabım"}
                  </span>
                  {userRole ? (
                    <span className="text-[11px] font-normal leading-tight text-muted-foreground">
                      {roleLabel(userRole)}
                    </span>
                  ) : null}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold leading-tight">
                    {userName}
                  </p>
                  {userRole ? (
                    <p className="text-xs font-medium text-primary">
                      {userRole}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2" asChild>
                <a href="/profile">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  Profil
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" asChild>
                <a href="/profile/change-password">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  Şifre Değiştir
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" />
                🚪 Güvenli Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  );
}
