import type { Metadata, Viewport } from "next";
import { StructuredData } from "@/components/StructuredData";
import "./globals.css";

const SITE = "https://grenfell.memorial";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Grenfell Tower Digital Memorial — Explore the Tower in 3D",
    template: "%s · Grenfell Tower Digital Memorial",
  },
  description:
    "An educational 3D reconstruction of Grenfell Tower as built in 1974. " +
    "Explore the architecture and leave a tribute. In memory of the 72 people " +
    "who lost their lives, 14 June 2017.",
  keywords: [
    "Grenfell Tower",
    "Grenfell memorial",
    "Grenfell Tower memorial",
    "Grenfell Tower 3D model",
    "Grenfell Tower architecture",
    "Lancaster West Estate",
    "North Kensington",
    "digital memorial",
  ],
  alternates: { canonical: SITE },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Grenfell Tower Digital Memorial",
    title: "Grenfell Tower Digital Memorial",
    description:
      "Explore Grenfell Tower in 3D and leave a tribute. In memory of the 72.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Grenfell Tower Digital Memorial — In memory of the 72",
      },
    ],
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grenfell Tower Digital Memorial",
    description: "Explore the tower in 3D and leave a tribute. In memory of the 72.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  other: { "format-detection": "telephone=no" },
};

export const viewport: Viewport = { themeColor: "#f0eee9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <StructuredData />
      </head>
      <body>{children}</body>
    </html>
  );
}
