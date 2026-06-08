import "@/app/index.css";
import "leaflet/dist/leaflet.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { AdSenseScript } from "@/components/ads/AdSenseScript";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  other: {
    "purpleads-verification": "832ea0b13123578b63ae2fe9",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <head>
        <meta
          name="purpleads-verification"
          content="832ea0b13123578b63ae2fe9"
        />
      </head>
      <body className={plusJakarta.className}>
        <AdSenseScript />
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
