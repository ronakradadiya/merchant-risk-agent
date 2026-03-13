import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/lib/providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <Providers>
          <nav className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <a href="/" className="text-xl font-bold text-gray-900">
                Merchant Risk Agent
              </a>
              <div className="flex gap-6 text-sm font-medium text-gray-600">
                <a href="/" className="hover:text-gray-900">New Review</a>
                <a href="/history" className="hover:text-gray-900">History</a>
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
