"use client";

import { useEffect } from "react";
import { applySchoolFavicon, getCachedSchoolFavicon } from "@/lib/school-favicon";

export function SchoolFaviconBootstrap() {
  useEffect(() => {
    const cached = getCachedSchoolFavicon();
    if (cached) applySchoolFavicon(cached);
  }, []);

  return null;
}
