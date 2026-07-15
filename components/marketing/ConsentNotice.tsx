import type { ReactNode } from "react";

import {
  mapablePublicCardClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

export type ConsentNoticeProps = {
  title: string;
  plainLanguageSummary: string;
  dataUsed: string[];
  whoCanSeeIt: string[];
  howToWithdraw: string;
  required?: boolean;
  children?: ReactNode;
};

export function ConsentNotice({
  title,
  plainLanguageSummary,
  dataUsed,
  whoCanSeeIt,
  howToWithdraw,
  required = false,
  children,
}: ConsentNoticeProps) {
  return (
    <aside
      className={`${mapablePublicCardClass} border-[#005B7F]/15 bg-[#F6FBFC]`}
      aria-labelledby="consent-notice-title"
    >
      <h2 id="consent-notice-title" className="text-lg font-black text-[#0C1833]">
        {title}
        {required ? (
          <span className="ml-1 text-sm font-bold text-[#005B7F]">(required)</span>
        ) : null}
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-700">{plainLanguageSummary}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-[#0C1833]">Data used</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {dataUsed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#0C1833]">Who can see it</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {whoCanSeeIt.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        <strong className="text-[#0C1833]">How to withdraw:</strong> {howToWithdraw}
      </p>

      {children ? <div className="mt-4">{children}</div> : null}
    </aside>
  );
}
