"use client";

import { useState } from "react";
import Link from "next/link";
import { useBranding } from "@/lib/branding-context";
import { getSchoolDisplayName } from "@/lib/school-branding";
import { SchoolNavbar } from "@/components/home/school-navbar";
import { SchoolFooter } from "@/components/home/school-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  HelpCircle,
  Loader2,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default function AdmissionsPage() {
  const { branding } = useBranding();
  const schoolName = getSchoolDisplayName(branding) || "Apex International Academy";

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    studentName: "",
    dob: "",
    gender: "Male",
    grade: "Grade 1",
    parentName: "",
    phone: "",
    email: "",
    address: "",
    previousSchool: "",
    transportRequired: "Yes",
    comments: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName || !form.phone || !form.parentName) {
      toast({
        title: "Required Information Missing",
        description: "Please provide student name, parent name, and contact phone number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast({
        title: "Application Received Successfully!",
        description: "Your reference number is #ADM-2025-" + Math.floor(1000 + Math.random() * 9000),
      });
    }, 900);
  };

  const steps = [
    {
      num: "01",
      title: "Online Registration",
      desc: "Fill the admission application form online or collect the registration prospectus from the school reception.",
    },
    {
      num: "02",
      title: "Interaction & Assessment",
      desc: "An informal, encouraging interaction session designed to understand the child's readiness and social milestones.",
    },
    {
      num: "03",
      title: "Document Verification",
      desc: "Verification of date of birth, previous school report card, transfer certificate, and address credentials.",
    },
    {
      num: "04",
      title: "Enrollment & Welcome",
      desc: "Fee token deposit to confirm the seat, uniform and book bundle distribution, and orientation date assignment.",
    },
  ];

  const ageCriteria = [
    { grade: "Pre-Nursery / Toddlers", age: "2.5 to 3 Years" },
    { grade: "Nursery", age: "3+ Years as on 31st March" },
    { grade: "Lower KG (LKG)", age: "4+ Years as on 31st March" },
    { grade: "Upper KG (UKG)", age: "5+ Years as on 31st March" },
    { grade: "Grade 1", age: "6+ Years as on 31st March" },
    { grade: "Grade 2 to 10", age: "Based on previous class TC & age matrix" },
    { grade: "Grade 11 & 12", age: "Class 10 CBSE/Equivalent Board Pass" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <SchoolNavbar branding={branding} />

      <main className="flex-1">
        {/* Page Hero */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
              Admissions Open 2025–26
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-foreground">
              Begin Your Child&apos;s{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Transformative Journey
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We welcome applications from curious young minds seeking a nurturing, academically rigorous, and holistic educational community at <strong>{schoolName}</strong>.
            </p>
          </div>
        </section>

        {/* 4-Step Process Section */}
        <section className="py-16 sm:py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-semibold text-xs">
                Simple & Transparent
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
                Four Easy Steps to Enrollment
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-muted/30 border border-border/80 rounded-3xl p-6 space-y-3 relative hover:border-primary/50 transition-all hover:shadow-md"
                >
                  <div className="text-4xl font-heading font-black text-primary/30">{step.num}</div>
                  <h3 className="font-heading font-bold text-lg text-foreground">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Application Form & Eligibility Criteria */}
        <section className="py-16 sm:py-24 bg-muted/20 border-y border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Full Online Admission Application Form */}
              <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                    <Sparkles className="h-4 w-4" />
                    <span>Official Online Application</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-foreground">
                    Student Registration Form
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Please provide accurate details. Our admissions officer will call you to confirm appointment.
                  </p>
                </div>

                {submitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="h-10 w-10 animate-bounce" />
                    </div>
                    <h4 className="text-2xl font-heading font-bold text-foreground">
                      Application Submitted Successfully!
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Thank you, <strong>{form.parentName}</strong>. We have registered <strong>{form.studentName}</strong> for <strong>{form.grade}</strong>. Our team will review the application and contact you at <strong>{form.phone}</strong>.
                    </p>
                    <div className="pt-2">
                      <Button onClick={() => setSubmitted(false)} variant="outline">
                        Submit Another Application
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Student Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Student Full Name *</Label>
                        <Input
                          placeholder="e.g. Advait Singhania"
                          value={form.studentName}
                          onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Date of Birth</Label>
                        <Input
                          type="date"
                          value={form.dob}
                          onChange={(e) => setForm({ ...form, dob: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Gender</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={form.gender}
                          onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Class / Grade Seeking Admission *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={form.grade}
                          onChange={(e) => setForm({ ...form, grade: e.target.value })}
                        >
                          <option value="Pre-Nursery">Pre-Nursery (Toddler)</option>
                          <option value="Nursery">Nursery</option>
                          <option value="Kindergarten (KG)">Kindergarten (KG)</option>
                          <option value="Grade 1">Grade 1</option>
                          <option value="Grade 2">Grade 2</option>
                          <option value="Grade 3">Grade 3</option>
                          <option value="Grade 4">Grade 4</option>
                          <option value="Grade 5">Grade 5</option>
                          <option value="Grade 6">Grade 6</option>
                          <option value="Grade 7">Grade 7</option>
                          <option value="Grade 8">Grade 8</option>
                          <option value="Grade 9">Grade 9</option>
                          <option value="Grade 10">Grade 10</option>
                          <option value="Grade 11 (Science - PCM/PCB)">Grade 11 (Science - PCM/PCB)</option>
                          <option value="Grade 11 (Commerce)">Grade 11 (Commerce)</option>
                          <option value="Grade 11 (Humanities)">Grade 11 (Humanities)</option>
                          <option value="Grade 12">Grade 12</option>
                        </select>
                      </div>
                    </div>

                    {/* Parent Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Father / Mother / Guardian Name *</Label>
                        <Input
                          placeholder="e.g. Vikram Singhania"
                          value={form.parentName}
                          onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Mobile Phone (for SMS / WhatsApp) *</Label>
                        <Input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Email Address</Label>
                        <Input
                          type="email"
                          placeholder="parent@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">School Bus Transport Needed?</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={form.transportRequired}
                          onChange={(e) => setForm({ ...form, transportRequired: e.target.value })}
                        >
                          <option value="Yes">Yes, GPS AC Bus required</option>
                          <option value="No">No, Self / Private Transport</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Residential Address</Label>
                      <Input
                        placeholder="House / Flat No, Street, Sector, City"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Previous School & Any Remarks</Label>
                      <Input
                        placeholder="Name of previous school or specific enquiry"
                        value={form.comments}
                        onChange={(e) => setForm({ ...form, comments: e.target.value })}
                      />
                    </div>

                    <div className="pt-3">
                      <Button
                        type="submit"
                        className="w-full font-semibold gap-2 py-6 rounded-xl shadow-lg"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Submit Admission Application
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-[11px] text-muted-foreground text-center">
                      🔒 Your data is completely safe and used strictly for official admission correspondence.
                    </p>
                  </form>
                )}
              </div>

              {/* Right Column: Age Matrix & Required Documents */}
              <div className="lg:col-span-5 space-y-6">
                {/* Age Criteria Table */}
                <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h4 className="font-heading font-bold text-lg text-foreground">
                      Age Eligibility Criteria
                    </h4>
                  </div>

                  <div className="divide-y divide-border/60 text-xs">
                    {ageCriteria.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <span className="font-semibold text-foreground">{item.grade}</span>
                        <span className="text-muted-foreground">{item.age}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Documents Checklist */}
                <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-heading font-bold text-lg text-foreground">
                      Documents Checklist
                    </h4>
                  </div>

                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Original Municipal Birth Certificate of the child.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Transfer Certificate (TC) from recognized previous school (Grade 2+).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Report Card / Marksheet of previous academic year.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>6 Passport-size photographs of student & 2 each of parents.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Proof of Residence (Aadhaar / Passport / Electricity bill).</span>
                    </li>
                  </ul>
                </div>

                {/* Direct Helpline Card */}
                <div className="bg-primary/10 border border-primary/30 rounded-3xl p-6 space-y-2 text-xs">
                  <div className="font-heading font-bold text-base text-primary flex items-center gap-2">
                    <PhoneCall className="h-4 w-4" />
                    <span>Admissions Helpdesk</span>
                  </div>
                  <p className="text-muted-foreground">
                    Have questions about availability of seats or stream selection? Call our counseling team:
                  </p>
                  <p className="font-bold text-sm text-foreground">📞 {branding.phone || "+91 98765 43210"}</p>
                  <p className="text-muted-foreground">Mon – Sat: 8:30 AM to 3:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SchoolFooter branding={branding} onOpenEnquiry={() => setSubmitted(false)} />
    </div>
  );
}
