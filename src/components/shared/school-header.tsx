import { School } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSchoolDisplayName, hasSchoolContact } from "@/lib/school-branding";
import type { SchoolBranding } from "@/types";

type SchoolHeaderProps = {
  branding: SchoolBranding;
  subtitle?: string;
  variant?: "receipt" | "compact" | "preview";
  showLogo?: boolean;
  className?: string;
};

export function SchoolHeader({
  branding,
  subtitle,
  variant = "receipt",
  showLogo = false,
  className,
}: SchoolHeaderProps) {
  const isReceipt = variant === "receipt";
  const isCompact = variant === "compact";
  const isPreview = variant === "preview";
  const name = getSchoolDisplayName(branding);
  const showAppTagline =
    Boolean(branding.schoolName.trim()) &&
    Boolean(branding.appName.trim()) &&
    branding.schoolName.trim() !== branding.appName.trim();

  return (
    <div
      className={cn(
        isReceipt && "text-center border-b-2 border-gray-800 pb-3 mb-4",
        isCompact && "w-full",
        isPreview && "rounded-lg border bg-muted/40 p-4 text-center",
        className
      )}
    >
      {showLogo && (
        <div
          className={cn(
            "mx-auto flex items-center justify-center overflow-hidden rounded-lg bg-primary",
            isReceipt ? "mb-2 h-14 w-14" : isCompact ? "mb-2 h-10 w-10" : "mb-3 h-16 w-16"
          )}
        >
          {branding.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo} alt="School logo" className="h-full w-full object-cover" />
          ) : (
            <School
              className={cn(
                "text-primary-foreground",
                isReceipt ? "h-7 w-7" : isCompact ? "h-5 w-5" : "h-8 w-8"
              )}
            />
          )}
        </div>
      )}

      {name ? (
        <h1
          className={cn(
            "font-bold normal-case break-words whitespace-normal leading-snug",
            isReceipt && "text-xl text-gray-900 px-1",
            isCompact && "text-[13px] text-sidebar-foreground",
            isPreview && "text-lg text-foreground"
          )}
        >
          {name}
        </h1>
      ) : null}

      {showAppTagline ? (
        <p
          className={cn(
            "break-words whitespace-normal",
            isReceipt && "text-xs text-gray-600 mt-1 px-1",
            isCompact && "text-[10px] text-sidebar-foreground/60 mt-0.5",
            isPreview && "text-xs text-muted-foreground mt-1"
          )}
        >
          {branding.appName}
        </p>
      ) : null}

      {hasSchoolContact(branding) ? (
        <div
          className={cn(
            "space-y-0.5 break-words whitespace-normal",
            isReceipt && "mt-2 text-[11px] leading-relaxed text-gray-600",
            isCompact && "mt-1.5 text-[10px] leading-snug text-sidebar-foreground/55",
            isPreview && "mt-2 text-xs text-muted-foreground space-y-1"
          )}
        >
          {branding.address ? <p>{branding.address}</p> : null}
          {branding.phone ? (
            <p>{isReceipt || isPreview ? `Phone: ${branding.phone}` : branding.phone}</p>
          ) : null}
          {branding.email ? (
            <p className="break-all">{isReceipt || isPreview ? `Email: ${branding.email}` : branding.email}</p>
          ) : null}
        </div>
      ) : null}

      {subtitle ? (
        <p
          className={cn(
            "font-semibold",
            isReceipt && "text-sm text-gray-600 mt-2",
            isCompact && "text-[10px] text-sidebar-foreground/50 mt-1",
            isPreview && "text-sm text-foreground mt-3"
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
