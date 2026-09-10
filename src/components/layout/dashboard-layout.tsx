"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, token } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !loading && !token) {
      router.push("/login");
    }
  }, [mounted, loading, token, router]);

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden w-52 lg:block">
          <Skeleton className="h-screen w-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-12 w-full" />
          <div className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col lg:ml-52">
        <TopNavbar mobileOpen={mobileOpen} onMenuToggle={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 p-4 pt-16 lg:p-6 lg:pt-16">{children}</main>
      </div>
    </div>
  );
}
