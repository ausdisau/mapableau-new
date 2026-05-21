import Link from "next/link";

import ExtensionShowcasePage from "@/components/extension-showcase/ExtensionShowcasePage";

export default function Page() {
  return (
    <>
      <div className="border-b border-border bg-primary/5 px-4 py-3 text-center text-sm">
        <Link href="/core" className="font-medium text-primary hover:underline">
          Open MapAble Core platform →
        </Link>
      </div>
      <ExtensionShowcasePage />
    </>
  );
}
