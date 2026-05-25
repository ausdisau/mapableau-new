import { PwaAppLayout } from "@/components/layout/PwaAppLayout";
import { requirePermission } from "@/lib/auth/guards";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("care:shift:work");

  return <PwaAppLayout>{children}</PwaAppLayout>;
}
