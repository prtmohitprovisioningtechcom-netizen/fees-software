"use client";

import { useState, useEffect } from "react";
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
  ArrowRight,
  CheckCircle2,
  ChevronDown,
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
  initialGrade?: string;
}

export function AdmissionInquiryModal({
  open,
  onOpenChange,
  schoolName,
  phone = "+91 98765 43210",
  email = "admissions@school.edu.in",
  initialGrade = "Class 1 (Grade 1)",
}: AdmissionInquiryModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    phone: "",
    email: "",
    grade: initialGrade,
    message: "",
  });

  useEffect(() => {
    if (open && initialGrade) {
      setFormData((prev) => ({ ...prev, grade: initialGrade }));
    }
  }, [open, initialGrade]);

  const cleanName = cleanSchoolName(schoolName || "A.K. Sunshine Convent School");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.phone.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please enter the student's full name and mobile number.",
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
        title: "Seat Enquiry Submitted!",
        description: `Our admissions team will contact you shortly regarding ${formData.studentName}'s seat.`,
      });
    }, 500);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      studentName: "",
      parentName: "",
      phone: "",
      email: "",
      grade: initialGrade || "Class 1 (Grade 1)",
      message: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-xl max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 bg-background/98 backdrop-blur-2xl shadow-2xl p-4 sm:p-7 rounded-2xl sm:rounded-3xl">
        <DialogHeader className="text-left space-y-1.5 pb-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold w-fit">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Admissions 2025–2026 • Limited Seats Available</span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
            Enquire for Seat
          </DialogTitle>

          <DialogDescription className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            Fill in the details to check seat availability for{" "}
            <strong className="text-slate-950 dark:text-white font-bold">{cleanName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-4 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-md">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-heading font-extrabold text-slate-950 dark:text-white">
                Seat Enquiry Received!
              </h4>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-medium">
                We have registered the enquiry for{" "}
                <strong className="text-slate-950 dark:text-white font-bold">{formData.studentName}</strong> for{" "}
                <span className="text-primary font-bold">{formData.grade}</span>.
              </p>
            </div>

            <div className="bg-slate-100/70 dark:bg-slate-900/60 p-3.5 rounded-xl text-left text-xs text-slate-800 dark:text-slate-200 space-y-1.5">
              <div className="font-bold text-slate-950 dark:text-white flex items-center gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Admissions Desk Helpline:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5 font-semibold text-[11px] sm:text-xs">
                <div>
                  <span className="text-slate-600 dark:text-slate-400 font-normal">Phone:</span>{" "}
                  <strong className="text-slate-950 dark:text-white">{phone}</strong>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 font-normal">Office Hours:</span>{" "}
                  <strong className="text-slate-950 dark:text-white">Mon–Sat (8:30 AM – 3:30 PM)</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <a href={`tel:${phone.replace(/\D/g, "")}`} className="w-full sm:flex-1">
                <Button variant="outline" className="w-full font-bold h-10 rounded-xl text-xs gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5 text-primary" /> Call Admissions Desk
                </Button>
              </a>
              <Button onClick={handleReset} className="w-full sm:flex-1 font-bold h-10 rounded-xl text-xs shadow-md">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {/* Row 1: Student Name & Class Seeking Admission */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="studentName"
                  className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1"
                >
                  <User className="h-3 w-3 text-primary" />
                  Student Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentName"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="h-10 sm:h-11 rounded-xl text-base sm:text-sm font-medium text-slate-950 dark:text-white bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="grade"
                  className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1"
                >
                  <GraduationCap className="h-3 w-3 text-primary" />
                  Class Seeking <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <select
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="flex h-10 sm:h-11 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 px-3 pr-8 py-1.5 text-base sm:text-sm font-semibold text-slate-950 dark:text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm cursor-pointer"
                  >
                    <optgroup label="🧸 Pre-Primary Wing">
                      <option value="Pre-Nursery / Playgroup">Pre-Nursery / Playgroup</option>
                      <option value="Nursery">Nursery</option>
                      <option value="L.K.G. (Lower KG)">L.K.G. (Lower KG)</option>
                      <option value="U.K.G. (Upper KG)">U.K.G. (Upper KG)</option>
                    </optgroup>

                    <optgroup label="📚 Primary (Class 1 to 5)">
                      <option value="Class 1 (Grade 1)">Class 1</option>
                      <option value="Class 2 (Grade 2)">Class 2</option>
                      <option value="Class 3 (Grade 3)">Class 3</option>
                      <option value="Class 4 (Grade 4)">Class 4</option>
                      <option value="Class 5 (Grade 5)">Class 5</option>
                    </optgroup>

                    <optgroup label="🔬 Middle (Class 6 to 8)">
                      <option value="Class 6 (Grade 6)">Class 6</option>
                      <option value="Class 7 (Grade 7)">Class 7</option>
                      <option value="Class 8 (Grade 8)">Class 8</option>
                    </optgroup>

                    <optgroup label="🎓 Secondary (Class 9 & 10)">
                      <option value="Class 9 (Grade 9)">Class 9</option>
                      <option value="Class 10 (Grade 10)">Class 10</option>
                    </optgroup>

                    <optgroup label="🏛️ Senior Secondary (Class 11 & 12)">
                      <option value="Class 11 (Science - PCM)">Class 11 (Science PCM)</option>
                      <option value="Class 11 (Science - PCB)">Class 11 (Science PCB)</option>
                      <option value="Class 11 (Commerce)">Class 11 (Commerce)</option>
                      <option value="Class 11 (Humanities)">Class 11 (Humanities)</option>
                      <option value="Class 12 (Science Stream)">Class 12 (Science)</option>
                      <option value="Class 12 (Commerce Stream)">Class 12 (Commerce)</option>
                      <option value="Class 12 (Humanities Stream)">Class 12 (Humanities)</option>
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-slate-500" />
                </div>
              </div>
            </div>

            {/* Row 2: Parent Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="parentName"
                  className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1"
                >
                  <Users className="h-3 w-3 text-primary" />
                  Parent / Guardian Name
                </Label>
                <Input
                  id="parentName"
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="h-10 sm:h-11 rounded-xl text-base sm:text-sm font-medium text-slate-950 dark:text-white bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="phone"
                  className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1"
                >
                  <Phone className="h-3 w-3 text-primary" />
                  Contact Mobile <span className="text-destructive">*</span>
                </Label>
                <div className="relative flex rounded-xl overflow-hidden">
                  <span className="inline-flex items-center px-3 border border-r-0 border-slate-200 dark:border-slate-800 bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold select-none">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                    className="h-10 sm:h-11 rounded-l-none rounded-r-xl text-base sm:text-sm font-medium text-slate-950 dark:text-white bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Email Address & Specific Requirement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="email"
                  className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1"
                >
                  <Mail className="h-3 w-3 text-primary" />
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 sm:h-11 rounded-xl text-base sm:text-sm font-medium text-slate-950 dark:text-white bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="message"
                  className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1"
                >
                  <MessageSquare className="h-3 w-3 text-primary" />
                  Requirement / Question
                </Label>
                <Input
                  id="message"
                  placeholder="e.g. Bus transport route, concession..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="h-10 sm:h-11 rounded-xl text-base sm:text-sm font-medium text-slate-950 dark:text-white bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <Button
                type="submit"
                className="w-full font-bold text-xs sm:text-sm gap-1.5 h-11 rounded-xl shadow-md shadow-primary/25"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Seat Enquiry
                  </>
                )}
              </Button>
            </div>

            {/* Helpline Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-700 dark:text-slate-300 pt-0.5 font-medium">
              <span className="flex items-center gap-1">
                <PhoneCall className="h-3 w-3 text-primary" />
                Admissions:{" "}
                <a href={`tel:${phone.replace(/\D/g, "")}`} className="font-bold text-slate-950 dark:text-white hover:underline">
                  {phone}
                </a>
              </span>
              <span className="text-slate-500">
                Mon–Sat (8:30 AM – 3:30 PM)
              </span>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
