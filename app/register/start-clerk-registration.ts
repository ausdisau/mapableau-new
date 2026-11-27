"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdidConfig } from "@/lib/auth/adid-config";
import {
  registrationCookie,
  registrationDestination,
} from "@/lib/auth/adid-registration";

export async function startClerkRegistration(form: FormData) {
  const config = getAdidConfig();
  if (!config) redirect("/register");
  const destination = registrationDestination(
    form.get("callbackUrl"),
    form.get("inviteToken"),
  );
  const region = form.get("jurisdiction") === "NZ" ? "NZ" : "AU";
  const jar = await cookies();
  jar.set(registrationCookie, JSON.stringify({ destination, region }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1800,
    secure: process.env.NODE_ENV === "production",
  });
  redirect(new URL("/sign-up?service=mapable", config.portal).href);
}
