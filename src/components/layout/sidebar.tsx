"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  IndianRupee,
  UserPlus,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  X,
  School,
  Layers,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";

const superAdminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin-users", label: "Admin Users", icon: Users },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/sections", label: "Sections", icon: Layers },
  { href: "/sessions", label: "Academic Sessions", icon: Calendar },
  { href: "/fee-structure", label: "Fee Structure", icon: IndianRupee },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/fee-collection", label: "Fee Collection", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/students/new", label: "Register Student", icon: UserPlus },
  { href: "/fee-collection", label: "Fee Collection", icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState({ appName: "Fee Management", schoolName: "School ERP", logo: "" });
  const links = isSuperAdmin ? superAdminLinks : adminLinks;

  useEffect(() => {
    settingsApi.get()
      .then((res) => {
        const data = (res as { data?: typeof settings }).data;
        if (data) setSettings(data);
      })
      .catch(() => undefined);
  }, []);

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          {settings.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo} alt="Logo" className="h-8 w-8 rounded object-cover" />
          ) : (
            <School className="h-6 w-6 text-sidebar-primary-foreground" />
          )}
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground">{settings.appName}</h1>
          <p className="text-xs text-sidebar-foreground/60">{settings.schoolName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-sidebar-foreground">{user?.name}</p>
          <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
