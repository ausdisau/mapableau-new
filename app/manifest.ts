import type { MetadataRoute } from "next";

const ICONS_BASE = "/icons";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MapAble",
    short_name: "MapAble",
    description:
      "Accessible care, transport, jobs and support in one place.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#0b6e99",
    categories: ["health", "lifestyle", "productivity", "navigation"],
    icons: [
      {
        src: `${ICONS_BASE}/mapable-icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${ICONS_BASE}/mapable-icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${ICONS_BASE}/mapable-maskable-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${ICONS_BASE}/mapable-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Find providers",
        short_name: "Find",
        url: "/provider-finder",
        description: "Search NDIS and disability support providers",
      },
      {
        name: "Messages",
        short_name: "Messages",
        url: "/dashboard/messages",
        description: "Communication centre",
      },
      {
        name: "Book transport",
        short_name: "Transport",
        url: "/dashboard/transport/new",
        description: "Book an accessible transport trip",
      },
      {
        name: "My schedule",
        short_name: "Schedule",
        url: "/dashboard",
        description: "Upcoming bookings and supports",
      },
      {
        name: "Emergency profile",
        short_name: "Emergency",
        url: "/dashboard",
        description: "Emergency and safety information",
      },
    ],
  };
}
