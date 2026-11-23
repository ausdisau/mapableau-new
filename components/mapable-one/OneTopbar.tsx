import Image from "next/image";
import type { ReactNode } from "react";

import { MAPABLE_LOGO_WORDMARK_SRC } from "@/lib/brand/constants";

type Props = {
  workspaceLabel: string;
  contextLabel: string;
  userName: string;
  logoHref: string;
  actions?: ReactNode;
};

export function OneTopbar({
  workspaceLabel,
  contextLabel,
  userName,
  logoHref,
  actions,
}: Props) {
  return (
    <header className="mo-topbar sticky top-0 z-40">
      <div className="mx-auto flex min-h-[3.5rem] max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <a href={logoHref} className="shrink-0">
          <Image
            src={MAPABLE_LOGO_WORDMARK_SRC}
            alt="MapAble"
            width={140}
            height={36}
            className="h-8 w-auto"
            priority
          />
        </a>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-[var(--mo-purple)]">
            {workspaceLabel}
          </p>
          <p className="truncate text-sm font-semibold text-[var(--mo-ink)]">
            {contextLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-[var(--mo-muted)] sm:inline">
            {userName}
          </span>
          {actions}
        </div>
      </div>
    </header>
  );
}
