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
type NavGroup = { title?: string; links: NavLink[] };

const superAdminGroups: NavGroup[] = [
  {
    links: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Setup",
    links: [
      { href: "/admin-users", label: "Admin Users", icon: Users },
      { href: "/classes", label: "Classes", icon: BookOpen },
      { href: "/sections", label: "Sections", icon: Layers },
      { href: "/sessions", label: "Sessions", icon: Calendar },
      { href: "/fee-structure", label: "Fee Structure", icon: IndianRupee },
      { href: "/transport-routes", label: "Transport", icon: Bus },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/students", label: "Students", icon: GraduationCap },
      { href: "/fee-collection", label: "Fee Collection", icon: Receipt },
      { href: "/expenses", label: "Expenses", icon: Wallet },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    links: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

const adminGroups: NavGroup[] = [
  {
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/students", label: "Students", icon: GraduationCap },
      { href: "/students/new", label: "Register", icon: UserPlus },
      { href: "/fee-collection", label: "Fee Collection", icon: Receipt },
      { href: "/expenses", label: "Expenses", icon: Wallet },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

function isLinkActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/students") {
    return pathname === "/students" || (pathname.startsWith("/students/") && !pathname.startsWith("/students/new"));
  }
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
  const groups = isSuperAdmin ? superAdminGroups : adminGroups;
  const schoolTitle = branding.schoolName.trim() || branding.appName.trim();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-52 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="shrink-0 border-b border-sidebar-border/80 px-3 py-3.5">
        {!loaded ? (
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-14 w-14 rounded-xl bg-sidebar-foreground/15" />
            <Skeleton className="h-3.5 w-full bg-sidebar-foreground/15" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sidebar-primary/90 shadow-sm ring-1 ring-white/15">
              {branding.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logo} alt="Logo" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <School className="h-7 w-7 text-sidebar-primary-foreground" />
              )}
            </div>
            <p className="w-full break-words text-[13px] font-semibold leading-snug tracking-tight text-sidebar-foreground">
              {schoolTitle || "School"}
            </p>
          </div>
        )}
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 py-2.5">
        {groups.map((group, gi) => (
          <div key={group.title || `g-${gi}`} className={cn(gi > 0 && "mt-3")}>
            {group.title ? (
              <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
                {group.title}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    {active ? (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-white/80" />
                    ) : null}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                      )}
                    />
                    <span className="break-words leading-tight">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
