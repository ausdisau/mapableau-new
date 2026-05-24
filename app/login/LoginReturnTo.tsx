"use client";

import { useSearchParams } from "next/navigation";

export default function LoginReturnTo({
  children,
  fallback,
}: {
  children: (returnTo: string) => React.ReactNode;
  fallback: string;
}) {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? fallback;
  return <>{children(returnTo)}</>;
}
