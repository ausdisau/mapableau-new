import Link from "next/link";

const NAV = [
  { href: "/agent", label: "Chat" },
  { href: "/agent/review-queue", label: "Review queue" },
  { href: "/agent/tools", label: "Tools" },
  { href: "/agent/audit", label: "Audit" },
  { href: "/agent/settings", label: "Settings" },
] as const;

export function AgentNav() {
  return (
    <nav aria-label="MapAble Agent" className="mb-8 flex flex-wrap gap-2">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="min-h-11 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
