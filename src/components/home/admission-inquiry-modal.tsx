"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  School,
  Send,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { cleanSchoolName } from "@/lib/school-branding";

interface AdmissionInquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName: string;
  phone?: string;
  email?: string;
}

export function AdmissionInquiryModal({
  open,
  onOpenChange,
  schoolName,
  phone = "+91 98765 43210",
  email = "admissions@school.edu.in",
}: AdmissionInquiryModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    phone: "",
    email: "",
    grade: "Class 1 (Grade 1)",
    message: "",
  });

  const cleanName = cleanSchoolName(schoolName || "A.K. Sunshine Convent School");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.phone.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please enter the student's full name and contact mobile number.",
        variant: "destructive",
      });
      return;
    }

    if (formData.phone.replace(/\D/g, "").length < 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast({
        title: "Enquiry Submitted Successfully!",
        description: `Our admissions desk will contact you regarding ${formData.studentName}'s admission.`,
      });
    }, 700);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      studentName: "",
      parentName: "",
      phone: "",
      email: "",
      grade: "Class 1 (Grade 1)",
      message: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 bg-background/98 backdrop-blur-2xl shadow-2xl p-6 sm:p-7 rounded-3xl">
        <DialogHeader className="text-left space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold w-fit">
            <School className="h-3.5 w-3.5" />
            <span>Admissions Desk • Academic Session 2025–2026</span>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
            Admission Enquiry Form
          </DialogTitle>
          <DialogDescription className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            Fill in the details below to initiate direct admission counseling and campus visit scheduling for{" "}
            <strong className="text-slate-950 dark:text-white font-bold">{cleanName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border-2 border-emerald-500/20 shadow-lg">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-heading font-extrabold text-slate-950 dark:text-white">
                Application Received!
              </h4>
              <p className="text-slate-700 dark:text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                Thank you for reaching out. We have logged your enquiry for{" "}
                <strong className="text-slate-950 dark:text-white font-bold">{formData.studentName}</strong> seeking
                admission to <span className="text-primary font-bold">{formData.grade}</span>.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-left text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <div className="font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> Admissions Helpline & Counseling Office:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-medium">
                <div>
                  <span className="text-slate-500">Direct Phone:</span>{" "}
                  <strong className="text-slate-900 dark:text-slate-100">{phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Official Email:</span>{" "}
                  <strong className="text-slate-900 dark:text-slate-100">{email}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Counseling Timings:</span>{" "}
                  <strong className="text-slate-900 dark:text-slate-100">Monday – Saturday (8:30 AM to 3:30 PM)</strong>
                </div>
              </div>
            </div>

            <Button onClick={handleReset} className="w-full font-bold py-5 rounded-xl shadow-md">
              Close Window
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {/* Student Name & Parent Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="studentName"
                  className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <User className="h-3.5 w-3.5 text-primary" />
                  Student Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentName"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="font-medium text-slate-950 dark:text-white bg-slate-50/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="parentName"
                  className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Parent / Guardian Name
                </Label>
                <Input
                  id="parentName"
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="font-medium text-slate-950 dark:text-white bg-slate-50/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 focus:border-primary"
                />
              </div>
            </div>

            {/* Mobile Contact & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  Contact Mobile <span className="text-destructive">*</span>
                </Label>
                <div className="relative flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold select-none">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                    className="rounded-l-none font-medium text-slate-950 dark:text-white bg-slate-50/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="font-medium text-slate-950 dark:text-white bg-slate-50/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 focus:border-primary"
                />
              </div>
            </div>

            {/* Class / Grade Selection with Clear Categorized Options */}
            <div className="space-y-1.5">
              <Label
                htmlFor="grade"
                className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  Class Seeking Admission For <span className="text-destructive">*</span>
                </span>
                <span className="text-[11px] font-semibold text-primary">Session 2025–26</span>
              </Label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 px-3.5 py-2 text-sm font-semibold text-slate-950 dark:text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
              >
                <optgroup label="🧸 Pre-Primary Wing (Early Childhood)">
                  <option value="Pre-Nursery / Playgroup">Pre-Nursery / Playgroup (Age 2.5–3 yrs)</option>
                  <option value="Nursery">Nursery (Age 3–4 yrs)</option>
                  <option value="L.K.G. (Lower KG)">L.K.G. (Lower Kindergarten - Age 4–5 yrs)</option>
                  <option value="U.K.G. (Upper KG)">U.K.G. (Upper Kindergarten - Age 5–6 yrs)</option>
                </optgroup>

                <optgroup label="📚 Primary School (Class 1 to 5)">
                  <option value="Class 1 (Grade 1)">Class 1 (Grade 1)</option>
                  <option value="Class 2 (Grade 2)">Class 2 (Grade 2)</option>
                  <option value="Class 3 (Grade 3)">Class 3 (Grade 3)</option>
                  <option value="Class 4 (Grade 4)">Class 4 (Grade 4)</option>
                  <option value="Class 5 (Grade 5)">Class 5 (Grade 5)</option>
                </optgroup>

                <optgroup label="🔬 Middle School (Class 6 to 8)">
                  <option value="Class 6 (Grade 6)">Class 6 (Grade 6)</option>
                  <option value="Class 7 (Grade 7)">Class 7 (Grade 7)</option>
                  <option value="Class 8 (Grade 8)">Class 8 (Grade 8)</option>
                </optgroup>

                <optgroup label="🎓 Secondary School (Class 9 & 10)">
                  <option value="Class 9 (Grade 9)">Class 9 (Grade 9)</option>
                  <option value="Class 10 (Grade 10)">Class 10 (Grade 10)</option>
                </optgroup>

                <optgroup label="🏛️ Senior Secondary (Class 11 & 12 - Streams)">
                  <option value="Class 11 (Science - PCM / Engineering)">Class 11 — Science (Physics, Chemistry, Maths)</option>
                  <option value="Class 11 (Science - PCB / Medical)">Class 11 — Science (Physics, Chemistry, Biology)</option>
                  <option value="Class 11 (Commerce with Maths)">Class 11 — Commerce (with Mathematics)</option>
                  <option value="Class 11 (Commerce without Maths)">Class 11 — Commerce (with Informatics/Applied)</option>
                  <option value="Class 11 (Humanities / Arts)">Class 11 — Humanities / Arts</option>
                  <option value="Class 12 (Science Stream)">Class 12 — Science Stream</option>
                  <option value="Class 12 (Commerce Stream)">Class 12 — Commerce Stream</option>
                  <option value="Class 12 (Humanities Stream)">Class 12 — Humanities / Arts</option>
                </optgroup>
              </select>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Choose the standard/class your child will enter. Stream choices for Class 11 include dedicated career counseling.
              </p>
            </div>

            {/* Questions / Requirements */}
            <div className="space-y-1.5">
              <Label
                htmlFor="message"
                className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Any Specific Questions / Requirement
              </Label>
              <Input
                id="message"
                placeholder="e.g. Bus transport route, hostel query, sibling concession..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="font-medium text-slate-950 dark:text-white bg-slate-50/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 focus:border-primary"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full font-bold text-sm sm:text-base gap-2 py-6 rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.01] transition-transform"
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
                    Submit Admission Request
                  </>
                )}
              </Button>
            </div>

            {/* Helpline Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800 font-medium">
              <span className="flex items-center gap-1.5">
                <PhoneCall className="h-3.5 w-3.5 text-primary" />
                Admissions Desk: <strong className="text-slate-950 dark:text-white font-bold">{phone}</strong>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Counseling: Mon–Sat (8:30 AM – 3:30 PM)
              </span>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
