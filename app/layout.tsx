import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rotation Compass | Climate-Aware Crop Rotation Planning",
  description: "Transparent agronomic decision support using historical NASA environmental data for Ludhiana, Punjab (NASA Space Apps Challenge 2026).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#f8faf8] text-[#1c2621] font-sans selection:bg-forest-100 selection:text-forest-900 antialiased">
        {children}
      </body>
    </html>
  );
}
