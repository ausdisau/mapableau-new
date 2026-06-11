import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SupportCoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect("/coordinate");
}
