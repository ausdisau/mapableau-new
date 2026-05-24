import { redirect } from "next/navigation";

type LegacyProfilePageProps = {
  params: Promise<{ slug: string }>;
};

/** Legacy Provider Finder profile URLs → canonical public profile route. */
export default async function LegacyProviderProfileRedirect({
  params,
}: LegacyProfilePageProps) {
  const { slug } = await params;
  redirect(`/providers/${encodeURIComponent(slug)}`);
}
