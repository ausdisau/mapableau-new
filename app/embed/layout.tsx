import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MapAble embed",
  description: "Embeddable MapAble accessibility map widget.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Minimal chrome-free layout for third-party iframe embeds.
 * Root Providers still wrap this tree; UI is intentionally full-viewport only.
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="m-0 min-h-dvh w-full overflow-hidden bg-slate-950 p-0">
      {children}
    </div>
  );
}
