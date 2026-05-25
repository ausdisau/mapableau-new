import Link from "next/link";

interface AppHeaderProps {
  userName: string;
}

export function AppHeader({ userName }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link
          href="/core"
          className="font-semibold text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          MapAble
        </Link>
        <span className="text-sm text-slate-600 truncate" title={userName}>
          {userName}
        </span>
      </div>
    </header>
  );
}
