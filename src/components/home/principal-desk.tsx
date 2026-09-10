"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle2, Heart, Quote, Sparkles } from "lucide-react";

interface PrincipalDeskProps {
  schoolName: string;
  onOpenEnquiry: () => void;
}

export function PrincipalDesk({ schoolName, onOpenEnquiry }: PrincipalDeskProps) {
  return (
    <section id="principal" className="py-8 sm:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary/5 via-card to-background border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg relative overflow-hidden">
          {/* Subtle Background Icon */}
          <Quote className="absolute -top-6 -right-6 h-40 w-40 text-primary/5 pointer-events-none rotate-12" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-10 items-center relative">
            {/* Principal Photo & Details Card */}
            <div className="lg:col-span-4 flex flex-col items-center text-center space-y-2.5">
              <div className="relative">
                <div className="h-24 w-24 sm:h-40 sm:w-40 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg p-0.5 bg-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
                    alt="School Principal"
                    className="h-full w-full object-cover rounded-full"
                  />
                </div>
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1 rounded-full shadow-md">
                  <Award className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-base sm:text-xl font-bold font-heading text-slate-950 dark:text-white">
                  Dr. Radhika Sen Sharma
                </h3>
                <p className="text-xs font-bold text-primary">
                  Principal & Director of Academics
                </p>
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Ph.D. Educational Leadership • 26+ Yrs Experience
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 pt-0.5">
                <Badge variant="secondary" className="text-[10px] font-bold text-slate-900 dark:text-slate-100">
                  CBSE National Educator
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-bold text-slate-900 dark:text-slate-100">
                  Child Mentor
                </Badge>
              </div>
            </div>

            {/* Principal's Letter Content - Concise Main Points */}
            <div className="lg:col-span-8 space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <Badge variant="outline" className="text-primary border-primary/40 text-[10px] sm:text-xs font-bold bg-primary/5">
                  Principal&apos;s Message
                </Badge>
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold font-heading tracking-tight text-slate-950 dark:text-white leading-snug">
                  &ldquo;We don&apos;t just prepare children for exams; we prepare them for life.&rdquo;
                </h2>
              </div>

              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                At <strong className="font-bold text-slate-950 dark:text-white">{schoolName}</strong>, we nurture academic brilliance with moral grounding, individual mentorship, and future-ready technological skills.
              </p>

              {/* 3 Main Highlights - Concise Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                <div className="bg-background/80 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 rounded-xl space-y-0.5">
                  <div className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Academic Rigor
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    100% board distinctions with daily doubt sessions.
                  </p>
                </div>

                <div className="bg-background/80 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 rounded-xl space-y-0.5">
                  <div className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Future Ready
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Robotics, IoT & Python coding from early years.
                  </p>
                </div>

                <div className="bg-background/80 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 rounded-xl space-y-0.5">
                  <div className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Mentorship
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    15:1 ratio ensuring focused personal attention.
                  </p>
                </div>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <Button onClick={onOpenEnquiry} className="w-full sm:w-auto font-bold gap-2 shadow-md h-10 sm:h-11 rounded-xl text-xs sm:text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Request Interaction</span>
                </Button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 italic text-center sm:text-left">
                  — Warm regards & blessings
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
