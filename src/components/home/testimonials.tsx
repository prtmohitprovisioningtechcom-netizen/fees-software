"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronDown, ChevronUp, MessageSquareQuote, CheckCircle2 } from "lucide-react";

export function TestimonialsAndFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const testimonials = [
    {
      name: "Sanjay & Meenakshi Gupta",
      role: "Parents of Aarav (Grade 6)",
      quote:
        "The balance of CBSE academics and robotics transformed Aarav's confidence. The digital parent portal makes tracking effortless.",
      stars: 5,
    },
    {
      name: "Dr. Arvind Chawla",
      role: "Parent of Rhea (Grade 12)",
      quote:
        "Exceptional coaching for board exams and NEET/JEE. Daily doubt sessions mean my child needs zero outside coaching.",
      stars: 5,
    },
    {
      name: "Tanya Kapoor",
      role: "Alumni (BITS Pilani CS)",
      quote:
        "The STEM lab and coding hackathons in Class 10 & 11 gave me a huge headstart in engineering college.",
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: "What is the admission procedure for 2025–26?",
      a: "1) Fill online enquiry. 2) Attend informal interaction. 3) Document verification & seat confirmation token.",
    },
    {
      q: "What documents are required?",
      a: "Birth Certificate, previous report card / TC, 4 passport photos, and address proof.",
    },
    {
      q: "How does the school bus transport work?",
      a: "GPS-enabled AC buses with CCTV cameras, female attendants, and live parent mobile tracking.",
    },
    {
      q: "What are the fee payment options?",
      a: "Quarterly installments payable via UPI, Net Banking, Credit/Debit card, or at accounts desk.",
    },
    {
      q: "Are merit or sports scholarships offered?",
      a: "Yes, up to 50% fee concession for academic toppers and national-level sports champions.",
    },
  ];

  return (
    <section id="testimonials" className="py-8 sm:py-12 bg-muted/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Testimonials Block */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 font-bold text-xs bg-primary/5 uppercase tracking-wider">
              Parent & Alumni Voices
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-slate-950 dark:text-white">
              Trusted by 1,800+ Families
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-base font-medium">
              Real feedback from parents and students experiencing our academic ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-2">
                  <div className="font-bold text-xs sm:text-sm text-slate-950 dark:text-white">
                    {t.name}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs Block - Clean & Compact */}
        <div className="pt-2 max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-3xl font-extrabold font-heading tracking-tight text-slate-950 dark:text-white">
              Frequently Asked Questions
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">
              Quick answers to common admission and campus queries.
            </p>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-950 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50/50 dark:bg-slate-900/40 font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
