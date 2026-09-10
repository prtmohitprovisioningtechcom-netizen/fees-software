"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Baby,
  BookOpen,
  BrainCircuit,
  Bus,
  CheckCircle2,
  Cpu,
  GraduationCap,
  HeartHandshake,
  Laptop,
  Microscope,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

interface FeaturesAndAcademicsProps {
  onOpenEnquiry: (grade?: string) => void;
}

export function FeaturesAndAcademics({ onOpenEnquiry }: FeaturesAndAcademicsProps) {
  const [activeTab, setActiveTab] = useState<"pre-primary" | "primary" | "middle" | "senior">("senior");

  const academicPrograms = {
    "pre-primary": {
      title: "Foundational & Pre-Primary",
      subtitle: "Nursery, LKG & UKG (Ages 3 to 5)",
      description:
        "Play-based sensory discovery, phonetics, and early numeracy in a joyful, secure environment.",
      highlights: [
        "Play-way learning & story circles",
        "Bilingual phonetics & numbers",
        "Soft play arena & discovery zone",
        "Dedicated caring staff (10:1 ratio)",
      ],
      ratio: "10:1 Ratio",
      schedule: "8:30 AM – 12:30 PM",
    },
    primary: {
      title: "Primary Wing",
      subtitle: "Classes 1 to 5 (Ages 6 to 10)",
      description:
        "Core foundation in mathematics, science, reading, creative arts, and basic digital logic.",
      highlights: [
        "STEM experiments & mental math",
        "Digital literacy & coding basics",
        "Athletics & physical fitness",
        "Remedial reading & public speaking",
      ],
      ratio: "15:1 Ratio",
      schedule: "8:00 AM – 2:00 PM",
    },
    middle: {
      title: "Middle School Wing",
      subtitle: "Classes 6 to 8 (Ages 11 to 13)",
      description:
        "Cultivating analytical thinking, practical lab research, languages, and robotics.",
      highlights: [
        "Hands-on Physics, Chem & Bio labs",
        "Robotics, IoT & Python coding",
        "Debates, MUN & sports leagues",
        "Analytical mathematics & logic",
      ],
      ratio: "18:1 Ratio",
      schedule: "8:00 AM – 2:30 PM",
    },
    senior: {
      title: "Senior Secondary Wing",
      subtitle: "Classes 9 to 12 (CBSE Board)",
      description:
        "Board excellence with integrated coaching for JEE, NEET, CUET & national entrance exams.",
      highlights: [
        "Science (PCM & PCB) practical labs",
        "Commerce (Accounts, Business, Eco)",
        "Humanities (Psychology & Pol Sci)",
        "Career counseling & test prep",
      ],
      ratio: "20:1 Ratio",
      schedule: "7:45 AM – 2:45 PM",
    },
  };

  const currentWing = academicPrograms[activeTab];

  return (
    <section id="academics" className="py-8 sm:py-12 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-bold text-xs uppercase tracking-wider">
            Academic Wings
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
            Comprehensive CBSE Curriculum
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-base font-medium max-w-2xl mx-auto">
            From foundational early learning to senior secondary board excellence and competitive entrance prep.
          </p>
        </div>

        {/* Responsive Wing Tabs (2x2 Grid on Mobile, 4-col on Tablet/Desktop) */}
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-background border border-border/80 rounded-2xl max-w-2xl mx-auto shadow-sm">
            <button
              onClick={() => setActiveTab("pre-primary")}
              className={`py-2 sm:py-2.5 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeTab === "pre-primary"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Pre-Primary
            </button>
            <button
              onClick={() => setActiveTab("primary")}
              className={`py-2 sm:py-2.5 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeTab === "primary"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Primary (1–5)
            </button>
            <button
              onClick={() => setActiveTab("middle")}
              className={`py-2 sm:py-2.5 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeTab === "middle"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Middle (6–8)
            </button>
            <button
              onClick={() => setActiveTab("senior")}
              className={`py-2 sm:py-2.5 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeTab === "senior"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Senior (9–12)
            </button>
          </div>

          {/* Active Wing Content Card */}
          <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-md relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-8 space-y-4 sm:space-y-5">
                <div>
                  <div className="inline-block text-[11px] sm:text-xs font-bold text-primary tracking-wide uppercase">
                    {currentWing.subtitle}
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-slate-950 dark:text-white mt-0.5">
                    {currentWing.title}
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed font-medium">
                    {currentWing.description}
                  </p>
                </div>

                {/* Highlights List - 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 pt-1">
                  {currentWing.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-muted/50 p-2.5 rounded-xl"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="leading-tight">{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Button
                    onClick={() => {
                      const gradeMap: Record<string, string> = {
                        "pre-primary": "Pre-Nursery / Playgroup",
                        "primary": "Class 1 (Grade 1)",
                        "middle": "Class 6 (Grade 6)",
                        "senior": "Class 11 (Science - PCM)",
                      };
                      onOpenEnquiry(gradeMap[activeTab]);
                    }}
                    className="font-bold gap-2 shadow-md h-11 rounded-xl"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Enquire for {currentWing.title.split(" ")[0]}</span>
                  </Button>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium text-center sm:text-left">
                    Timings: <strong className="text-slate-950 dark:text-white">{currentWing.schedule}</strong>
                  </span>
                </div>
              </div>

              {/* Stats and Quick Highlights Card */}
              <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold">Class Ratio</div>
                    <div className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">{currentWing.ratio}</div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between py-1 bg-white dark:bg-slate-800/60 px-3 rounded-lg">
                    <span>Curriculum:</span>
                    <strong className="text-slate-950 dark:text-white">CBSE Board</strong>
                  </div>
                  <div className="flex justify-between py-1 bg-white dark:bg-slate-800/60 px-3 rounded-lg">
                    <span>Medium:</span>
                    <strong className="text-slate-950 dark:text-white">English Core</strong>
                  </div>
                  <div className="flex justify-between py-1 bg-white dark:bg-slate-800/60 px-3 rounded-lg">
                    <span>Smart Labs:</span>
                    <strong className="text-slate-950 dark:text-white">100% AV Interactive</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Core Pillars - Clean, Concise, Mobile-Friendly */}
        <div id="about" className="space-y-4 pt-2">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h3 className="text-xl sm:text-3xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
              Why Parents Choose Our Academy
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">
              Core highlights that set our students apart.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Pillar 1 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-1.5 hover:border-primary/50 transition-all shadow-sm">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h4 className="text-sm sm:text-base font-heading font-bold text-slate-950 dark:text-white">STEM & AI Labs</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium">
                Hands-on robotics, 3D printing, and Python coding.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-1.5 hover:border-primary/50 transition-all shadow-sm">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h4 className="text-sm sm:text-base font-heading font-bold text-slate-950 dark:text-white">Olympic Sports Arena</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium">
                400m synthetic running track & certified sports coaches.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-1.5 hover:border-primary/50 transition-all shadow-sm">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Bus className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h4 className="text-sm sm:text-base font-heading font-bold text-slate-950 dark:text-white">GPS School Fleet</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium">
                AC buses with CCTV, female attendants & live tracking.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-1.5 hover:border-primary/50 transition-all shadow-sm">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Laptop className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h4 className="text-sm sm:text-base font-heading font-bold text-slate-950 dark:text-white">Smart Classrooms</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium">
                4K interactive displays and 3D visual learning modules.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-1.5 hover:border-primary/50 transition-all shadow-sm">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Microscope className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h4 className="text-sm sm:text-base font-heading font-bold text-slate-950 dark:text-white">Advanced Science Labs</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium">
                Dedicated Physics, Chemistry, and Biology research labs.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-1.5 hover:border-primary/50 transition-all shadow-sm">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h4 className="text-sm sm:text-base font-heading font-bold text-slate-950 dark:text-white">Holistic Mentorship</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium">
                15:1 ratio, career counseling, and leadership clubs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
