import { redirect } from "next/navigation";

type Props = { params: Promise<{ placeId: string }> };

/** Canonical inventory URL aliases the venue detail page. */
export default async function VerifyInventoryAliasPage({ params }: Props) {
  const { placeId } = await params;
  redirect(`/verify/venues/${placeId}`);
}
