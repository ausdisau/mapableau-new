import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LegacyReviewRedirect({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  redirect(`/access/places/${placeId}/report/new`);
}
