"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  CheckCircle2,
  Coins,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  Receipt,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface FeePreviewCalculatorProps {
  onOpenEnquiry: () => void;
}

export function FeePreviewCalculator({ onOpenEnquiry }: FeePreviewCalculatorProps) {
  const [selectedGrade, setSelectedGrade] = useState("primary");
  const [transportZone, setTransportZone] = useState("zone1");
  const [optRobotics, setOptRobotics] = useState(true);
  const [optSports, setOptSports] = useState(false);
  const [optMeals, setOptMeals] = useState(false);

  // Fee slabs (Quarterly in INR)
  const gradeFees: Record<string, { label: string; tuition: number; admissionOneTime: number; labFee: number }> = {
    nursery: {
      label: "Pre-Primary (Nursery, LKG, UKG)",
      tuition: 18500,
      admissionOneTime: 12000,
      labFee: 1500,
    },
    primary: {
      label: "Primary Wing (Class 1 to 5)",
      tuition: 24000,
      admissionOneTime: 15000,
      labFee: 2500,
    },
    middle: {
      label: "Middle Wing (Class 6 to 8)",
      tuition: 28500,
      admissionOneTime: 15000,
      labFee: 3500,
    },
    secondary: {
      label: "Secondary Wing (Class 9 & 10)",
      tuition: 34000,
      admissionOneTime: 18000,
      labFee: 4500,
    },
    senior: {
      label: "Senior Secondary (Class 11 & 12)",
      tuition: 42000,
      admissionOneTime: 20000,
      labFee: 6000,
    },
  };

  const transportFees: Record<string, { label: string; cost: number }> = {
    none: { label: "Self / No Transport", cost: 0 },
    zone1: { label: "Zone 1 (Within 5 km)", cost: 4500 },
    zone2: { label: "Zone 2 (5 km to 12 km)", cost: 6500 },
    zone3: { label: "Zone 3 (12 km to 20 km)", cost: 8500 },
  };

  const currentGradeData = gradeFees[selectedGrade];
  const currentTransportData = transportFees[transportZone];

  const roboticsFee = optRobotics ? 2000 : 0;
  const sportsFee = optSports ? 3000 : 0;
  const mealsFee = optMeals ? 5500 : 0;

  const totalQuarterly =
    currentGradeData.tuition +
    currentGradeData.labFee +
    currentTransportData.cost +
    roboticsFee +
    sportsFee +
    mealsFee;

  return (
    <section id="fees" className="py-16 sm:py-24 bg-muted/40 border-y border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 font-bold text-xs bg-primary/5">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-slate-950 dark:text-white">
            Interactive Fee Estimator
          </h2>
          <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
            We believe in 100% transparency with zero hidden charges or surprise costs. Estimate the fee structure for your child below.
          </p>
        </div>

        {/* Calculator Container */}
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Form Controls Column */}
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-8">
              {/* Step 1: Grade Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-950 dark:text-white flex items-center justify-between">
                  <span>1. Select Student Grade / Wing:</span>
                  <span className="text-xs font-bold text-primary">Academic Year 2025–26</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(gradeFees).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedGrade(key)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        selectedGrade === key
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Transport Facility */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-950 dark:text-white flex items-center justify-between">
                  <span>2. School Bus Transport (AC & GPS Monitored):</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Quarterly</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(transportFees).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => setTransportZone(key)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                        transportZone === key
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div>{item.label.split("(")[0]}</div>
                      <div className="text-[11px] opacity-90 mt-0.5">
                        {item.cost === 0 ? "Free / Self" : `+₹${item.cost.toLocaleString("en-IN")}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Optional Enrichment Clubs */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-950 dark:text-white">
                  3. Optional Programs & Enrichments (Per Quarter):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                      optRobotics
                        ? "bg-primary/10 border-primary/70 text-slate-950 dark:text-white font-bold"
                        : "bg-background border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={optRobotics}
                      onChange={(e) => setOptRobotics(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="font-bold text-slate-950 dark:text-white">AI & Robotics Lab</div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold mt-0.5">+₹2,000 / qtr</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                      optSports
                        ? "bg-primary/10 border-primary/70 text-slate-950 dark:text-white font-bold"
                        : "bg-background border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={optSports}
                      onChange={(e) => setOptSports(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="font-bold text-slate-950 dark:text-white">Sports Academy</div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold mt-0.5">+₹3,000 / qtr</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                      optMeals
                        ? "bg-primary/10 border-primary/70 text-slate-950 dark:text-white font-bold"
                        : "bg-background border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={optMeals}
                      onChange={(e) => setOptMeals(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="font-bold text-slate-950 dark:text-white">Healthy Meal Plan</div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold mt-0.5">+₹5,500 / qtr</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Estimated Total Breakdown Column */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/60 p-6 sm:p-10 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-950 dark:text-white font-heading">
                    <Receipt className="h-4 w-4 text-primary" />
                    <span>Quarterly Fee Summary</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    4 Quarters / Year
                  </Badge>
                </div>

                {/* Breakdown line items */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                    <span>Tuition & Academic Development</span>
                    <span className="font-extrabold text-slate-950 dark:text-white">
                      ₹{currentGradeData.tuition.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                    <span>Science, IT & Activity Surcharge</span>
                    <span className="font-extrabold text-slate-950 dark:text-white">
                      ₹{currentGradeData.labFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {currentTransportData.cost > 0 && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                      <span>Transport ({currentTransportData.label})</span>
                      <span className="font-extrabold text-slate-950 dark:text-white">
                        ₹{currentTransportData.cost.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {optRobotics && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                      <span>Robotics & AI Lab Club</span>
                      <span className="font-extrabold text-slate-950 dark:text-white">₹2,000</span>
                    </div>
                  )}
                  {optSports && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                      <span>Specialized Sports Coaching</span>
                      <span className="font-extrabold text-slate-950 dark:text-white">₹3,000</span>
                    </div>
                  )}
                  {optMeals && (
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                      <span>Hot Nutritious Meals</span>
                      <span className="font-extrabold text-slate-950 dark:text-white">₹5,500</span>
                    </div>
                  )}
                </div>

                {/* Grand Total Highlight */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Estimated Total (Per Quarter)
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-primary tracking-tight font-heading">
                    ₹{totalQuarterly.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Approx. ₹{Math.round(totalQuarterly / 3).toLocaleString("en-IN")} / month • No hidden fees
                  </div>
                </div>

                <div className="rounded-xl bg-background p-3 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium space-y-1 shadow-sm">
                  <p className="font-bold text-slate-950 dark:text-white flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Merit Scholarships Available
                  </p>
                  <p>Up to 50% tuition waiver for meritorious students & sports champions.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button onClick={onOpenEnquiry} className="w-full font-bold gap-2 py-5 shadow-md">
                  <CreditCard className="h-4 w-4" />
                  Apply with Estimated Fee
                </Button>

                {/* Direct Link to Staff Fee Counter / Admin Login */}
                <Link href="/login" className="block text-center">
                  <span className="text-xs text-slate-800 dark:text-slate-200 hover:text-primary transition-colors flex items-center justify-center gap-1 font-semibold">
                    <Lock className="h-3 w-3 text-amber-500" />
                    School Accountant or Staff? <strong className="text-primary underline">Sign in to Fee Portal</strong>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
