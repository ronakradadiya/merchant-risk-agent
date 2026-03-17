import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Shield } from "lucide-react";

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
  title: "Merchant Risk Agent",
  description: "AI-powered UPI merchant fraud risk classifier",
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
          <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <Shield className="h-5 w-5" />
                Merchant Risk Agent
              </Link>
              <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                  New Review
                </Link>
                <Link href="/history" className="hover:text-foreground transition-colors">
                  History
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
