import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SchoolFaviconBootstrap } from "@/components/shared/school-favicon-bootstrap";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "School Fee Management System",
  description: "Professional School Fee Management ERP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SchoolFaviconBootstrap />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
