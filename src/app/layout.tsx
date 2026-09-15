import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sprigs } from "@/components/Sprigs";
import { Petals } from "@/components/Petals";

export const metadata: Metadata = {
  title: "Somewhere With You",
  description:
    "A shared itinerary and diary for two. Plans, the lists that go with them, and afterwards, what it was actually like.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Somewhere", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCF4F6" },
    { media: "(prefers-color-scheme: dark)", color: "#160E13" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400;1,6..96,500&family=Karla:wght@400;500;700&family=Caveat:wght@400;600&display=swap"
        />
      </head>
      <body>
        <Sprigs />
        <Petals />
        {children}
      </body>
    </html>
  );
}
