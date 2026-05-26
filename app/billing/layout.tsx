import { requireAuth } from "@/lib/auth/guards";
import { CoreModuleLayout } from "@/lib/platform/layouts";

export const dynamic = "force-dynamic";

export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <CoreModuleLayout>{children}</CoreModuleLayout>;
}
