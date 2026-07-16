import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Canonical alias → dashboard trip detail. */
export default async function TransportTripAliasPage({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/transport/${id}`);
}
