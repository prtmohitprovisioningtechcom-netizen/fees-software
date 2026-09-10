"use client";

import { useState } from "react";
import { useBranding } from "@/lib/branding-context";
import { getSchoolDisplayName } from "@/lib/school-branding";
import { SchoolNavbar } from "@/components/home/school-navbar";
import { NoticeTicker } from "@/components/home/notice-ticker";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesAndAcademics } from "@/components/home/features-and-academics";
import { CampusLifeAndFacilities } from "@/components/home/campus-life-and-facilities";
import { CampusGallery } from "@/components/home/campus-gallery";
import { PrincipalDesk } from "@/components/home/principal-desk";
import { TestimonialsAndFAQ } from "@/components/home/testimonials";
import { SchoolFooter } from "@/components/home/school-footer";
import { AdmissionInquiryModal } from "@/components/home/admission-inquiry-modal";

export default function HomePage() {
  const { branding } = useBranding();
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);

  const schoolDisplayName = getSchoolDisplayName(branding) || "Apex International Academy";

  const handleOpenEnquiry = () => {
    setAdmissionModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation */}
      <SchoolNavbar branding={branding} onOpenEnquiry={handleOpenEnquiry} />

      {/* Live Breaking Notices & Announcements */}
      <NoticeTicker onOpenEnquiry={handleOpenEnquiry} />

      {/* Main Homepage Sections */}
      <main className="flex-1">
        {/* Hero Banner with Stats & Visuals */}
        <HeroSection schoolName={schoolDisplayName} onOpenEnquiry={handleOpenEnquiry} />

        {/* Academics, Wings & Core Pillars */}
        <FeaturesAndAcademics onOpenEnquiry={handleOpenEnquiry} />

        {/* Campus Facilities Showcase (STEM, Sports, Library, Lawns) */}
        <CampusLifeAndFacilities onOpenEnquiry={handleOpenEnquiry} />

        {/* Campus Visual Photo Gallery Showcase */}
        <CampusGallery onOpenEnquiry={handleOpenEnquiry} />

        {/* Message from the Principal's Desk */}
        <PrincipalDesk schoolName={schoolDisplayName} onOpenEnquiry={handleOpenEnquiry} />

        {/* Parent & Alumni Testimonials + Common FAQs */}
        <TestimonialsAndFAQ />
      </main>

      {/* Institutional School Footer */}
      <SchoolFooter branding={branding} onOpenEnquiry={handleOpenEnquiry} />

      {/* Interactive Admission Inquiry Modal Dialog */}
      <AdmissionInquiryModal
        open={admissionModalOpen}
        onOpenChange={setAdmissionModalOpen}
        schoolName={schoolDisplayName}
        phone={branding.phone || "+91 98765 43210"}
        email={branding.email || "admissions@school.edu.in"}
      />
    </div>
  );
}
