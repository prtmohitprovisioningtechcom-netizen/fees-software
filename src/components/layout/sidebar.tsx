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
  School,
  Layers,
  Settings,
  Wallet,
  Bus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useBranding } from "@/lib/branding-context";
import { Skeleton } from "@/components/ui/skeleton";

type NavLink = { href: string; label: string; icon: LucideIcon };

const superAdminLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin-users", label: "Admin Users", icon: Users },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/sections", label: "Sections", icon: Layers },
  { href: "/sessions", label: "Sessions", icon: Calendar },
  { href: "/fee-structure", label: "Fee Structure", icon: IndianRupee },
  { href: "/transport-routes", label: "Transport Routes", icon: Bus },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/fee-collection", label: "Fee Collection", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/students/new", label: "Register", icon: UserPlus },
  { href: "/fee-collection", label: "Fee Collection", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

function isLinkActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  mobileOpen: boolean;
  onNavigate: () => void;
};

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();
  const { branding, loaded } = useBranding();
  const links = isSuperAdmin ? superAdminLinks : adminLinks;
  const schoolTitle = branding.schoolName.trim() || branding.appName.trim();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-52 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="shrink-0 border-b border-sidebar-border px-3 py-4">
        {!loaded ? (
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-16 w-16 rounded-xl bg-sidebar-foreground/15" />
            <Skeleton className="h-4 w-full bg-sidebar-foreground/15" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-sidebar-primary shadow-md ring-2 ring-white/10">
              {branding.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logo} alt="Logo" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <School className="h-8 w-8 text-sidebar-primary-foreground" />
              )}
            </div>
            <p className="w-full break-words text-base font-semibold leading-snug text-sidebar-foreground">
              {schoolTitle || "School"}
            </p>
          </div>
        )}
      </div>

      <nav className="sidebar-scroll flex-1 space-y-0.5 overflow-y-auto p-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isLinkActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-base font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="break-words leading-tight">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
