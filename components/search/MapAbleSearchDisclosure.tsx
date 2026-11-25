import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import type { SearchUiStatus } from "@/lib/search/mapable-search-ui";

type Props = {
  status?: SearchUiStatus;
  showDeepNotice?: boolean;
  showAiNotice?: boolean;
  warnings?: string[];
  onRetry?: () => void;
  className?: string;
};

export function MapAbleSearchDisclosure({
  status = "idle",
  showDeepNotice = false,
  showAiNotice = false,
  warnings = [],
  onRetry,
  className,
}: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      {showDeepNotice ? (
        <aside
          aria-label="Deep Search availability"
          className="rounded-2xl border border-[#F8C51C]/50 bg-[#FFF9E6] p-4 text-sm text-[#0C1833]"
        >
          <p className="font-black">Deep Search is not yet active</p>
          <p className="mt-1">
            Credit-based Deep Search stays disabled until a reviewed
            reservation, payment and reconciliation system is in place. Continue
            with free Quick Search — no credits are charged from this page.
          </p>
        </aside>
      ) : null}

      {showAiNotice ? (
        <aside
          aria-label="AI processing notice"
          className="rounded-2xl border border-[#005B7F]/25 bg-[#F6FBFC] p-4 text-sm text-[#0C1833]"
        >
          <p className="font-black">Before using an online assistant</p>
          <p className="mt-1">
            Online conversation may send your search text to MapAble&apos;s
            guided assistant for processing. Prefer the step-by-step guide if
            you do not want AI processing. Do not include medical diagnoses or
            private health details unless you choose to share them.
          </p>
        </aside>
      ) : null}

      {status === "rate_limited" ? (
        <p
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm"
        >
          Search rate limit reached. Wait a moment, then try again.
          {onRetry ? (
            <>
              {" "}
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  "min-h-11 rounded-lg px-3 font-black text-[#005B7F] underline",
                  mapableCareFocusRing,
                )}
              >
                Retry
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      {status === "service_unavailable" ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm"
        >
          Search is temporarily unavailable. You can still open{" "}
          <Link href="/provider-finder" className="font-semibold underline">
            Provider Finder
          </Link>
          ,{" "}
          <Link href="/accessibility-map" className="font-semibold underline">
            Places
          </Link>
          , or{" "}
          <Link href="/contact" className="font-semibold underline">
            contact a person
          </Link>
          .
          {onRetry ? (
            <>
              {" "}
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  "min-h-11 rounded-lg px-3 font-black text-[#005B7F] underline",
                  mapableCareFocusRing,
                )}
              >
                Retry
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      {status === "partial_data" ? (
        <p
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
        >
          Some directory sources are unavailable. Showing MapAble navigation and
          any available results. Unknown information stays unknown.
        </p>
      ) : null}

      <aside
        aria-label="Search independence and evidence limits"
        className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-[#0C1833]"
      >
        <h2 className="font-heading text-base font-bold">
          What these results can and cannot confirm
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Organic Search ordering is independent of advertising. Advertisers
            cannot influence inclusion, ranking, evidence labels or
            conversational recommendations.
          </li>
          <li>
            Directory listings do not prove current NDIS Commission
            registration, individual worker clearance, accessibility or
            availability.
          </li>
          <li>
            MapAble does not claim to have indexed the entire public web in this
            experience.
          </li>
        </ul>
        {warnings.map((warning) => (
          <p key={warning}>{warning}</p>
        ))}
        <p>
          Check the{" "}
          <a
            className="underline"
            href="https://www.ndiscommission.gov.au/provider-registration/find-registered-provider"
          >
            NDIS Commission Provider Register
          </a>{" "}
          for current registration. For human help, use{" "}
          <Link href="/contact" className="underline">
            Contact MapAble
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
