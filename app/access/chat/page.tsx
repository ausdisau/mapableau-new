import Link from "next/link";

import { AccessChatPanel } from "@/components/access-chat/AccessChatPanel";

export const metadata = {
  title: "Access chat | MapAble Access",
  description:
    "Ask natural-language accessibility questions and get grounded place results from MapAble Access.",
};

export default function AccessChatPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <nav aria-label="Breadcrumb">
        <Link
          href="/access"
          className="text-sm font-semibold text-[#005B7F] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
        >
          ← Back to Access map
        </Link>
      </nav>
      <AccessChatPanel />
    </div>
  );
}
