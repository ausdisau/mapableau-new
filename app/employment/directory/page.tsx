import type { Metadata } from "next";

import { DomainDirectoryPage, type DirectorySearchParams } from "@/components/search/DomainDirectoryPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Employment directory | MapAble",
  description: "Source-labelled inclusive job and employment support discovery.",
  alternates: canonicalAlternate("/employment/directory"),
};

export default async function EmploymentDirectory({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  return <DomainDirectoryPage domain="jobs" searchParams={await searchParams} />;
}
