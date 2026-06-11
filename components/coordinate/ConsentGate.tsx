"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { Button } from "@/components/ui/button";

export function ConsentGate({
  active,
  message,
  children,
}: {
  active: boolean;
  message: string;
  children: ReactNode;
}) {
  if (active) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-4">
      <AuthAlert variant="warning">{message}</AuthAlert>
      <Button asChild variant="outline" size="default" className="min-h-11">
        <Link href="/dashboard/consent">Manage consent</Link>
      </Button>
    </div>
  );
}
