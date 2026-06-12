import type { Permission } from "@/lib/permissions/types";

/** Serileştirilebilir menü ikonu (Server → Client güvenli) */
export type NavIconKey =
  | "LayoutDashboard"
  | "Users"
  | "FileText"
  | "ScrollText"
  | "Wrench"
  | "MapPin"
  | "CheckSquare"
  | "Package"
  | "FolderOpen"
  | "BarChart3"
  | "Bell"
  | "Settings"
  | "Building2";

export type NavItem = {
  title: string;
  href: string;
  icon: NavIconKey;
  permissions: Permission[];
};

/** Ana menü — Türkçe (Faz 5) */
export const mainNavigation: NavItem[] = [
  {
    title: "Ana Panel",
    href: "/dashboard",
    icon: "LayoutDashboard",
    permissions: [],
  },
  {
    title: "Müşteriler",
    href: "/customers",
    icon: "Users",
    permissions: ["customer:read"],
  },
  {
    title: "Teklifler",
    href: "/quotes",
    icon: "FileText",
    permissions: ["quote:read"],
  },
  {
    title: "Sözleşmeler",
    href: "/contracts",
    icon: "ScrollText",
    permissions: ["contract:read"],
  },
  {
    title: "Servis Talepleri",
    href: "/service-tickets",
    icon: "Wrench",
    permissions: ["service:read"],
  },
  {
    title: "Saha Ziyaretleri",
    href: "/visits",
    icon: "MapPin",
    permissions: ["visit:read"],
  },
  {
    title: "Görevler",
    href: "/tasks",
    icon: "CheckSquare",
    permissions: ["task:read"],
  },
  {
    title: "Ürün Kataloğu",
    href: "/products",
    icon: "Package",
    permissions: ["product:read"],
  },
  {
    title: "Dosya Merkezi",
    href: "/files",
    icon: "FolderOpen",
    permissions: ["file:read"],
  },
  {
    title: "Raporlar",
    href: "/reports",
    icon: "BarChart3",
    permissions: ["report:read", "report:export"],
  },
  {
    title: "Bildirimler",
    href: "/notifications",
    icon: "Bell",
    permissions: ["notification:read"],
  },
  {
    title: "Ayarlar",
    href: "/settings",
    icon: "Settings",
    permissions: ["settings:manage", "settings:read"],
  },
  {
    title: "Firmalar",
    href: "/companies",
    icon: "Building2",
    permissions: ["company:manage"],
  },
];

export function filterNavigationByPermissions(
  permissions: Permission[]
): NavItem[] {
  const set = new Set(permissions);
  return mainNavigation.filter(
    (item) =>
      item.permissions.length === 0 ||
      item.permissions.some((p) => set.has(p))
  );
}
