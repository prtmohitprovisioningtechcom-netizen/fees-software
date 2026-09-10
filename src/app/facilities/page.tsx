"use client";

import { useState } from "react";
import Link from "next/link";
import { useBranding } from "@/lib/branding-context";
import { getSchoolDisplayName } from "@/lib/school-branding";
import { SchoolNavbar } from "@/components/home/school-navbar";
import { SchoolFooter } from "@/components/home/school-footer";
import { CampusLifeAndFacilities } from "@/components/home/campus-life-and-facilities";
import { AdmissionInquiryModal } from "@/components/home/admission-inquiry-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Award,
  BookOpen,
  Building2,
  Bus,
  CheckCircle2,
  ChevronRight,
  Cpu,
  HeartPulse,
  Music,
  ShieldCheck,
  Sparkles,
  Trophy,
  Utensils,
} from "lucide-react";

export default function FacilitiesPage() {
  const { branding } = useBranding();
  const [modalOpen, setModalOpen] = useState(false);
  const schoolName = getSchoolDisplayName(branding) || "Apex International Academy";

  const additionalFacilities = [
    {
      icon: Cpu,
      title: "Science & Innovation Labs",
      desc: "Dedicated Physics, Chemistry, Biology, and Math laboratories designed per CBSE and international safety norms, complete with modern glassware, digital microscopes, and fume hoods.",
    },
    {
      icon: Bus,
      title: "GPS-Monitored AC Fleet",
      desc: "A fleet of air-conditioned buses equipped with speed limiters, CCTV cameras, female attendants, and live parent mobile tracking across 30+ designated city routes.",
    },
    {
      icon: HeartPulse,
      title: "Infirmary & Medical Care",
      desc: "Full-time certified nursing officer, pediatric first-aid station, emergency oxygen concentrators, and direct tie-ups with leading multi-specialty hospitals.",
    },
    {
      icon: Utensils,
      title: "Hygienic Dining & Cafeteria",
      desc: "Nutritionist-approved balanced vegetarian meals and refreshments prepared under strict FSSAI food-grade hygiene protocols in our stainless-steel kitchen.",
    },
    {
      icon: Music,
      title: "Performing Arts & Music Studio",
      desc: "Acoustically treated auditoriums, soundproof dance and drama suites, classical & western instrumental stations (piano, violin, drums, synthesizer, guitar).",
    },
    {
      icon: ShieldCheck,
      title: "24x7 Multi-Tier Campus Security",
      desc: "Complete perimeter surveillance with 150+ high-definition CCTV cameras, RFID biometric access points, and professional ex-servicemen security personnel.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <SchoolNavbar branding={branding} />

      <main className="flex-1">
        {/* Page Hero */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-background to-background border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 font-bold text-xs bg-primary/5">
              World-Class Infrastructure
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
              Spaces Designed to Spark{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Curiosity & Excellence
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 max-w-3xl mx-auto leading-relaxed font-medium">
              Spread across a lush, eco-friendly 15-acre green estate, <strong className="font-bold text-slate-950 dark:text-white">{schoolName}</strong> provides the premier technological, athletic, and scholarly environment for your child.
            </p>
          </div>
        </section>

        {/* Featured Facilities Interactive Showcase */}
        <CampusLifeAndFacilities onOpenEnquiry={() => setModalOpen(true)} />

        {/* Comprehensive Facility Highlights Grid */}
        <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 font-bold text-xs bg-primary/5">
                Holistic Amenities
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
                Safety, Wellness & Creative Amenities
              </h2>
              <p className="text-slate-800 dark:text-slate-200 text-sm font-medium">
                Every detail is carefully engineered to nurture the physical, intellectual, and emotional growth of every learner.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {additionalFacilities.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-card border border-slate-200 dark:border-slate-800 rounded-3xl p-7 space-y-3 hover:border-primary/50 transition-all shadow-sm hover:shadow-lg"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-slate-950 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Schedule Tour Banner */}
        <section className="py-16 bg-slate-950 text-white text-center">
          <div className="max-w-3xl mx-auto px-4 space-y-6">
            <h3 className="text-3xl font-heading font-bold">Experience Our Campus Firsthand</h3>
            <p className="text-slate-300 text-sm font-medium">
              We warmly invite parents and prospective students to tour our laboratories, sports arena, and library with a guided admissions counselor.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setModalOpen(true)}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-8 shadow-lg"
              >
                Book Guided Campus Tour
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 font-semibold rounded-xl px-8"
                >
                  Contact Admissions Desk
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
