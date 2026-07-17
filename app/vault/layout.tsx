import Link from "next/link";
import type { ReactNode } from "react";

const nav = [
  { href: "/vault", label: "Overview" },
  { href: "/vault/items", label: "Items" },
  { href: "/vault/devices", label: "Devices" },
  { href: "/vault/capabilities", label: "Capabilities" },
  { href: "/vault/disclosures", label: "Disclosures" },
  { href: "/vault/history", label: "History" },
  { href: "/vault/recovery", label: "Recovery" },
  { href: "/vault/export", label: "Export" },
  { href: "/vault/import", label: "Import" },
  { href: "/vault/deletion", label: "Deletion" },
  { href: "/vault/offline", label: "Offline" },
  { href: "/vault/privacy-help", label: "Privacy help" },
];

export default function VaultLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 space-y-2">
        <p className="text-sm text-muted-foreground">MapAble Personal Access Vault</p>
        <h1 className="font-heading text-3xl font-bold">Your Vault</h1>
        <p className="text-muted-foreground">
          See what MapAble holds or references about you. Essential services remain
          available without using advanced Vault features.
        </p>
      </header>
      <nav aria-label="Vault sections" className="mb-8 overflow-x-auto">
        <ul className="flex flex-wrap gap-2">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
