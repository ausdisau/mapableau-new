import { redirect } from "next/navigation";

/**
 * Alias route: /ops/quality-safeguards/* → /admin/ops/quality-safeguards/*
 * Keeps product-spec URLs while reusing the admin ops shell and guards.
 */
export default async function OpsQualitySafeguardsAliasPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  const suffix = path?.length ? `/${path.join("/")}` : "";
  redirect(`/admin/ops/quality-safeguards${suffix}`);
}
