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
      title: "State-of-the-Art STEM & Robotics Lab",
      category: "Innovation & Technology",
      image: "/images/stem-lab.jpg",
      badge: "AI Powered",
      description:
        "Equipped with advanced Arduino, Raspberry Pi, 3D printing, and humanoid robotics kits. Our students learn artificial intelligence concepts, algorithmic problem solving, and design thinking from Grade 3 onward.",
      stats: ["40+ Workstations", "3D Printers & Laser Cutters", "Robotics Club Mentors"],
    },
    {
      title: "International Multi-Sport Complex",
      category: "Athletics & Physical Fitness",
      image: "/images/sports-complex.jpg",
      badge: "Olympic Grade",
      description:
        "A sprawling 400-meter synthetic athletic running track, FIFA-standard natural turf football pitch, floodlit basketball and tennis courts, plus indoor badminton courts and a semi-Olympic heated swimming pool.",
      stats: ["FIFA-Standard Pitch", "400m All-Weather Track", "NIS Certified Coaches"],
    },
    {
      title: "High-Tech Digital Resource & Library",
      category: "Knowledge & Research",
      image: "/images/library.jpg",
      badge: "25,000+ Titles",
      description:
        "An intellectually inspiring sanctuary featuring ergonomic wooden study pods, private research cubicles, high-speed digital Kindle kiosks, and subscription to international journals such as JSTOR and National Geographic Kids.",
      stats: ["25,000+ Physical Books", "E-Book Kiosks", "Silent Study Pods"],
    },
    {
      title: "15-Acre Eco-Friendly Green Campus",
      category: "Architecture & Infrastructure",
      image: "/images/campus-hero.jpg",
      badge: "Zero Carbon",
      description:
        "Designed with energy-efficient thermal architecture, landscaped botanical gardens, solar energy arrays, rainwater harvesting systems, and expansive green courtyards to ensure a clean, refreshing learning atmosphere.",
      stats: ["Solar-Powered Campus", "Air-Purified Classrooms", "100% CCTV Coverage"],
    },
  ];

  const current = facilities[selectedFacility];

  return (
    <section id="facilities" className="py-10 sm:py-14 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
              World-Class Infrastructure
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Spaces Designed to Inspire Greatness
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Every corner of our campus is engineered to stimulate creative thinking, teamwork, physical vigor, and scholastic pursuit.
            </p>
          </div>

          <Button onClick={onOpenEnquiry} className="gap-2 shrink-0 font-semibold shadow-md">
            <span>Schedule Campus Tour</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Featured Facility Media */}
          <div className="lg:col-span-8">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border bg-card group">
              <div className="aspect-[16/10] w-full overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Floating Top Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1 shadow-md gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    {current.badge}
                  </Badge>
                </div>

                {/* Bottom Overlay Content */}
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                  <div className="text-xs uppercase tracking-wider font-semibold text-primary-foreground/80">
                    {current.category}
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow-md">
                    {current.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 max-w-2xl line-clamp-2 drop-shadow">
                    {current.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {current.stats.map((stat, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-medium"
                      >
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Facility Switcher Cards */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {facilities.map((fac, idx) => {
              const isActive = idx === selectedFacility;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedFacility(idx)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
                    isActive
                      ? "bg-primary/10 border-primary shadow-md"
                      : "bg-card border-border/70 hover:bg-muted/60 hover:border-border"
                  }`}
                >
                  <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-border/60 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fac.image} alt={fac.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                        {fac.category}
                      </span>
                      {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <div className="text-sm font-bold text-foreground truncate mt-0.5">
                      {fac.title}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
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
