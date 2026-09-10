"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronDown, ChevronUp, MessageSquareQuote, CheckCircle2 } from "lucide-react";

export function TestimonialsAndFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const testimonials = [
    {
      name: "Sanjay & Meenakshi Gupta",
      role: "Parents of Aarav (Grade 6) & Ananya (Grade 9)",
      quote:
        "The balanced emphasis on academics and extracurriculars is extraordinary. Aarav was shy, but the robotics and debate clubs transformed his confidence. The fee transparency and online portal also make things completely effortless for working parents.",
      stars: 5,
    },
    {
      name: "Dr. Arvind Chawla",
      role: "Senior Surgeon, Parent of Rhea (Grade 12 - Medical Stream)",
      quote:
        "The dedicated faculty for CBSE science streams provides immense depth. My daughter didn't require external tuition because the school teachers gave one-on-one doubt clearing sessions after classes. Truly a temple of genuine learning.",
      stars: 5,
    },
    {
      name: "Tanya Kapoor",
      role: "Alumni (Batch 2023) • Now at BITS Pilani (Computer Science)",
      quote:
        "The STEM foundation and coding hackathons in Class 10 and 11 gave me an unbeatable headstart in engineering. Forever grateful to my teachers and the mentors at the robotics lab!",
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: "What is the admission procedure for the session 2025–26?",
      a: "The admission process is simple: 1) Fill the online admission enquiry form or visit campus. 2) Schedule an informal student-parent interaction and baseline assessment. 3) Document verification and fee token confirmation to secure the seat.",
    },
    {
      q: "What documents are required during admission?",
      a: "You will need: Student's original Birth Certificate, Transfer Certificate (TC) from previous school (for Class 2 and above), Previous year's report card, 4 passport photos, and Address Proof (Aadhaar Card / Utility Bill).",
    },
    {
      q: "How does the school transport system operate?",
      a: "Our entire fleet consists of air-conditioned GPS-tracked buses equipped with CCTV and female attendants. Parents receive live mobile updates of the bus route and estimated arrival timings.",
    },
    {
      q: "What are the fee payment options and cycle?",
      a: "Fees are collected on an easy quarterly schedule (April, July, October, January). Parents can pay conveniently via UPI, Credit/Debit card, Net Banking, or at the school accounts desk.",
    },
    {
      q: "Are scholarships offered for sports or academic excellence?",
      a: "Yes! We offer merit-based fee concessions of up to 50% for students with outstanding board results, national-level sports champions, and sibling discounts.",
    },
  ];

  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-muted/20 border-t border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Testimonials Block */}
        <div className="space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 font-bold text-xs bg-primary/5">
              Parent & Alumni Voices
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-slate-950 dark:text-white">
              Loved by Over 1,200+ Proud Families
            </h2>
            <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base font-medium">
              Hear firsthand from the parents and alumni who have experienced our nurturing ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:shadow-lg hover:border-primary/40 transition-all shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="font-extrabold text-sm text-slate-950 dark:text-white font-heading">{t.name}</div>
                  <div className="text-xs text-primary font-bold">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs Block */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-slate-950 dark:text-white">
              Frequently Asked Questions
            </h3>
            <p className="text-slate-800 dark:text-slate-200 text-sm font-medium">
              Answers to common queries about admissions, schedules, transport, and curriculum.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-950 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-700 dark:text-slate-300 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800 pt-3 leading-relaxed bg-slate-50 dark:bg-slate-900/40 font-medium">
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
