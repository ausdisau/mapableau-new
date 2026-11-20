import type { Metadata } from "next";

import { DomainDirectoryPage, type DirectorySearchParams } from "@/components/search/DomainDirectoryPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rehabilitation and allied-health directory | MapAble Moves",
  description: "Source-labelled therapy and rehabilitation service discovery.",
  alternates: canonicalAlternate("/moves/directory"),
};

export default async function RehabilitationDirectory({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  return <DomainDirectoryPage domain="rehabilitation" searchParams={await searchParams} />;
}
