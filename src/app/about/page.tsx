"use client";

import { useState } from "react";
import Link from "next/link";
import { useBranding } from "@/lib/branding-context";
import { getSchoolDisplayName } from "@/lib/school-branding";
import { SchoolNavbar } from "@/components/home/school-navbar";
import { SchoolFooter } from "@/components/home/school-footer";
import { AdmissionInquiryModal } from "@/components/home/admission-inquiry-modal";
import { PrincipalDesk } from "@/components/home/principal-desk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  Globe,
  GraduationCap,
  Heart,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

export default function AboutPage() {
  const { branding } = useBranding();
  const [modalOpen, setModalOpen] = useState(false);
  const schoolName = getSchoolDisplayName(branding) || "Apex International Academy";

  const milestones = [
    {
      year: "1999",
      title: "Foundational Inception",
      desc: "Established with 120 students and a vision to blend Indian values with contemporary global pedagogy.",
    },
    {
      year: "2006",
      title: "CBSE Senior Secondary Affiliation",
      desc: "Accredited by the Central Board of Secondary Education for Science, Commerce, and Humanities streams.",
    },
    {
      year: "2014",
      title: "15-Acre Eco-Campus Expansion",
      desc: "Inaugurated state-of-the-art sports complex, Olympic athletic track, and Olympic-grade swimming pool.",
    },
    {
      year: "2020",
      title: "AI & STEM Robotics Innovation Center",
      desc: "Partnered with national technology institutes to introduce 3D printing, coding, and robotics from Grade 3.",
    },
    {
      year: "2025",
      title: "Ranked #1 Day-Boarding School",
      desc: "Awarded Top Academic Excellence and Green Campus of the Year by National Education Council.",
    },
  ];

  const values = [
    {
      icon: ShieldCheck,
      title: "Integrity & Ethics",
      desc: "Instilling deep moral grounding, honesty, and empathy in thought and action.",
    },
    {
      icon: Lightbulb,
      title: "Curiosity & Innovation",
      desc: "Fostering fearless questioning, creative problem-solving, and hands-on discovery.",
    },
    {
      icon: Target,
      title: "Academic Rigor",
      desc: "Pursuing the highest benchmarks in scholarship, board results, and intellectual mastery.",
    },
    {
      icon: Heart,
      title: "Compassion & Inclusion",
      desc: "Welcoming diversity, championing mental well-being, and community service.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <SchoolNavbar branding={branding} />

      <main className="flex-1">
        {/* Page Hero Banner */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
              Our Heritage & Vision
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-foreground">
              A Legacy of Inspiring Minds &{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Shaping Leaders
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Founded on the pillars of academic excellence, ethical grounding, and forward-looking technological preparedness, <strong>{schoolName}</strong> nurtures tomorrow&apos;s thinkers, creators, and compassionate citizens.
            </p>
          </div>
        </section>

        {/* Vision & Mission Grid */}
        <section className="py-16 sm:py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              <div className="rounded-3xl border border-border/80 bg-muted/30 p-8 sm:p-10 space-y-4 shadow-sm hover:border-primary/40 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground">Our Vision</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  To be an internationally recognized benchmark in experiential education, where curiosity meets character, enabling every student to thrive intellectually, socially, and emotionally in a dynamic world.
                </p>
                <div className="space-y-2 pt-2 text-xs font-medium text-foreground/90">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Cultivating independent, ethical thought leaders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>100% digital & experiential learning methodology</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/80 bg-muted/30 p-8 sm:p-10 space-y-4 shadow-sm hover:border-primary/40 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground">Our Mission</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  To deliver a balanced curriculum that honors academic rigor while fostering athletic vigor, artistic sensitivity, and ethical social responsibility in a safe, technologically advanced green campus.
                </p>
                <div className="space-y-2 pt-2 text-xs font-medium text-foreground/90">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Personalized 15:1 mentorship for every learner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Holistic sports, arts, and robotics co-curriculum</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Milestone Timeline */}
        <section className="py-16 sm:py-24 bg-muted/20 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
                Our Journey
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
                25+ Years of Educational Milestones
              </h2>
              <p className="text-muted-foreground text-sm">
                From humble beginnings to one of the most respected day-boarding schools in the nation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 relative hover:border-primary/50 transition-all hover:shadow-md"
                >
                  <div className="text-2xl font-heading font-black text-primary">{m.year}</div>
                  <div className="font-bold text-sm text-foreground">{m.title}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Values Grid */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
                Guiding Principles
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
                The Values That Define Us
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v, idx) => {
                const Icon = v.icon;
                return (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-2xl p-6 space-y-3 hover:shadow-lg transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-heading font-bold text-base text-foreground">{v.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Principal Desk Section */}
        <PrincipalDesk schoolName={schoolName} onOpenEnquiry={() => setModalOpen(true)} />

        {/* Bottom CTA Banner */}
        <section className="py-16 bg-slate-950 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            <h3 className="text-3xl sm:text-4xl font-heading font-bold">
              Ready to Experience Our Inspiring Community?
            </h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Schedule a personalized campus walk-through or speak directly with our admissions counselor today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setModalOpen(true)}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-8 shadow-lg"
              >
                Apply for Admission
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 font-semibold rounded-xl px-8"
                >
                  Visit Campus
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
