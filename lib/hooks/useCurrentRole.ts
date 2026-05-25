"use client";

import { useSession } from "next-auth/react";

import type { UserRole } from "@/types/mapable";

export function useCurrentRole(): UserRole | null {
  const { data } = useSession();
  const role = data?.user?.role;
  return (role as UserRole | undefined) ?? null;
}
