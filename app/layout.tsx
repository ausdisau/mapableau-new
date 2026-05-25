import "@/app/index.css";
import "leaflet/dist/leaflet.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { PwaProviders } from "@/components/pwa/PwaProviders";

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

export const metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default" as const,
    title: "MapAble",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#0b6e99",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <body className={plusJakarta.className}>
        <Providers>
          <PwaProviders>{children}</PwaProviders>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
