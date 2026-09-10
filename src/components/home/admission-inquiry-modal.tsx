"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, Loader2, PhoneCall, School, Send } from "lucide-react";

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
    grade: "Grade 1",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.phone) {
      toast({
        title: "Required Fields Missing",
        description: "Please enter student name and contact number.",
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
        description: "Our admission counselor will contact you within 24 business hours.",
      });
    }, 900);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      studentName: "",
      parentName: "",
      phone: "",
      email: "",
      grade: "Grade 1",
      message: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto border-border/80 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <School className="h-4 w-4" />
            <span>Admissions Desk 2025–2026</span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Admission Enquiry
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Fill in the details below to initiate admission counseling for {schoolName}.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-foreground">Thank You for Your Interest!</h4>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                We have received your enquiry for <strong>{formData.studentName}</strong> ({formData.grade}). Our Admissions Team will reach out shortly.
              </p>
            </div>
            <div className="bg-muted/60 p-4 rounded-xl text-left text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Immediate Assistance Helpline:</p>
              <p>📞 Phone: {phone}</p>
              <p>✉️ Email: {email}</p>
              <p>🕒 Working Hours: Monday – Saturday, 8:30 AM to 3:30 PM</p>
            </div>
            <Button onClick={handleReset} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="studentName" className="text-xs font-semibold">
                  Student Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentName"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parentName" className="text-xs font-semibold">
                  Parent / Guardian Name
                </Label>
                <Input
                  id="parentName"
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Contact Mobile <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grade" className="text-xs font-semibold">
                Class / Grade Seeking Admission For
              </Label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Pre-Nursery / Toddler">Pre-Nursery / Toddler</option>
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
                <option value="Grade 11 (Humanities/Arts)">Grade 11 (Humanities/Arts)</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs font-semibold">
                Any Specific Questions / Requirement
              </Label>
              <Input
                id="message"
                placeholder="e.g. Transport required from South City / School timing questions"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full font-semibold gap-2 py-5" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Enquiry...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Admission Request
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
              <span className="flex items-center gap-1">
                <PhoneCall className="h-3 w-3 text-primary" /> Admissions: {phone}
              </span>
              <span>Mon-Sat (8:30 AM - 3:30 PM)</span>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
