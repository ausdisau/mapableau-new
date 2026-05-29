import { isWixConfigured, isWixEnabled } from "@/lib/auth/wix/wix-config";

export async function getWixAdminStatus() {
  if (!isWixEnabled()) {
    return {
      enabled: false,
      configured: false,
      message: "Set WIX_ENABLED=true and NEXT_PUBLIC_WIX_ENABLED=true to enable",
    };
  }

  if (!isWixConfigured()) {
    return {
      enabled: true,
      configured: false,
      message: "Wix enabled but missing WIX_CLIENT_ID or redirect URIs",
    };
  }

  return {
    enabled: true,
    configured: true,
    message: "Wix Headless Members bridge active",
  };
}
