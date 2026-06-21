import { AgentNav } from "@/components/mapable-agent/AgentNav";

export const metadata = {
  title: "MapAble Agent | MapAble",
  description: "Accessible AI assistant powered by gpt-oss for NDIS support.",
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
      <AgentNav />
      {children}
    </div>
  );
}
