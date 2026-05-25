import type { UserRole } from "@/types/mapable";

export type MapAbleAppMenuItem = {
  href: string;
  label: string;
  description: string;
  imageSrc: string;
  adminOnly?: boolean;
};

export const MAPABLE_APP_MENU_ITEMS: MapAbleAppMenuItem[] = [
  {
    href: "/core",
    label: "MapAble",
    description: "Return to the MapAble hub",
    imageSrc: "/images/mapable-modules/mapable-main.png",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Your MapAble account home",
    imageSrc: "/images/mapable-modules/mapable-dashboard.png",
  },
  {
    href: "/peer",
    label: "Peer",
    description: "Safe lived-experience peer support",
    imageSrc: "/images/mapable-modules/mapable-main.png",
  },
  {
    href: "/care",
    label: "Care",
    description: "Care requests, bookings, and support",
    imageSrc: "/images/mapable-modules/mapable-care.png",
  },
  {
    href: "/transport",
    label: "Transport",
    description: "Accessible trips and transport",
    imageSrc: "/images/mapable-modules/mapable-transport.png",
  },
  {
    href: "/provider-finder",
    label: "Marketplace",
    description: "Find accessible providers and services",
    imageSrc: "/images/mapable-modules/mapable-marketplace.png",
  },
  {
    href: "/dashboard/jobs",
    label: "Jobs",
    description: "Inclusive employment pathways",
    imageSrc: "/images/mapable-modules/mapable-jobs.png",
  },
  {
    href: "/foods",
    label: "Foods",
    description: "Accessible meals and food support",
    imageSrc: "/images/mapable-modules/mapable-foods.png",
  },
  {
    href: "/admin",
    label: "Admin",
    description: "MapAble operations console",
    imageSrc: "/images/mapable-modules/mapable-main.png",
    adminOnly: true,
  },
  {
    href: "/dashboard/support",
    label: "Support",
    description: "Get help from MapAble",
    imageSrc: "/images/mapable-modules/mapable-main.png",
  },
];

export function getMapAbleAppMenuItems(role?: UserRole | "mapable_admin") {
  const isAdmin = role === "mapable_admin";
  return MAPABLE_APP_MENU_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.href === "/dashboard/support") return !isAdmin;
    return true;
  }).slice(0, 9);
}
