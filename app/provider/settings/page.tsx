import Link from "next/link";

import { PanelSection } from "@/components/admin-panels/PanelSection";
import { requireProviderPanel } from "@/lib/auth/panel-guards";

export const metadata = { title: "Settings | Provider admin" };

export default async function ProviderSettingsPage() {
  await requireProviderPanel();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Settings</h1>
      <PanelSection title="Organisation settings">
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/provider/availability" className="text-primary hover:underline">
              Availability windows
            </Link>
          </li>
          <li>
            <Link href="/provider/onboarding" className="text-primary hover:underline">
              Onboarding
            </Link>
          </li>
          <li>
            <Link href="/admin/organisations" className="text-primary hover:underline">
              Admin organisation management
            </Link>
          </li>
        </ul>
      </PanelSection>
    </div>
  );
}
