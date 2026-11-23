"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { Providers } from "@/components/providers";

// A script already running in a public document survives a soft navigation.
// Cross this boundary with a fresh document before exposing any personal inputs.
export function SearchDocumentBoundary({
  children,
  siteServices,
}: {
  children: ReactNode;
  siteServices: ReactNode;
}) {
  const pathname = usePathname();
  const privateSearch =
    pathname === "/search/workspace" || pathname === "/search/workspace/";
  const initialPrivateSearch = useRef(privateSearch);
  const crossing = initialPrivateSearch.current !== privateSearch;
  useEffect(() => {
    if (crossing) window.location.replace(window.location.href);
  }, [crossing]);
  if (crossing) return <p role="status">Opening MapAble…</p>;
  if (privateSearch) return <>{children}</>;
  return (
    <>
      <Providers>{children}</Providers>
      {siteServices}
    </>
  );
}
