import type { MetadataRoute } from "next";

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
    background_color: "#f5f8fb",
    theme_color: "#003F88",
    categories: ["health", "lifestyle", "productivity", "navigation"],
    icons: [
      {
        src: "/icons/mapable-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/mapable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/mapable-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/mapable-maskable-512.png",
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
        description: "Search NDIS and care providers near you",
      },
      {
        name: "Messages",
        short_name: "Messages",
        url: "/dashboard/messages",
        description: "Secure messages",
      },
      {
        name: "Book transport",
        short_name: "Transport",
        url: "/dashboard/transport/new",
        description: "Book accessible transport",
      },
      {
        name: "My schedule",
        short_name: "Schedule",
        url: "/dashboard/bookings",
        description: "Upcoming bookings and supports",
      },
      {
        name: "Emergency profile",
        short_name: "Emergency",
        url: "/emergency",
        description: "Emergency profile and contacts",
      },
    ],
  };
}
