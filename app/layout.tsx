import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rotation Compass | Climate-Aware Crop Rotation Planning",
  description: "Transparent agronomic decision support with historical NASA environmental data for Ludhiana, Punjab.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
