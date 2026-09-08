import Link from "next/link";

import {
  type FocusViewDensity,
  type FocusViewProjection,
  visibleFocusSections,
} from "@/lib/personal-agency/focus-view";

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function FocusItem({
  label,
  item,
}: {
  label: string;
  item: NonNullable<FocusViewProjection["now"]>;
}) {
  const content = (
    <>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-[#0C1833]">{item.title}</h3>
        <span className="text-sm font-semibold text-[#005B7F]">
          {formatTime(item.at)}
        </span>
      </div>
      {item.status ? (
        <p className="mt-1 text-sm text-slate-600">
          Status: {item.status.replaceAll("_", " ")}
        </p>
      ) : null}
    </>
  );

  return item.href ? (
    <Link
      href={item.href}
      className="block min-h-11 rounded-xl border border-slate-200 bg-white p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-xl border border-slate-200 bg-white p-4">{content}</div>
  );
}

export function FocusView({
  projection,
  density = "standard",
}: {
  projection: FocusViewProjection;
  density?: FocusViewDensity;
}) {
  const visibility = visibleFocusSections(density);

  if (!projection.now) {
    return (
      <section
        aria-labelledby="focus-view-heading"
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-[#005B7F]">
          Focus view
        </p>
        <h2 id="focus-view-heading" className="mt-1 text-2xl font-bold text-[#0C1833]">
          Nothing needs your attention right now
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Your schedule is still available below. You can also ask MapAble to help plan something.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="focus-view-heading"
      className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#005B7F]">
          Focus view
        </p>
        <h2 id="focus-view-heading" className="mt-1 text-2xl font-bold text-[#0C1833]">
          What matters next
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          This view uses your existing schedule. It does not change bookings or make decisions for you.
        </p>
      </div>

      <FocusItem label="Now" item={projection.now} />

      {visibility.showNext && projection.next ? (
        <FocusItem label="Next" item={projection.next} />
      ) : null}

      {visibility.showLater && projection.later.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Later
          </p>
          <ul className="mt-2 space-y-2">
            {projection.later.map((item) => (
              <li key={`${item.source}-${item.id}`} className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-medium text-[#0C1833]">{item.title}</span>
                <span className="text-slate-600">{formatTime(item.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href="/my/ask?q=Help%20me%20plan%20my%20day"
          className="min-h-11 rounded-lg bg-[#F8C51C] px-4 py-2 text-sm font-bold text-[#0C1833] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#005B7F]/30"
        >
          Plan or change something
        </Link>
        <Link
          href="/contact"
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#005B7F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
        >
          Talk to a person
        </Link>
      </div>
    </section>
  );
}
