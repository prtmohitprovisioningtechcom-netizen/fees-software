"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Compass,
  GraduationCap,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

interface HeroSectionProps {
  schoolName: string;
  onOpenEnquiry: () => void;
}

export function HeroSection({ schoolName, onOpenEnquiry }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-4 pb-8 lg:pt-8 lg:pb-12">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-25 dark:opacity-20">
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-primary blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-blue-400 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading, Value Prop & CTAs */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
            {/* Admissions Banner Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-primary shadow-sm">
              <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Admissions Open 2025–2026</span>
              <span className="text-muted-foreground hidden xs:inline">•</span>
              <span className="hidden xs:inline text-foreground/80">Playgroup to Class XII</span>
            </div>

            {/* Main Headline - Fluid Responsive Typography */}
            <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-foreground leading-tight sm:leading-[1.12]">
              Empowering Minds, Inspiring Character,{" "}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Shaping the Future
              </span>
            </h1>

            {/* Sub-headline: Concise Main Points */}
            <p className="text-xs sm:text-base lg:text-lg text-slate-800 dark:text-slate-200 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Welcome to <strong className="text-slate-950 dark:text-white font-bold">{schoolName}</strong> — A premier CBSE institution fostering academic excellence, modern STEM labs, and Olympic sports.
            </p>

            {/* Action Buttons - Streamlined & Mobile Optimized */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1">
              <Link href="/admissions" className="flex-1 xs:flex-initial">
                <Button
                  size="lg"
                  className="w-full font-bold px-5 py-4 sm:py-6 text-xs sm:text-base rounded-xl sm:rounded-2xl shadow-md shadow-primary/25 gap-2"
                >
                  <span>Apply for Admission</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                onClick={onOpenEnquiry}
                className="flex-1 xs:flex-initial font-bold text-slate-900 dark:text-slate-100 px-4 py-4 sm:py-6 text-xs sm:text-base rounded-xl sm:rounded-2xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5 shadow-sm"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Enquire for Seat</span>
              </Button>
            </div>

            {/* Quick Links Row: Gallery & Facilities */}
            <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs font-bold text-primary pt-0.5">
              <Link href="/gallery" className="hover:underline flex items-center gap-1">
                <span>View Photo Gallery</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Link href="/facilities" className="hover:underline flex items-center gap-1">
                <span>Campus Facilities</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Trust Markers / Highlights - Clean 2x2 on Mobile, Flex on Desktop */}
            <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-x-5 text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 sm:bg-transparent px-2.5 py-1.5 sm:p-0 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> CBSE Curriculum
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 sm:bg-transparent px-2.5 py-1.5 sm:p-0 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Smart Classes
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 sm:bg-transparent px-2.5 py-1.5 sm:p-0 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> GPS Bus Fleet
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 sm:bg-transparent px-2.5 py-1.5 sm:p-0 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> STEM & Robotics
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visual with Real Generated Campus Imagery */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/80 bg-card group">
              {/* Main Campus Image */}
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/campus-hero.jpg"
                  alt={`${schoolName} Campus`}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Overlay Badge Top */}
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/60 text-xs font-semibold flex items-center gap-1.5 shadow-md">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Ranked #1 Day-Boarding School</span>
                </div>

                {/* Overlay Badge Bottom */}
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base sm:text-lg drop-shadow-md">
                      State-of-the-Art Green Campus
                    </span>
                    <span className="text-xs bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                      15 Acres
                    </span>
                  </div>
                  <p className="text-xs text-white/80 line-clamp-1 drop-shadow">
                    Equipped with indoor sports arenas, robotics labs, and audio-visual auditoriums.
                  </p>
                </div>
              </div>

              {/* Floating Stat Card 1: Top Right */}
              <div className="absolute -top-4 -right-4 hidden sm:flex items-center gap-3 bg-background/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-xl">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-950 dark:text-white">100% Results</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">CBSE Distinctions</div>
                </div>
              </div>

              {/* Floating Stat Card 2: Bottom Left */}
              <div className="absolute -bottom-5 -left-5 hidden sm:flex items-center gap-3 bg-background/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-xl">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-950 dark:text-white">15:1 Ratio</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Personal Mentorship</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
