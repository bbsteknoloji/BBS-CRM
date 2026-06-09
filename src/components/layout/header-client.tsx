"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { NavItem } from "@/config/navigation";

type HeaderClientProps = {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  pageActions?: React.ReactNode;
  userName: string;
  userEmail: string;
  navItems: NavItem[];
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function HeaderClient({
  title,
  description,
  meta,
  pageActions,
  userName,
  userEmail,
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
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{initials(userName || "?")}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  );
}
