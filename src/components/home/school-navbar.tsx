"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Lock,
  Moon,
  Sun,
  Menu,
  X,
  LayoutDashboard,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cleanSchoolName } from "@/lib/school-branding";
import type { SchoolBranding } from "@/types";

interface SchoolNavbarProps {
  branding: SchoolBranding;
  onOpenEnquiry?: () => void;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/academics", label: "Academics" },
  { href: "/admissions", label: "Admissions" },
  { href: "/facilities", label: "Facilities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function SchoolNavbar({ branding }: SchoolNavbarProps) {
  const pathname = usePathname();
  const { resolved, toggle } = useTheme();
  const { user, token } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const rawName = (mounted && (branding.schoolName || branding.appName)) || "Apex International Academy";
  const schoolName = cleanSchoolName(rawName);
  const isLoggedIn = mounted && Boolean(token && user);
  const showLogo = mounted && Boolean(branding.logo);
  const phone = (mounted && branding.phone) || "+91 98765 43210";
  const email = (mounted && branding.email) || "admissions@school.edu.in";

  return (
    <div className="w-full">
      {/* Top Pre-Header Strip (Editorial School Style) */}
      <div className="hidden md:block bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              CBSE Affiliated Senior Secondary (Code: 60432)
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-slate-400">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Mon – Sat: 8:00 AM – 3:30 PM
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="h-3 w-3 text-primary" />
              <span>{phone}</span>
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="h-3 w-3 text-primary" />
              <span>{email}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-xl shadow-lg border-b border-border/80 py-2.5"
            : "bg-background/85 backdrop-blur-md border-b border-border/50 py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and School Title */}
            <Link href="/" className="flex items-center gap-3.5 group shrink-0">
              {showLogo ? (
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl overflow-hidden shadow-sm border border-border bg-white flex items-center justify-center p-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={branding.logo} alt={schoolName} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-900 to-primary text-white flex items-center justify-center shadow-md shadow-primary/20 transition-all duration-300 group-hover:scale-105">
                  <GraduationCap className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-base sm:text-lg tracking-tight text-slate-950 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                  {schoolName}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Excellence in Education • Est. 1999
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-sm font-medium">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 relative ${
                      isActive
                        ? "text-primary bg-primary/10 shadow-sm"
                        : "text-slate-800 dark:text-slate-100 hover:text-primary hover:bg-slate-100/90 dark:hover:bg-slate-800/90"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions: Theme Toggle & Prominent Admin Login Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                onClick={toggle}
                title={resolved === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
              >
                {resolved === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* DEDICATED ADMIN / STAFF LOGIN CTA */}
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-4 h-9 gap-1.5 shadow-sm shadow-primary/25 transition-transform hover:scale-102"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Admin Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-slate-950 hover:bg-slate-900 text-white dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground font-semibold text-xs rounded-xl px-4 h-9 gap-1.5 shadow-sm border border-white/10 transition-all duration-200 hover:shadow-md hover:scale-102"
                    title="Staff & Administrative ERP Login"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Admin Login</span>
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Trigger */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 rounded-xl border border-border/60"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-border bg-background/98 backdrop-blur-2xl px-5 pt-3 pb-6 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex flex-col space-y-1 text-sm font-medium">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-900 dark:text-slate-100 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border/80 flex flex-col gap-2.5">
              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center gap-2 bg-primary rounded-xl text-xs py-5">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Go to Admin Dashboard ({user?.name || "Staff"})</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center gap-2 bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground rounded-xl text-xs py-5 shadow-md">
                    <Lock className="h-4 w-4 text-amber-400" />
                    <span>Admin & Staff Portal Login</span>
                  </Button>
                </Link>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
                <span>📞 {phone}</span>
                <span>✉️ {email}</span>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
