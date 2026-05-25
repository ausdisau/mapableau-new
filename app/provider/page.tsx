import { ProviderDashboard } from "@/components/admin-panels/provider/ProviderDashboard";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { getProviderDashboard } from "@/lib/providers/provider-service";

export const metadata = { title: "Provider admin | MapAble" };

export default async function ProviderAdminHomePage() {
  const user = await requireProviderPanel();
  const data = await getProviderDashboard(user);
  return <ProviderDashboard data={data} />;
}
