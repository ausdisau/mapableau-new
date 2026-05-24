import { notFound } from "next/navigation";

import { ProviderProfileView } from "@/components/providers/ProviderProfileView";
import { getPublicProviderProfile } from "@/lib/providers/provider-profile-service";

export const dynamic = "force-dynamic";

type ProviderPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProviderPageProps) {
  const { id } = await params;
  const profile = await getPublicProviderProfile(id);
  if (!profile) {
    return { title: "Provider not found | MapAble" };
  }
  return {
    title: `${profile.name} | MapAble Provider Finder`,
    description: `View services, access information and verification status for ${profile.name}.`,
  };
}

export default async function ProviderProfilePage({ params }: ProviderPageProps) {
  const { id } = await params;
  const profile = await getPublicProviderProfile(id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <ProviderProfileView profile={profile} />
    </div>
  );
}
