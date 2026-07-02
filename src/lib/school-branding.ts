import type { SchoolBranding } from "@/types";

export const emptySchoolBranding = (): SchoolBranding => ({
  schoolName: "",
  appName: "",
  logo: "",
  address: "",
  phone: "",
  email: "",
});

export function parseSchoolBranding(data?: Partial<SchoolBranding> | null): SchoolBranding {
  return {
    schoolName: data?.schoolName?.trim() || "",
    appName: data?.appName?.trim() || "",
    logo: data?.logo || "",
    address: data?.address?.trim() || "",
    phone: data?.phone?.trim() || "",
    email: data?.email?.trim() || "",
  };
}

export function getSchoolDisplayName(branding: SchoolBranding) {
  return branding.schoolName.trim() || branding.appName.trim();
}

/** Full school name for receipts and UI — always prefer the School Name field from settings. */
export function getReceiptSchoolName(branding: SchoolBranding) {
  return getSchoolDisplayName(branding);
}

export function hasSchoolContact(branding: SchoolBranding) {
  return Boolean(branding.address || branding.phone || branding.email);
}
