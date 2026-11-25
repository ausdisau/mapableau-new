import { NextResponse, type NextRequest } from "next/server";

import {
  readRegistrationCookie,
  registrationCookie,
} from "@/lib/auth/adid-registration";

export function GET(request: NextRequest) {
  const context = readRegistrationCookie(
    request.cookies.get(registrationCookie)?.value,
  );
  const res = NextResponse.redirect(
    new URL(context?.destination ?? "/dashboard", request.url),
  );
  res.cookies.delete(registrationCookie);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
