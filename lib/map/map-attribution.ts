import { getMapConfig } from "@/lib/map/map-config";

const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function getMapAttributionHtml(): string {
  const config = getMapConfig();
  return config.NEXT_PUBLIC_MAP_ATTRIBUTION ?? DEFAULT_ATTRIBUTION;
}

export function getMapAttributionPlainText(): string {
  return getMapAttributionHtml()
    .replace(/<[^>]+>/g, "")
    .replace(/&copy;/g, "©")
    .trim();
}
