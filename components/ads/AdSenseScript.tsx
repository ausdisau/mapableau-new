import Script from "next/script";

import { getAdSenseSkyscraperConfig } from "@/lib/ads/adsense-config";

export function AdSenseScript() {
  const config = getAdSenseSkyscraperConfig();
  if (!config) return null;

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
