"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { settingsApi } from "@/lib/api";
import { applySchoolFavicon, cacheSchoolFavicon } from "@/lib/school-favicon";
import {
  cacheSchoolBranding,
  getCachedSchoolBranding,
  parseSchoolBranding,
} from "@/lib/school-branding";
import type { SchoolBranding } from "@/types";

interface BrandingContextValue {
  branding: SchoolBranding;
  loaded: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<SchoolBranding>(() => getCachedSchoolBranding());
  const [loaded, setLoaded] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = (await settingsApi.getBranding()) as { data?: Partial<SchoolBranding> };
      setBranding(parseSchoolBranding(res.data));
    } catch {
      // Keep cached branding when the network is temporarily unavailable.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loaded) return;
    applySchoolFavicon(branding.logo);
    cacheSchoolFavicon(branding.logo);
    cacheSchoolBranding(branding);
  }, [branding, loaded]);

  return (
    <BrandingContext.Provider value={{ branding, loaded, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return context;
}
