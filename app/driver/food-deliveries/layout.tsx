import { requirePermission } from "@/lib/auth/guards";

export default async function DriverFoodDeliveriesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("foods:deliver:assigned");
  return <main id="main-content" className="mx-auto max-w-4xl px-4 py-8">{children}</main>;
}
