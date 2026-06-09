"use client";

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  ScrollText,
  Wrench,
  MapPin,
  CheckSquare,
  Package,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";
import type { NavIconKey } from "@/config/navigation";

const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  LayoutDashboard,
  Users,
  FileText,
  ScrollText,
  Wrench,
  MapPin,
  CheckSquare,
  Package,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
};

export function resolveNavIcon(key: NavIconKey): LucideIcon {
  return NAV_ICONS[key];
}
