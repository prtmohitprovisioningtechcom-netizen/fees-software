"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { settingsApi } from "@/lib/api";
import { applySchoolFavicon, cacheSchoolFavicon } from "@/lib/school-favicon";
import { emptySchoolBranding, parseSchoolBranding } from "@/lib/school-branding";
import type { SchoolBranding } from "@/types";

interface BrandingContextValue {
  branding: SchoolBranding;
  loaded: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<SchoolBranding>(emptySchoolBranding());
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = (await settingsApi.get()) as { data?: Partial<SchoolBranding> };
      setBranding(parseSchoolBranding(res.data));
    } catch {
      setBranding(emptySchoolBranding());
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
  }, [branding.logo, loaded]);

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
