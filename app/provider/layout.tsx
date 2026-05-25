import { PwaAppLayout } from "@/components/layout/PwaAppLayout";
import { requireAuth, requirePermission } from "@/lib/auth/guards";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  await requirePermission("care:read:org");

  return <PwaAppLayout>{children}</PwaAppLayout>;
}
