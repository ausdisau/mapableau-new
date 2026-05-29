import { isSafeRedirect } from "@/lib/auth/safe-redirect";

export function buildRegisterRedirect(
  email: string,
  callbackUrl?: string
): string {
  const params = new URLSearchParams({ email });
  if (callbackUrl && isSafeRedirect(callbackUrl)) {
    params.set("callbackUrl", callbackUrl);
  }
  return `/register?${params.toString()}`;
}
