import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Shield, Plus, History, BarChart2 } from "lucide-react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Merchant Risk Agent",
    template: "%s | Merchant Risk Agent",
  },
  description:
    "AI-powered UPI merchant fraud risk classifier that evaluates 7 fraud policies using 4 investigative tools in real-time.",
  keywords: [
    "merchant risk",
    "fraud detection",
    "UPI",
    "risk assessment",
    "AI agent",
    "compliance",
  ],
  authors: [{ name: "Ronak Radadiya" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Merchant Risk Agent",
    description:
      "AI-powered UPI merchant fraud risk classifier — 7 policies, 4 tools, real-time verdicts.",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Merchant Risk Agent",
    description:
      "AI-powered UPI merchant fraud risk classifier — 7 policies, 4 tools, real-time verdicts.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geistSans.variable, geistMono.variable)}>
      <body className="antialiased min-h-screen bg-background">
        <Providers>
          <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg">
            <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
              <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="h-4.5 w-4.5 text-white" />
                </div>
                <span>Merchant Risk Agent</span>
              </Link>
              <div className="flex gap-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                >
                  <Plus className="h-4 w-4" />
                  New Review
                </Link>
                <Link
                  href="/history"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                >
                  <History className="h-4 w-4" />
                  History
                </Link>
                <Link
                  href="/analytics"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                >
                  <BarChart2 className="h-4 w-4" />
                  Analytics
                </Link>
              </div>
            </div>
          </nav>
          <main className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
