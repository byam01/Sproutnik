import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sproutnik | Climate-Smart Crop Rotation & Agricultural Advisory Platform",
  description: "Evidence-based agronomic decision support using 10-year historical NASA POWER satellite observations and PAU agricultural benchmarks for the Indo-Gangetic Plains (NASA Space Apps Challenge 2026).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${manrope.variable}`}>
      <body className="min-h-full bg-[#f8faf8] text-[#1c2621] font-sans selection:bg-forest-100 selection:text-forest-900 antialiased">
        {children}
      </body>
    </html>
  );
}
