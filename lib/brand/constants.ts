import {
  MAPABLE_WIX_SITE_URL,
  MAPABLE_WIX_SITE_URL_ALT,
} from "@/lib/integrations/wix/config";

/** Primary marketing site on Wix (Pymble). */
export const MAPABLE_WIX_MARKETING_URL = MAPABLE_WIX_SITE_URL;

/** Legacy / alternate marketing host. */
export const MAPABLE_MARKETING_URL = "https://mapable.com.au";

export const MAPABLE_MARKETING_URLS = [
  MAPABLE_WIX_MARKETING_URL,
  MAPABLE_WIX_SITE_URL_ALT,
  MAPABLE_MARKETING_URL,
  "https://www.mapable.com.au",
] as const;

export const MAPABLE_TAGLINE =
  "Enabling people with disabilities to live independent and dignified lives through innovative technology in care, transport, and employment.";

export const MAPABLE_SUPPORT_EMAIL = "support@mapable.com.au";

/**
 * Official MapAble wordmark (Accessible Australia Logo Design).
 * Source file: G:\Operations\MapAble\UI\Accessible Australia Logo Design.png
 * To update: copy that PNG over public/brand/accessible-australia-logo.png
 */
export const MAPABLE_LOGO_SRC = "/brand/accessible-australia-logo.png";

/** Pin + Australia mark for compact headers with separate text. */
export const MAPABLE_LOGO_MARK_SRC = "/brand/mapable-logo-mark.svg";

export const MAPABLE_LOGO_ALT = "MapAble — Empowering Independence";
