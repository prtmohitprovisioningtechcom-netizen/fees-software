"use client";

import { Menu, X, LogOut, Phone, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useBranding } from "@/lib/branding-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopNavbarProps = {
  onMenuToggle: () => void;
  mobileOpen: boolean;
};

export function TopNavbar({ onMenuToggle, mobileOpen }: TopNavbarProps) {
  const { user, logout } = useAuth();
  const { branding, loaded } = useBranding();
  const roleLabel = user?.role === "super_admin" ? "Super Admin" : "Admin";

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-12 border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:left-52">
      <div className="flex h-full items-center gap-2 px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
          onClick={onMenuToggle}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <div className="hidden min-w-0 flex-1 items-center gap-3 overflow-hidden text-xs text-sidebar-foreground/75 md:flex">
          {loaded && branding.phone ? (
            <span className="flex items-center gap-1 truncate">
              <Phone className="h-3 w-3 shrink-0 text-sidebar-primary" />
              {branding.phone}
            </span>
          ) : null}
          {loaded && branding.email ? (
            <span className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0 text-sidebar-primary" />
              {branding.email}
            </span>
          ) : null}
          {loaded && branding.address ? (
            <span className="flex min-w-0 items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0 text-sidebar-primary" />
              <span className="truncate">{branding.address}</span>
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium leading-none text-sidebar-foreground">{user?.name}</p>
            <p className="mt-0.5 text-[10px] text-sidebar-foreground/60">{roleLabel}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium sm:hidden",
              user?.role === "super_admin"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "bg-sidebar-accent text-sidebar-foreground/80"
            )}
          >
            {roleLabel}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 border border-sidebar-border px-2.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={logout}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
