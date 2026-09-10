"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, Heart, Quote, Sparkles } from "lucide-react";

interface PrincipalDeskProps {
  schoolName: string;
  onOpenEnquiry: () => void;
}

export function PrincipalDesk({ schoolName, onOpenEnquiry }: PrincipalDeskProps) {
  return (
    <section id="principal" className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary/5 via-card to-background border border-border rounded-3xl p-6 sm:p-12 shadow-xl relative overflow-hidden">
          {/* Subtle Background Icon */}
          <Quote className="absolute -top-6 -right-6 h-48 w-48 text-primary/5 pointer-events-none rotate-12" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative">
            {/* Principal Photo & Details Card */}
            <div className="lg:col-span-5 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="h-44 w-44 sm:h-52 sm:w-52 rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl p-1 bg-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
                    alt="School Principal"
                    className="h-full w-full object-cover rounded-full"
                  />
                </div>
                <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                  <Award className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  Dr. Radhika Sen Sharma
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-primary">
                  Principal & Director of Academics
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ph.D. in Educational Leadership (Oxford Alumni) • 26+ Years Experience
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <Badge variant="secondary" className="text-[10px]">
                  National CBSE Educator Award
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Author & Child Mentor
                </Badge>
              </div>
            </div>

            {/* Principal's Letter Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <Badge variant="outline" className="text-primary border-primary/30 text-xs font-semibold">
                  From the Principal&apos;s Desk
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  &ldquo;We don&apos;t just prepare children for exams; we prepare them for life.&rdquo;
                </h2>
              </div>

              <div className="space-y-3.5 text-muted-foreground text-xs sm:text-sm leading-relaxed">
                <p>
                  Dear Parents and Guardians, welcome to <strong>{schoolName}</strong>. As an educator for over two and a half decades, I believe true education transcends textbooks and scorecards. It is ignited in the spark of curiosity, anchored in moral integrity, and strengthened by resilience.
                </p>
                <p>
                  In this rapid digital era, our children must be confident innovators who can think critically, adapt swiftly, and lead with compassion. From our kindergarten Montessori studios to our AI robotics labs and Olympic sports complex, every child at our academy is valued as an individual with unique genius.
                </p>
                <p>
                  We invite you to partner with us in this joyful journey of learning. Together, let us cultivate children who dream boldly and stand tall with humility and courage.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Button onClick={onOpenEnquiry} className="font-semibold gap-2 shadow-md">
                  <Sparkles className="h-4 w-4" />
                  Request Principal Interaction
                </Button>
                <span className="text-xs text-muted-foreground italic font-serif">
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
