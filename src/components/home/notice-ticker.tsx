"use client";

import { BellRing, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const notices = [
  {
    id: 1,
    tag: "Admissions",
    date: "2025–26",
    text: "Admissions open for Nursery to Class 11. Limited seats!",
    highlight: true,
  },
  {
    id: 2,
    tag: "Academics",
    date: "Oct 12",
    text: "Term-1 Assessment datesheet published on portal.",
    highlight: false,
  },
  {
    id: 3,
    tag: "Achievement",
    date: "Oct 05",
    text: "Robotics Team wins 1st Prize at National AI Championship!",
    highlight: true,
  },
  {
    id: 4,
    tag: "Campus",
    date: "Upcoming",
    text: "Annual Sports Meet & Athletic Carnival announced.",
    highlight: false,
  },
];

export function NoticeTicker({ onOpenEnquiry }: { onOpenEnquiry: () => void }) {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 py-1.5 sm:py-2 px-2.5 sm:px-4 border-b border-border/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
        {/* News Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] sm:text-[11px] gap-1 px-2 py-0.5 shadow-sm font-bold">
            <BellRing className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-pulse" />
            <span>ALERTS</span>
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">|</span>
        </div>

        {/* Notices Content */}
        <div className="flex-1 overflow-hidden min-w-0">
          {/* Mobile view: concise active highlight */}
          <div className="sm:hidden truncate text-[11px] text-slate-900 dark:text-slate-100 font-semibold flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="truncate">Admissions 2025–26 Open (Nursery to Class 11)</span>
          </div>

          {/* Tablet/Desktop view: multi-notice row */}
          <div className="hidden sm:flex items-center gap-6 animate-pulse hover:pause truncate">
            {notices.map((notice) => (
              <div key={notice.id} className="flex items-center gap-1.5 shrink-0 text-xs">
                <span className="font-bold text-slate-950 dark:text-white flex items-center gap-0.5">
                  {notice.highlight && <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />}
                  [{notice.tag}]
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{notice.text}</span>
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  <Calendar className="h-2.5 w-2.5 text-primary" />
                  {notice.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action */}
        <button
          onClick={onOpenEnquiry}
          className="shrink-0 flex items-center gap-0.5 text-primary hover:text-primary/80 font-bold text-[11px] sm:text-xs transition-colors hover:underline"
        >
          <span>Enquire</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
