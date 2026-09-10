"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  Expand,
  Eye,
  GraduationCap,
  Sparkles,
  X,
} from "lucide-react";

interface CampusGalleryProps {
  onOpenEnquiry?: () => void;
}

export const galleryItems = [
  {
    id: 1,
    title: "15-Acre Lush Green Campus & Central Block",
    category: "Campus & Lawns",
    image: "/images/campus-hero.jpg",
    tag: "Eco-Friendly Infrastructure",
    description:
      "A sprawling 15-acre serene eco-campus equipped with wide courtyards, landscaped botanical gardens, and solar-powered facilities creating an inspiring learning atmosphere.",
  },
  {
    id: 2,
    title: "Next-Gen Interactive Smart Classroom",
    category: "Smart Classrooms",
    image: "/images/smart-classroom.jpg",
    tag: "100% AV Equipped",
    description:
      "Ergonomic, daylight-filled classrooms fitted with interactive 4K smart touch panels, 3D conceptual modeling, and digital attendance systems.",
  },
  {
    id: 3,
    title: "Advanced CBSE Chemistry & Science Research Lab",
    category: "Science & Labs",
    image: "/images/chemistry-lab.jpg",
    tag: "Safety Compliant",
    description:
      "Modern CBSE-standard research laboratory with precision optical microscopes, fume hoods, reagent safety cabinets, and hands-on experimental stations.",
  },
  {
    id: 4,
    title: "Robotics, IoT & Artificial Intelligence Hub",
    category: "Science & Labs",
    image: "/images/stem-lab.jpg",
    tag: "Future Tech",
    description:
      "Dedicated robotics workstation featuring 3D rapid prototyping printers, Arduino kits, humanoid robotic kits, and hands-on coding sandboxes.",
  },
  {
    id: 5,
    title: "Olympic Grade Athletics Track & Sports Arena",
    category: "Sports & Fitness",
    image: "/images/sports-complex.jpg",
    tag: "NIS Certified Coaches",
    description:
      "FIFA-grade football pitch, 400m synthetic running track, floodlit basketball and tennis courts, and indoor badminton and gymnastics arenas.",
  },
  {
    id: 6,
    title: "Digital Research Pods & 25,000+ Volume Library",
    category: "Campus & Lawns",
    image: "/images/library.jpg",
    tag: "Knowledge Haven",
    description:
      "A quiet, air-conditioned sanctuary with ergonomic study pods, thousands of physical books, digital Kindle terminals, and curated global journal subscriptions.",
  },
];

export function CampusGallery({ onOpenEnquiry }: CampusGalleryProps) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const categories = ["All", "Campus & Lawns", "Smart Classrooms", "Science & Labs", "Sports & Fitness"];

  const filteredItems =
    activeFilter === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeFilter);

  const openLightbox = (index: number) => {
    setActiveLightboxIndex(index);
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
  };

  const nextImage = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((activeLightboxIndex + 1) % filteredItems.length);
    }
  };

  const prevImage = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((activeLightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <section id="gallery" className="py-10 sm:py-14 bg-muted/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-bold text-xs uppercase tracking-wider">
              Campus Showcase
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
              Visual Tour of Our Campus Life
            </h2>
            <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base font-medium leading-relaxed">
              Explore our world-class infrastructure, interactive classrooms, STEM laboratories, and athletic complexes designed to foster holistic student development.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/gallery">
              <Button variant="outline" className="font-bold text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2">
                <span>View Full Gallery</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {onOpenEnquiry && (
              <Button onClick={onOpenEnquiry} className="font-bold gap-2 shadow-md">
                <Compass className="h-4 w-4" />
                <span>Book Campus Visit</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeFilter === cat
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                  : "bg-background border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-card shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col"
            >
              {/* Image Container */}
              <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Floating Tag */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    {item.tag}
                  </span>
                </div>

                {/* Expand Overlay Button */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-8 w-8 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-md">
                    <Expand className="h-4 w-4" />
                  </div>
                </div>

                {/* Bottom Image Info */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-primary-foreground/90 block mb-0.5">
                    {item.category}
                  </span>
                  <h3 className="text-base font-bold text-white drop-shadow-md line-clamp-1 group-hover:text-primary-foreground transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Bottom Card Caption */}
              <div className="p-4 bg-background flex-1 flex flex-col justify-between">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Click to enlarge photo</span>
                  <Eye className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && filteredItems[activeLightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
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
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors"
              title="Previous Photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors"
              title="Next Photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Main Lightbox Image */}
            <div className="relative aspect-[16/10] w-full bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={filteredItems[activeLightboxIndex].image}
                alt={filteredItems[activeLightboxIndex].title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Lightbox Details Bar */}
            <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {filteredItems[activeLightboxIndex].category} • Photo {activeLightboxIndex + 1} of {filteredItems.length}
                </span>
                <span className="text-xs font-semibold bg-primary/20 text-primary px-3 py-1 rounded-full">
                  {filteredItems[activeLightboxIndex].tag}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                {filteredItems[activeLightboxIndex].title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                {filteredItems[activeLightboxIndex].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
