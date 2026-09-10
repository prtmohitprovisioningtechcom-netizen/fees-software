"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
}

/** One-step browser history back only — no parent redirects. */
export function BackButton({ className }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Back"
      title="Back"
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground hover:text-foreground hover:bg-muted/70",
        "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
    </button>
  );
}
