import "@/app/index.css";
import "leaflet/dist/leaflet.css";

import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { NetworkStatusProvider } from "@/components/pwa/NetworkStatusProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: {
    default: "MapAble",
    template: "%s | MapAble",
  },
  description:
    "Accessible care, transport, jobs and support in one place.",
  applicationName: "MapAble",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MapAble",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#003F88",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <body className={plusJakarta.className}>
        <Providers>
          <NetworkStatusProvider>{children}</NetworkStatusProvider>
        </Providers>
        <ServiceWorkerRegister />
        <SpeedInsights />
      </body>
    </html>
  );
}
