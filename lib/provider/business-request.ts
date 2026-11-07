import { headers } from "next/headers";

import {
  BUSINESS_HOST_REQUEST_HEADER,
  isBusinessHost,
  resolveBusinessHost,
} from "@/lib/provider/business-host-routing";

/** True when the request was rewritten for business.mapable.com.au. */
export async function isBusinessHostRequest(): Promise<boolean> {
  const h = await headers();
  if (h.get(BUSINESS_HOST_REQUEST_HEADER) === "1") return true;
  return isBusinessHost(
    h.get("x-forwarded-host"),
    h.get("host"),
    resolveBusinessHost(),
  );
}
