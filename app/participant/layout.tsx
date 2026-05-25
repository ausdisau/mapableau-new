import { PwaAppLayout } from "@/components/layout/PwaAppLayout";
import { requireAuth } from "@/lib/auth/guards";

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <PwaAppLayout>{children}</PwaAppLayout>;
}
