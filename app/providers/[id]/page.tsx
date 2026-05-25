import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { getProviderPublicDetail } from "@/lib/providers/provider-search-service";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = await getProviderPublicDetail(id);
  if (!provider) notFound();

  return (
    <PageContainer title={provider.name}>
      <p className="text-sm text-slate-600 mb-4" role="status">
        {provider.type === "catalogue"
          ? provider.statusLabel
          : provider.bookingEligible
            ? "Accepting bookings"
            : "Not yet accepting bookings — check verification status"}
      </p>
      {provider.type === "organisation" && provider.services?.length ? (
        <ul className="list-disc pl-5 text-slate-800 space-y-1">
          {provider.services.map((s: { id: string; serviceName: string }) => (
            <li key={s.id}>{s.serviceName}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/bookings/new?providerId=${provider.id}`}
          className="min-h-11 inline-flex items-center px-4 rounded-md bg-blue-700 text-white font-medium"
        >
          Request booking
        </Link>
        <Link
          href="/messages"
          className="min-h-11 inline-flex items-center px-4 rounded-md border border-slate-300 font-medium"
        >
          Send message
        </Link>
      </div>
    </PageContainer>
  );
}
