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
  onOpenEnquiry: () => void;
}

export function FeaturesAndAcademics({ onOpenEnquiry }: FeaturesAndAcademicsProps) {
  const [activeTab, setActiveTab] = useState<"pre-primary" | "primary" | "middle" | "senior">("senior");

  const academicPrograms = {
    "pre-primary": {
      title: "Foundational & Pre-Primary Wing",
      subtitle: "Nursery, Lower KG & Upper KG (Ages 3 to 5)",
      description:
        "Our early childhood program combines the Montessori play-way philosophy with modern sensory learning. Children develop foundational communication skills, emotional resilience, curiosity, and motor dexterity in a secure, nurturing environment.",
      highlights: [
        "Play-based sensory discovery and interactive story circles",
        "Phonetics, early numeracy, and bilingual vocabulary foundation",
        "Splash pool, indoor soft play zone, and discovery gardens",
        "Dedicated child psychologists and nutrition-guided meals",
      ],
      ratio: "10:1 Child to Caregiver Ratio",
      schedule: "8:30 AM – 12:30 PM",
    },
    primary: {
      title: "Primary School Wing",
      subtitle: "Grades 1 to 5 (Ages 6 to 10)",
      description:
        "Focused on nurturing inquiry, creative expression, and strong cognitive fundamentals. Children engage with real-world applications in mathematics, environmental sciences, languages, and performing arts.",
      highlights: [
        "Inquiry-led STEM experiments and creative writing workshops",
        "Digital literacy: basic computer science and logic puzzles",
        "Physical education, gymnastics, and swimming instruction",
        "Remedial reading programs and dedicated talent discovery",
      ],
      ratio: "15:1 Student to Teacher Ratio",
      schedule: "8:00 AM – 2:00 PM",
    },
    middle: {
      title: "Middle School Wing",
      subtitle: "Grades 6 to 8 (Ages 11 to 13)",
      description:
        "Transitioning scholars into independent thinkers. Middle school emphasizes analytical rigor, structured science laboratories, robotics, foreign languages, and inter-house debates.",
      highlights: [
        "Hands-on Physics, Chemistry, and Biology laboratories",
        "Robotics, Python coding, and AI curriculum integration",
        "Foreign language options (French, German, Sanskrit)",
        "Leadership council, MUN simulations, and inter-school athletics",
      ],
      ratio: "18:1 Student to Teacher Ratio",
      schedule: "8:00 AM – 2:30 PM",
    },
    senior: {
      title: "Secondary & Senior Secondary Wing",
      subtitle: "Grades 9 to 12 (CBSE Affiliated)",
      description:
        "Rigorous academic training tailored to national board examinations and competitive entrances. We offer specialized streams with comprehensive university career guidance.",
      highlights: [
        "Science (PCM & PCB) with JEE / NEET preparation support",
        "Commerce (Accountancy, Business Studies, Economics, Applied Math)",
        "Humanities (Psychology, Political Science, Economics, History)",
        "Career counseling, university application desk, and profile building",
      ],
      ratio: "20:1 Mentorship Guidance",
      schedule: "7:45 AM – 2:45 PM",
    },
  };

  const currentWing = academicPrograms[activeTab];

  return (
    <section id="academics" className="py-16 sm:py-20 bg-muted/30 border-y border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
            Academic Excellence
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Holistic Education From Early Years to Senior Secondary
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            A comprehensive CBSE curriculum designed to foster academic mastery, ethical leadership, scientific curiosity, and lifelong love for learning.
          </p>
        </div>

        {/* Interactive Wing Tabs */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-background border border-border/80 rounded-2xl max-w-2xl mx-auto shadow-sm">
            <button
              onClick={() => setActiveTab("pre-primary")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "pre-primary"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Pre-Primary
            </button>
            <button
              onClick={() => setActiveTab("primary")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "primary"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Primary (1–5)
            </button>
            <button
              onClick={() => setActiveTab("middle")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "middle"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Middle (6–8)
            </button>
            <button
              onClick={() => setActiveTab("senior")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "senior"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Senior (9–12)
            </button>
          </div>

          {/* Active Wing Content Card */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <div className="inline-block text-xs font-bold text-primary tracking-wide uppercase">
                    {currentWing.subtitle}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                    {currentWing.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
                    {currentWing.description}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentWing.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-foreground/90 bg-muted/40 p-3 rounded-xl border border-border/50"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button onClick={onOpenEnquiry} className="font-semibold gap-2 shadow-md">
                    <Sparkles className="h-4 w-4" />
                    Enquire for {currentWing.title.split(" ")[0]}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Timings: <strong>{currentWing.schedule}</strong>
                  </span>
                </div>
              </div>

              {/* Stats and Ratio Side Badge */}
              <div className="lg:col-span-4 bg-muted/60 border border-border/80 rounded-2xl p-6 space-y-5 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold">Teacher-Student Ratio</div>
                    <div className="text-base font-bold text-foreground">{currentWing.ratio}</div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <div className="flex justify-between py-1">
                    <span>Curriculum Board:</span>
                    <strong className="text-foreground">CBSE (Central Board)</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Medium of Instruction:</span>
                    <strong className="text-foreground">English Core</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Co-Curriculars:</span>
                    <strong className="text-foreground">Compulsory Weekly</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Smart Learning:</span>
                    <strong className="text-foreground">100% Interactive AV</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Key Pillars / Why Parents Choose Us */}
        <div id="about" className="space-y-8 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-slate-950 dark:text-white">
              Why Families Trust Our Academy
            </h3>
            <p className="text-slate-800 dark:text-slate-200 text-sm font-medium">
              We go beyond textbooks to cultivate well-rounded, confident individuals prepared for world-class universities and life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 hover:border-primary/50 transition-all shadow-sm hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-heading font-bold text-slate-950 dark:text-white">Next-Gen STEM & AI Labs</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                Equipped with 3D printers, IoT kits, drone simulation, and Python programming to cultivate critical technological thinking early.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 hover:border-primary/50 transition-all shadow-sm hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Trophy className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-heading font-bold text-slate-950 dark:text-white">Sports & Athletics Complex</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                Full-size football ground, athletic running track, basketball courts, badminton academy, and certified professional national coaches.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 hover:border-primary/50 transition-all shadow-sm hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Bus className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-heading font-bold text-slate-950 dark:text-white">Safe GPS-Monitored Fleet</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                Air-conditioned school buses with female security attendants, speed governors, CCTV cameras, and live mobile tracking for parents.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 hover:border-primary/50 transition-all shadow-sm hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Laptop className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-heading font-bold text-slate-950 dark:text-white">Smart Digital Classrooms</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                Interactive smart flat panels with 3D visualization, recorded lecture archives, and digital attendance integrated with parent SMS notifications.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 hover:border-primary/50 transition-all shadow-sm hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Microscope className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-heading font-bold text-slate-950 dark:text-white">Advanced Science Facilities</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                Spacious individual laboratories for Physics, Chemistry, Biology, and Mathematics adhering to the highest safety and regulatory standards.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 hover:border-primary/50 transition-all shadow-sm hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-heading font-bold text-slate-950 dark:text-white">Holistic Life Skills & Wellness</h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                Full-time resident student counselors, mindfulness programs, speech & debate clubs, and community service drives to build compassionate leaders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
