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
  Building2,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

export default function ContactPage() {
  const { branding } = useBranding();
  const schoolName = getSchoolDisplayName(branding) || "Apex International Academy";
  const address = branding.address || "Institutional Area, Knowledge Park III, Sector 62";
  const phone = branding.phone || "+91 98765 43210";
  const email = branding.email || "admissions@school.edu.in";

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "Admission Inquiry",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({
        title: "Required Fields Missing",
        description: "Please enter your name and phone number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast({
        title: "Message Dispatched Successfully!",
        description: "Our administrative office will contact you within 24 business hours.",
      });
    }, 850);
  };

  const departments = [
    {
      title: "Admissions & Counseling",
      phone: phone,
      email: email,
      hours: "8:30 AM – 3:30 PM (Mon – Sat)",
    },
    {
      title: "Accounts & Fee Counter",
      phone: "+91 98765 43212",
      email: "accounts@school.edu.in",
      hours: "9:00 AM – 2:30 PM (Mon – Fri)",
    },
    {
      title: "Principal's Office",
      phone: "+91 98765 43215",
      email: "principal@school.edu.in",
      hours: "By Prior Appointment Only",
    },
    {
      title: "Transport & Safety Helpline",
      phone: "+91 98765 43218",
      email: "transport@school.edu.in",
      hours: "6:30 AM – 6:00 PM (Active on Bus Run Days)",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <SchoolNavbar branding={branding} />

      <main className="flex-1">
        {/* Page Hero */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-primary/10 via-background to-background border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 font-bold text-xs bg-primary/5">
              Reach Out to Us
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
              Connect with Our{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Admissions & Campus Team
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 max-w-3xl mx-auto leading-relaxed font-medium">
              Have questions regarding admissions, curriculum, transport routes, or campus visits? We are delighted to assist you.
            </p>
          </div>
        </section>

        {/* Contact Form & Key Info Section */}
        <section className="py-16 sm:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Contact Message Form */}
              <div className="lg:col-span-7 bg-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                    <Sparkles className="h-4 w-4" />
                    <span>Direct Message</span>
                  </div>
                  <h3 className="text-2xl font-heading font-extrabold text-slate-950 dark:text-white">
                    Send Us an Inquiry
                  </h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                    Leave your details and our counselor will reach out via phone or email.
                  </p>
                </div>

                {submitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="h-10 w-10 animate-bounce" />
                    </div>
                    <h4 className="text-2xl font-heading font-bold text-slate-950 dark:text-white">
                      Message Received!
                    </h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium max-w-sm mx-auto">
                      Thank you, <strong>{form.name}</strong>. Our front office desk has logged your enquiry and will respond within 24 business hours.
                    </p>
                    <div className="pt-2">
                      <Button onClick={() => setSubmitted(false)} variant="outline">
                        Send Another Inquiry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Your Full Name *</Label>
                        <Input
                          placeholder="e.g. Ramesh Chandra"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Mobile Phone *</Label>
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
                          placeholder="name@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Subject / Purpose</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        >
                          <option value="Admission Inquiry">Admission Inquiry (2025–26)</option>
                          <option value="Schedule Campus Visit">Schedule Campus Tour</option>
                          <option value="Fee Structure Query">Fee Structure Query</option>
                          <option value="Transport Route Inquiry">Transport Route Inquiry</option>
                          <option value="General Information">General Feedback / Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Your Message / Questions</Label>
                      <textarea
                        rows={4}
                        placeholder="Please write your questions here..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <Button type="submit" className="w-full font-bold gap-2 py-6 rounded-xl shadow-lg" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Inquiry
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>

              {/* Campus Location & Hours Details */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="space-y-2">
                    <h4 className="font-heading font-extrabold text-xl text-slate-950 dark:text-white">
                      Campus Headquarters
                    </h4>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      Conveniently connected via major expressways with dedicated green drop-off zones for school buses.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-950 dark:text-white">Address:</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{address}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-950 dark:text-white">Helpline:</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{phone}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-950 dark:text-white">Official Email:</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{email}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-950 dark:text-white">Office Visiting Hours:</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">Monday to Saturday: 8:00 AM to 3:30 PM</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Map Placeholder Card */}
                <div className="rounded-3xl border border-border bg-slate-900 text-white p-6 space-y-3 relative overflow-hidden shadow-lg">
                  <div className="font-heading font-bold text-base">Interactive Campus Location</div>
                  <p className="text-xs text-slate-300 font-medium">
                    Located within 10 minutes of City Metro Station and 5 minutes from Central Ring Road.
                  </p>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-bold hover:underline pt-1"
                  >
                    <span>Open in Google Maps</span>
                    <Sparkles className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Department Directory Table */}
        <section className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 font-bold text-xs bg-primary/5">
                Staff Directory
              </Badge>
              <h2 className="text-3xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
                Departmental Contacts
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {departments.map((dept, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm hover:border-primary/40 transition-all"
                >
                  <div className="font-heading font-bold text-base text-slate-950 dark:text-white">{dept.title}</div>
                  <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold">
                    <div>📞 {dept.phone}</div>
                    <div>✉️ {dept.email}</div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                      🕒 {dept.hours}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SchoolFooter branding={branding} onOpenEnquiry={() => setSubmitted(false)} />
    </div>
  );
}
