import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Dirt Log - PS Civil",
  description: "Fill material tracking for Petticoat-Schmitt Civil Contractors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-ps-gray-50 text-ps-gray-700 antialiased">
        {/* Header */}
        <header className="bg-ps-navy text-white shadow-md sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ps-lime rounded-lg flex items-center justify-center font-bold text-ps-navy text-lg">
                DL
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Dirt Log</h1>
                <p className="text-xs text-ps-gray-300">PS Civil Contractors</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-4 py-4">
          {children}
        </main>

        {/* Bottom navigation */}
        <Navigation />
      </body>
    </html>
  );
}
