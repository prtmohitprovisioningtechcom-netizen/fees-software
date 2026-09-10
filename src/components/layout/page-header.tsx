"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/layout/back-button";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  /** Show one-step Back. Default true except on /dashboard. Pass false to hide. */
  showBack?: boolean;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  showBack,
}: PageHeaderProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const shouldShowBack = showBack ?? !isDashboard;

  return (
    <div className="mb-8 animate-fade-in">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 min-w-0">
          {shouldShowBack && <BackButton className="mt-1.5" />}
          <div className="min-w-0">
            <h1 className={cn("text-2xl font-bold tracking-tight")}>{title}</h1>
            {description && <p className="mt-1 text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
