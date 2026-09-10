"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanSchoolName } from "@/lib/school-branding";
import type { SchoolBranding } from "@/types";

interface SchoolFooterProps {
  branding: SchoolBranding;
  onOpenEnquiry: () => void;
}

export function SchoolFooter({ branding, onOpenEnquiry }: SchoolFooterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rawName = (mounted && (branding.schoolName || branding.appName)) || "Apex International Academy";
  const schoolName = cleanSchoolName(rawName);
  const address = (mounted && branding.address) || "Institutional Area, Knowledge Park III, Sector 62";
  const phone = (mounted && branding.phone) || "+91 98765 43210 / 011-2894567";
  const email = (mounted && branding.email) || "admissions@school.edu.in";
  const showLogo = mounted && Boolean(branding.logo);

  return (
    <footer id="contact" className="bg-slate-950 text-slate-300 pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Grid: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: School Brand & Overview (Col 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              {showLogo ? (
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-white p-1 shadow-md shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={branding.logo} alt={schoolName} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <GraduationCap className="h-7 w-7" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {schoolName}
                </h3>
                <p className="text-xs text-slate-400">CBSE Affiliated Senior Secondary Institution</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md font-medium">
              CBSE affiliated institution committed to academic distinction, STEM innovation, and holistic student mentorship.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full">
                CBSE Affiliation No: <strong>2130987</strong>
              </span>
              <span className="text-[11px] bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full">
                School Code: <strong>60432</strong>
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links (Col 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide uppercase">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-300 font-medium">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-primary" /> About Campus
                </Link>
              </li>
              <li>
                <Link href="/academics" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-primary" /> Academic Wings
                </Link>
              </li>
              <li>
                <Link href="/facilities" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-primary" /> Campus Facilities
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-primary" /> Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/admissions" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-primary" /> Online Admissions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-primary" /> Contact & Location
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Visiting Hours (Col 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide uppercase">Contact & Campus</h4>
            <div className="space-y-2.5 text-xs text-slate-300 font-medium">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-white transition-colors">
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                  {email}
                </a>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold">Visiting Hours:</div>
                  <div className="text-slate-300">Monday – Saturday: 8:00 AM – 3:30 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Dedicated Admin & Staff Portal Card (Col 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide uppercase">Staff Portal</h4>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Authorized staff, teachers, accountants, and administrators can sign in to manage fees, admissions, and records.
              </p>
              <Link href="/login" className="block w-full">
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg gap-1.5 shadow-md shadow-primary/20"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-300" />
                  <span>Admin Login</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Strip: Copyright & Disclaimer */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div suppressHydrationWarning>
            © {new Date().getFullYear()} {schoolName}. All Rights Reserved. Designed for Educational Excellence.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <Lock className="h-3 w-3 text-amber-500" />
              <span>Admin & Faculty ERP</span>
            </Link>
            <span>•</span>
            <button onClick={onOpenEnquiry} className="text-slate-400 hover:text-white transition-colors">
              Admissions Desk
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
