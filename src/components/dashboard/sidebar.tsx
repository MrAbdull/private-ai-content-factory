"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Calendar,
  CheckCircle,
  Archive,
  FileInput,
  LayoutDashboard,
  Library,
  Settings,
  TrendingUp,
  Youtube,
  Zap,
  Factory,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Youtube,
  Zap,
  FileInput,
  Library,
  CheckCircle,
  Archive,
  Calendar,
  BarChart3,
  TrendingUp,
  Bot,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Factory className="h-6 w-6 text-primary" />
        <div>
          <p className="text-sm font-bold tracking-tight">Content Factory</p>
          <p className="text-xs text-muted-foreground">Private AI Studio</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">Single-user private studio</p>
        <p className="text-xs text-muted-foreground">No billing · No multi-tenancy</p>
      </div>
    </aside>
  );
}
