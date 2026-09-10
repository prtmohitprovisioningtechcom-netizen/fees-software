"use client";

import { useState } from "react";
import Link from "next/link";
import { useBranding } from "@/lib/branding-context";
import { getSchoolDisplayName } from "@/lib/school-branding";
import { SchoolNavbar } from "@/components/home/school-navbar";
import { SchoolFooter } from "@/components/home/school-footer";
import { FeaturesAndAcademics } from "@/components/home/features-and-academics";
import { AdmissionInquiryModal } from "@/components/home/admission-inquiry-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  Laptop,
  Microscope,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

export default function AcademicsPage() {
  const { branding } = useBranding();
  const [modalOpen, setModalOpen] = useState(false);
  const schoolName = getSchoolDisplayName(branding) || "Apex International Academy";

  const streams = [
    {
      title: "Science Stream (Medical & Non-Medical)",
      badge: "PCM / PCB / PCMB",
      subjects: "Physics, Chemistry, Mathematics, Biology, Computer Science (Python), Physical Education",
      focus:
        "Rigorous conceptual coaching for CBSE Board exams integrated with competitive engineering (JEE Main/Adv) and medical (NEET) problem-solving techniques.",
    },
    {
      title: "Commerce Stream",
      badge: "Professional Track",
      subjects: "Accountancy, Business Studies, Economics, Applied Mathematics / Informatics Practices, English",
      focus:
        "Cultivates financial acumen, business case studies, stock market literacy, and preparation for CA Foundation, CUET, and IPMAT.",
    },
    {
      title: "Humanities & Liberal Arts",
      badge: "Social Sciences",
      subjects: "Psychology, Political Science, Economics, History, Sociology, English Core",
      focus:
        "Fosters critical analysis, socio-political discourse, research writing, and grooming for Law (CLAT), Civil Services (UPSC), and international liberal arts universities.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <SchoolNavbar branding={branding} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
              Academic Excellence
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-foreground">
              Curriculum Built for{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Mastery & Innovation
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              At <strong>{schoolName}</strong>, our academic blueprint aligns with the National Education Policy (NEP 2020) and CBSE guidelines, cultivating critical inquiry, creative exploration, and deep conceptual foundation.
            </p>
          </div>
        </section>

        {/* Dynamic Academic Wings Section */}
        <FeaturesAndAcademics onOpenEnquiry={() => setModalOpen(true)} />

        {/* Senior Secondary Streams Showcase */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
                Grades 11 & 12
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
                Senior Secondary Career Streams
              </h2>
              <p className="text-muted-foreground text-sm">
                Tailored subject combinations with dedicated university entrance guidance and laboratory research.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {streams.map((stream, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border/80 rounded-3xl p-7 space-y-4 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {stream.badge}
                    </Badge>
                    <h3 className="font-heading font-bold text-xl text-foreground">{stream.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{stream.focus}</p>
                  </div>

                  <div className="pt-4 border-t border-border/60 space-y-2">
                    <div className="text-[11px] font-semibold text-primary uppercase">Core Combinations:</div>
                    <div className="text-xs font-medium text-foreground/90">{stream.subjects}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Assessment & Continuous Evaluation Framework */}
        <section className="py-16 sm:py-20 bg-muted/20 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <Badge variant="outline" className="text-primary border-primary/30 text-xs font-semibold">
                  Progress Monitoring
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
                  Holistic Assessment & Parent Feedback
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We reject high-stress rote memorization in favor of Continuous and Comprehensive Evaluation (CCE). Our evaluation includes practical projects, viva-voce, analytical problem assignments, and unit milestone assessments.
                </p>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-start gap-3 bg-card p-3.5 rounded-xl border border-border/80">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Regular Parent-Teacher Interaction (PTM):</strong>
                      <span className="text-muted-foreground"> Bi-monthly structured one-on-one reviews with subject teachers.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-card p-3.5 rounded-xl border border-border/80">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Digital Performance Dashboards:</strong>
                      <span className="text-muted-foreground"> Real-time access to attendance, test grades, and assignment feedback.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-card p-3.5 rounded-xl border border-border/80">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Personalized Remedial Clinics:</strong>
                      <span className="text-muted-foreground"> Complimentary zero-period doubt sessions for learners requiring extra reinforcement.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-card border border-border rounded-3xl p-8 space-y-6 shadow-xl">
                <div className="flex items-center gap-3 pb-4 border-b border-border/70">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg text-foreground">Academic Accolades & Results</h4>
                    <p className="text-xs text-muted-foreground">CBSE Class X & XII Board Outcomes</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60">
                    <div className="text-3xl font-heading font-extrabold text-primary">100%</div>
                    <div className="text-xs font-semibold text-foreground mt-1">Pass Percentage</div>
                    <div className="text-[10px] text-muted-foreground">Consecutive 12 Years</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60">
                    <div className="text-3xl font-heading font-extrabold text-emerald-600">98.4%</div>
                    <div className="text-xs font-semibold text-foreground mt-1">School Topper (PCM)</div>
                    <div className="text-[10px] text-muted-foreground">Session 2024-25</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60">
                    <div className="text-3xl font-heading font-extrabold text-blue-600">42+</div>
                    <div className="text-xs font-semibold text-foreground mt-1">Scored Above 95%</div>
                    <div className="text-[10px] text-muted-foreground">Board Distinctions</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60">
                    <div className="text-3xl font-heading font-extrabold text-amber-600">18+</div>
                    <div className="text-xs font-semibold text-foreground mt-1">IIT & NEET Qualifiers</div>
                    <div className="text-[10px] text-muted-foreground">From Batch 2024</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-16 bg-slate-950 text-white text-center">
          <div className="max-w-3xl mx-auto px-4 space-y-6">
            <h3 className="text-3xl font-heading font-bold">Invest in Your Child&apos;s Academic Future</h3>
            <p className="text-slate-400 text-sm">
              Admissions for Session 2025–26 are open across Pre-Primary, Primary, Middle, and Senior Secondary classes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setModalOpen(true)}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-8 shadow-lg"
              >
                Apply for Admission
              </Button>
              <Link href="/fees">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 font-semibold rounded-xl px-8"
                >
                  View Fee Structure
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
