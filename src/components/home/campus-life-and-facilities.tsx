"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Building,
  Check,
  ChevronRight,
  Cpu,
  Eye,
  Maximize2,
  Sparkles,
  Trophy,
} from "lucide-react";

interface CampusLifeAndFacilitiesProps {
  onOpenEnquiry: () => void;
}

export function CampusLifeAndFacilities({ onOpenEnquiry }: CampusLifeAndFacilitiesProps) {
  const [selectedFacility, setSelectedFacility] = useState(0);

  const facilities = [
    {
      title: "STEM & Robotics Innovation Lab",
      category: "Technology",
      image: "/images/stem-lab.jpg",
      badge: "AI Powered",
      description:
        "Arduino workstations, 3D printing, and Python AI coding.",
      stats: ["40+ Workstations", "3D Printers", "Robotics"],
    },
    {
      title: "Olympic Multi-Sport Complex",
      category: "Athletics",
      image: "/images/sports-complex.jpg",
      badge: "Olympic Grade",
      description:
        "400m synthetic track, football pitch, basketball & pool.",
      stats: ["FIFA Pitch", "400m Track", "NIS Coaches"],
    },
    {
      title: "Digital Research Resource Library",
      category: "Knowledge",
      image: "/images/library.jpg",
      badge: "25,000+ Books",
      description:
        "Quiet study pods, Kindle kiosks, and academic research journals.",
      stats: ["25,000+ Books", "E-Book Pods", "Silent Study"],
    },
    {
      title: "15-Acre Eco-Friendly Green Campus",
      category: "Campus",
      image: "/images/campus-hero.jpg",
      badge: "Zero Carbon",
      description:
        "Solar-powered campus, clean air filtration, and 100% CCTV security.",
      stats: ["Solar-Powered", "Clean Air", "100% CCTV"],
    },
  ];

  const current = facilities[selectedFacility];

  return (
    <section id="facilities" className="py-8 sm:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-bold text-xs uppercase tracking-wider">
              Infrastructure
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
              World-Class Campus Facilities
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-base font-medium">
              Spaces engineered to stimulate innovation, physical fitness, and scholarship.
            </p>
          </div>

          <Button onClick={onOpenEnquiry} className="w-full sm:w-auto font-bold gap-2 shrink-0 shadow-md h-11 rounded-xl">
            <span>Schedule Campus Tour</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
          {/* Main Featured Facility Media */}
          <div className="lg:col-span-8">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-card group">
              <div className="aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Floating Top Badge */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                  <Badge className="bg-primary text-primary-foreground font-bold px-2.5 py-1 text-xs shadow-md gap-1">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    {current.badge}
                  </Badge>
                </div>

                {/* Bottom Overlay Content */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 text-white space-y-1 sm:space-y-2">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-primary-foreground/90">
                    {current.category}
                  </div>
                  <h3 className="text-base sm:text-2xl font-heading font-extrabold text-white drop-shadow-md">
                    {current.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 max-w-2xl line-clamp-2 drop-shadow font-medium">
                    {current.description}
                  </p>
                  <div className="hidden sm:flex flex-wrap gap-2 pt-1">
                    {current.stats.map((stat, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-semibold"
                      >
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Facility Switcher Cards - Responsive 2-Col on mobile, 1-Col on desktop */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-2.5">
            {facilities.map((fac, idx) => {
              const isActive = idx === selectedFacility;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedFacility(idx)}
                  className={`text-left p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col xs:flex-row items-start xs:items-center gap-2 sm:gap-3 ${
                    isActive
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-card border-slate-200 dark:border-slate-800 hover:bg-muted/60"
                  }`}
                >
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fac.image} alt={fac.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                        {fac.category}
                      </span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                      {fac.title}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 hidden xs:block">
                      {fac.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
