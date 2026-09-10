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
    tag: "Eco Campus",
    description: "Sprawling 15-acre serene eco-campus with botanical gardens and solar energy.",
  },
  {
    id: 2,
    title: "Interactive 4K Smart Classrooms",
    category: "Smart Classrooms",
    image: "/images/smart-classroom.jpg",
    tag: "100% AV",
    description: "Daylight-filled classrooms fitted with 4K touch panels and 3D visual learning.",
  },
  {
    id: 3,
    title: "CBSE Science & Chemistry Research Lab",
    category: "Science & Labs",
    image: "/images/chemistry-lab.jpg",
    tag: "Safety Compliant",
    description: "Modern laboratory with precision microscopes, individual workstations & safety hoods.",
  },
  {
    id: 4,
    title: "Robotics, IoT & Artificial Intelligence Hub",
    category: "Science & Labs",
    image: "/images/stem-lab.jpg",
    tag: "Future Tech",
    description: "Equipped with 3D printers, Arduino modules, and hands-on coding sandboxes.",
  },
  {
    id: 5,
    title: "Olympic Grade Athletics Track & Sports Arena",
    category: "Sports & Fitness",
    image: "/images/sports-complex.jpg",
    tag: "NIS Certified",
    description: "400m synthetic running track, FIFA football pitch, basketball, and badminton.",
  },
  {
    id: 6,
    title: "Digital Research Pods & 25,000+ Volume Library",
    category: "Campus & Lawns",
    image: "/images/library.jpg",
    tag: "Knowledge Haven",
    description: "Air-conditioned study sanctuary with Kindle terminals and international journals.",
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
    <section id="gallery" className="py-8 sm:py-12 bg-muted/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 font-bold text-xs uppercase tracking-wider">
              Photo Gallery
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight text-slate-950 dark:text-white">
              Visual Tour of Our Campus Life
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-base font-medium">
              Explore our modern classrooms, STEM laboratories, athletic arenas, and green courtyards.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Link href="/gallery" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full font-bold text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5 h-11 rounded-xl">
                <span>View Full Gallery</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {onOpenEnquiry && (
              <Button onClick={onOpenEnquiry} className="w-full sm:w-auto font-bold gap-1.5 shadow-md h-11 rounded-xl">
                <Compass className="h-4 w-4" />
                <span>Book Campus Tour</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Category Pills - Smooth Scrollable on Mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeFilter === cat
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                  : "bg-background border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-card shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Image Container */}
              <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                {/* Floating Tag */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    {item.tag}
                  </span>
                </div>

                {/* Expand Overlay Button */}
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-7 w-7 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-md">
                    <Expand className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Bottom Image Info */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary-foreground/90 block">
                    {item.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white drop-shadow-md line-clamp-1">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Bottom Card Caption */}
              <div className="p-3 sm:p-4 bg-background flex-1 flex flex-col justify-between space-y-2">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-primary">
                  <span>Enlarge photo</span>
                  <Eye className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && filteredItems[activeLightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 text-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={prevImage}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors"
              title="Previous Photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors"
              title="Next Photo"
            >
              <ChevronRight className="h-5 w-5" />
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
            <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {filteredItems[activeLightboxIndex].category} • Photo {activeLightboxIndex + 1} of {filteredItems.length}
                </span>
                <span className="text-[11px] font-semibold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                  {filteredItems[activeLightboxIndex].tag}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {filteredItems[activeLightboxIndex].title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {filteredItems[activeLightboxIndex].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
