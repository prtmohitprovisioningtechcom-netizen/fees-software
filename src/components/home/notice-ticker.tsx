"use client";

import { BellRing, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const notices = [
  {
    id: 1,
    tag: "Admissions",
    date: "Session 2025–26",
    text: "Online Registration & Entrance Assessments open for Nursery to Class XI. Limited seats available!",
    highlight: true,
  },
  {
    id: 2,
    tag: "Academics",
    date: "Oct 12",
    text: "Term-1 Comprehensive Assessments schedule and syllabus published on Student Portal.",
    highlight: false,
  },
  {
    id: 3,
    tag: "Achievement",
    date: "Oct 05",
    text: "Our Robotics Team wins 1st Prize at National Inter-School AI Innovation Championship!",
    highlight: true,
  },
  {
    id: 4,
    tag: "Campus",
    date: "Upcoming",
    text: "Annual Sports Meet & Athletic Carnival scheduled. Parents cordially invited.",
    highlight: false,
  },
];

export function NoticeTicker({ onOpenEnquiry }: { onOpenEnquiry: () => void }) {
  return (
    <div className="border-y border-border/70 bg-gradient-to-r from-primary/10 via-background to-primary/5 py-2.5 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-medium shrink-0">
          <Badge variant="default" className="bg-primary text-primary-foreground text-[11px] gap-1 px-2.5 py-0.5 shadow-sm">
            <BellRing className="h-3 w-3 animate-pulse" />
            LATEST NOTICES
          </Badge>
          <span className="hidden sm:inline-block text-muted-foreground">|</span>
        </div>

        <div className="flex-1 overflow-hidden w-full">
          <div className="flex items-center gap-6 animate-pulse hover:pause">
            {notices.map((notice) => (
              <div key={notice.id} className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  {notice.highlight && <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />}
                  [{notice.tag}]
                </span>
                <span className="text-muted-foreground">{notice.text}</span>
                <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                  <Calendar className="h-2.5 w-2.5" />
                  {notice.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenEnquiry}
          className="shrink-0 flex items-center gap-1 text-primary hover:text-primary/80 font-semibold transition-colors hover:underline"
        >
          <span>Enquire for Seat</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
