"use client";

import { useState } from "react";
import Link from "next/link";
import { useBranding } from "@/lib/branding-context";
import { getSchoolDisplayName } from "@/lib/school-branding";
import { SchoolNavbar } from "@/components/home/school-navbar";
import { SchoolFooter } from "@/components/home/school-footer";
import { FeePreviewCalculator } from "@/components/home/fee-preview-calculator";
import { AdmissionInquiryModal } from "@/components/home/admission-inquiry-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Coins,
  CreditCard,
  FileSpreadsheet,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default function FeesPage() {
  const { branding } = useBranding();
  const [modalOpen, setModalOpen] = useState(false);
  const schoolName = getSchoolDisplayName(branding) || "Apex International Academy";

  const feeTable = [
    {
      wing: "Pre-Primary (Nursery, LKG, UKG)",
      quarterly: "₹18,500",
      annual: "₹74,000",
      admissionOneTime: "₹12,000",
      includes: "Tuition, Activity kits, Splash pool, Caregiver supervision",
    },
    {
      wing: "Primary Wing (Class 1 to 5)",
      quarterly: "₹24,000",
      annual: "₹96,000",
      admissionOneTime: "₹15,000",
      includes: "Tuition, Smart class access, Sports, Library books",
    },
    {
      wing: "Middle School (Class 6 to 8)",
      quarterly: "₹28,500",
      annual: "₹1,14,000",
      admissionOneTime: "₹15,000",
      includes: "Tuition, Science practicals, Computer coding, Physical Ed",
    },
    {
      wing: "Secondary Wing (Class 9 & 10)",
      quarterly: "₹34,000",
      annual: "₹1,36,000",
      admissionOneTime: "₹18,000",
      includes: "Tuition, CBSE registration, Advanced labs, Remedial clinics",
    },
    {
      wing: "Senior Secondary (Class 11 & 12)",
      quarterly: "₹42,000",
      annual: "₹1,68,000",
      admissionOneTime: "₹20,000",
      includes: "Tuition, Specialized Stream labs (PCM/PCB/Comm), CUET/JEE counseling",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <SchoolNavbar branding={branding} />

      <main className="flex-1">
        {/* Page Hero */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
              Fee Policy 2025–26
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-foreground">
              Clear, Transparent &{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Affordable Investment
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We uphold complete fee transparency with zero hidden surcharges or mid-term escalation. Explore comprehensive schedules and use our interactive calculator below.
            </p>
          </div>
        </section>

        {/* Interactive Fee Estimator */}
        <FeePreviewCalculator onOpenEnquiry={() => setModalOpen(true)} />

        {/* Comprehensive Fee Structure Schedule Table */}
        <section className="py-16 sm:py-24 bg-card border-t border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
                Official Schedule
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
                Grade-Wise Fee Breakdown
              </h2>
              <p className="text-muted-foreground text-sm">
                Structured on a convenient quarterly schedule (4 installments per academic year).
              </p>
            </div>

            <div className="rounded-3xl border border-border overflow-hidden shadow-xl bg-background">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/80 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-4 sm:p-5 font-bold text-foreground">Academic Wing</th>
                      <th className="p-4 sm:p-5 font-bold text-foreground">Quarterly Fee</th>
                      <th className="p-4 sm:p-5 font-bold text-foreground">Annual Total</th>
                      <th className="p-4 sm:p-5 font-bold text-foreground">One-Time Admission</th>
                      <th className="p-4 sm:p-5 font-bold text-foreground">Inclusions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {feeTable.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-foreground">{row.wing}</td>
                        <td className="p-4 sm:p-5 font-bold text-primary">{row.quarterly}</td>
                        <td className="p-4 sm:p-5 font-semibold text-foreground">{row.annual}</td>
                        <td className="p-4 sm:p-5 text-muted-foreground">{row.admissionOneTime}</td>
                        <td className="p-4 sm:p-5 text-muted-foreground text-xs">{row.includes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 sm:p-6 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Due Dates: April 10, July 10, October 10, and January 10.</span>
                </div>
                <div>Late payment grace period: 10 calendar days with zero late fee penalty.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Scholarships and Concessions */}
        <section className="py-16 sm:py-20 bg-muted/20 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-card border border-border/80 rounded-3xl p-7 space-y-3 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground">
                  Merit Scholarships (Up to 50%)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Offered to high achievers scoring 95%+ in Class 10 Board exams or winning national STEM / Olympiad distinctions.
                </p>
              </div>

              <div className="bg-card border border-border/80 rounded-3xl p-7 space-y-3 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground">
                  Sibling Fee Concession
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A 20% tuition concession applies automatically to the second child when siblings study concurrently at our academy.
                </p>
              </div>

              <div className="bg-card border border-border/80 rounded-3xl p-7 space-y-3 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground">
                  Armed Forces & Corona Warriors
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Special 15% concession honoring personnel from Indian Defense forces, Central Armed Police, and healthcare professionals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Staff & Admin Fee Counter Callout */}
        <section className="py-16 bg-slate-950 text-white text-center">
          <div className="max-w-3xl mx-auto px-4 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-semibold">
              <Lock className="h-3.5 w-3.5" />
              <span>Administrative Staff & Accounts Desk</span>
            </div>
            <h3 className="text-3xl font-heading font-bold">
              School Accountant or Fee Manager?
            </h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Sign in to the school fee ERP to record student receipts, generate automated PDF vouchers, track class dues, and reconcile transactions.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-8 shadow-xl gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Open Admin & Fee Collection Portal</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SchoolFooter branding={branding} onOpenEnquiry={() => setModalOpen(true)} />

      <AdmissionInquiryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        schoolName={schoolName}
        phone={branding.phone}
        email={branding.email}
      />
    </div>
  );
}
