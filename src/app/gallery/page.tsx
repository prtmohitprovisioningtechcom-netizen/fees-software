"use client";

import { useState } from "react";
import Link from "next/link";
import { useBranding } from "@/lib/branding-context";
import { getSchoolDisplayName, cleanSchoolName } from "@/lib/school-branding";
import { SchoolNavbar } from "@/components/home/school-navbar";
import { NoticeTicker } from "@/components/home/notice-ticker";
import { SchoolFooter } from "@/components/home/school-footer";
import { AdmissionInquiryModal } from "@/components/home/admission-inquiry-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Expand,
  Eye,
  GraduationCap,
  Maximize2,
  PhoneCall,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

interface GalleryPhoto {
  id: number;
  title: string;
  category: string;
  image: string;
  tag: string;
  date: string;
  description: string;
}

const fullGalleryData: GalleryPhoto[] = [
  {
    id: 1,
    title: "15-Acre Eco-Friendly Green Campus & Main Academic Block",
    category: "Campus & Architecture",
    image: "/images/campus-hero.jpg",
    tag: "Eco Campus",
    date: "Academic Year 2025–26",
    description:
      "A serene 15-acre green environment with landscaped botanical gardens, wide open courtyards, solar arrays, and clean air filtration systems creating a healthy learning haven.",
  },
  {
    id: 2,
    title: "Next-Generation Interactive 4K Smart Classrooms",
    category: "Smart Classrooms",
    image: "/images/smart-classroom.jpg",
    tag: "100% AV Equipped",
    date: "Primary & Senior Wings",
    description:
      "Modern ergonomic classrooms equipped with 4K touch displays, 3D educational animations, recorded lecture archives, and digital attendance tracking.",
  },
  {
    id: 3,
    title: "Advanced CBSE Chemistry & Hands-on Science Research Lab",
    category: "Science & Robotics",
    image: "/images/chemistry-lab.jpg",
    tag: "CBSE Standard",
    date: "Senior Secondary Lab",
    description:
      "State-of-the-art laboratory with digital balances, precision microscopes, individual chemical reagent racks, safety fume hoods, and expert teacher mentorship.",
  },
  {
    id: 4,
    title: "Robotics, IoT & Artificial Intelligence Innovation Centre",
    category: "Science & Robotics",
    image: "/images/stem-lab.jpg",
    tag: "Future Ready",
    date: "STEM Wing",
    description:
      "Hands-on workshop featuring 3D rapid prototyping printers, programmable Arduino modules, humanoid robotics kits, and Python coding workstations.",
  },
  {
    id: 5,
    title: "Olympic Standard Synthetic Running Track & Football Arena",
    category: "Sports & Athletics",
    image: "/images/sports-complex.jpg",
    tag: "Olympic Grade",
    date: "Sports Complex",
    description:
      "400-meter all-weather synthetic running track, FIFA-standard lush football pitch, floodlit basketball arenas, and dedicated coaching by NIS-certified national coaches.",
  },
  {
    id: 6,
    title: "Digital Research Sanctuary & 25,000+ Volume Library",
    category: "Library & Study",
    image: "/images/library.jpg",
    tag: "Knowledge Centre",
    date: "Central Library",
    description:
      "Quiet, air-conditioned study environment offering private wooden research pods, Kindle e-book stations, reference books, and subscriptions to leading educational journals.",
  },
];

export default function GalleryPage() {
  const { branding } = useBranding();
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const schoolDisplayName = getSchoolDisplayName(branding) || "A.K. Sunshine Convent School";
  const cleanName = cleanSchoolName(schoolDisplayName);

  const categories = [
    "All",
    "Campus & Architecture",
    "Smart Classrooms",
    "Science & Robotics",
    "Sports & Athletics",
    "Library & Study",
  ];

  const filteredPhotos =
    activeFilter === "All"
      ? fullGalleryData
      : fullGalleryData.filter((photo) => photo.category === activeFilter);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
    }
  };

  const prevPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <SchoolNavbar branding={branding} onOpenEnquiry={() => setAdmissionModalOpen(true)} />
      <NoticeTicker onOpenEnquiry={() => setAdmissionModalOpen(true)} />

      <main className="flex-1">
        {/* Gallery Hero Section */}
        <section className="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-12 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
              <Camera className="h-3.5 w-3.5" />
              <span>Campus Photography & Media Archives</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-tight">
              Life and Learning at{" "}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {cleanName}
              </span>
            </h1>

            <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
              Step inside our vibrant campus. Experience our modern smart classrooms, cutting-edge science and robotics laboratories, Olympic-grade sports facilities, and lush eco-spaces.
            </p>

            {/* Quick Stat Highlights */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="px-3.5 py-1.5 rounded-full bg-background border border-slate-200 dark:border-slate-800 shadow-sm">
                🌿 15-Acre Eco-Campus
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-background border border-slate-200 dark:border-slate-800 shadow-sm">
                💻 100% Smart Classrooms
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-background border border-slate-200 dark:border-slate-800 shadow-sm">
                🔬 Advanced Science & AI Hub
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-background border border-slate-200 dark:border-slate-800 shadow-sm">
                🏅 400m Synthetic Running Track
              </span>
            </div>
          </div>
        </section>

        {/* Filter and Photo Grid */}
        <section className="py-10 sm:py-14 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeFilter === cat
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]"
                      : "bg-muted/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => openLightbox(index)}
                  className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-card shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col"
                >
                  {/* Image View */}
                  <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.image}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                    {/* Tag Top Left */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        {photo.tag}
                      </span>
                    </div>

                    {/* Expand Icon Top Right */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-8 w-8 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-md">
                        <Expand className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Overlay Bottom */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-primary-foreground/90 block mb-0.5">
                        {photo.category}
                      </span>
                      <h3 className="text-base font-bold text-white drop-shadow-md line-clamp-1 group-hover:text-primary-foreground transition-colors">
                        {photo.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Description */}
                  <div className="p-4 bg-background flex-1 flex flex-col justify-between border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {photo.description}
                    </p>
                    <div className="flex items-center justify-between text-xs font-bold text-primary pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">{photo.date}</span>
                      <span className="flex items-center gap-1">
                        Enlarge <Eye className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Campus Tour Invitation Card */}
            <div className="mt-8 rounded-3xl bg-gradient-to-r from-primary/10 via-blue-600/10 to-indigo-600/10 border border-primary/25 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-950 dark:text-white">
                  Want to Experience Our Campus in Person?
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 max-w-xl">
                  We welcome parents and students for guided walkthroughs of classrooms, labs, libraries, and athletic grounds with our admissions faculty.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  onClick={() => setAdmissionModalOpen(true)}
                  size="lg"
                  className="font-bold gap-2 rounded-2xl shadow-lg shadow-primary/25"
                >
                  <Compass className="h-4 w-4" />
                  <span>Book Campus Tour</span>
                </Button>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="font-bold text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl"
                  >
                    <span>Contact Office</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Lightbox Dialog */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors"
              title="Previous Photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors"
              title="Next Photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Main Lightbox Image */}
            <div className="relative aspect-[16/10] w-full bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={filteredPhotos[lightboxIndex].image}
                alt={filteredPhotos[lightboxIndex].title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Lightbox Details Bar */}
            <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {filteredPhotos[lightboxIndex].category} • Photo {lightboxIndex + 1} of {filteredPhotos.length}
                </span>
                <span className="text-xs font-semibold bg-primary/20 text-primary px-3 py-1 rounded-full">
                  {filteredPhotos[lightboxIndex].tag}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                {filteredPhotos[lightboxIndex].title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                {filteredPhotos[lightboxIndex].description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <SchoolFooter branding={branding} onOpenEnquiry={() => setAdmissionModalOpen(true)} />

      {/* Admission Inquiry Modal */}
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
