"use client";

import { useMemo, useState } from "react";

import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  EVIDENCE_DEMO_LISTINGS,
  EVIDENCE_LABELS,
  SAFETY_LABELS,
  canAddToLocalDraft,
  findEvidence,
  formatIndicativePrice,
  makeLocalEnquiryDraft,
  searchEvidenceListings,
  type Category,
  type Condition,
  type EvidenceListing,
  type LocalDraftLine,
} from "@/packages/marketplace-evidence/src/index";

const fieldNames = ["Access features", "Condition", "Dimensions", "Delivery"];
const focusClass = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#073F97]";
const buttonClass = "min-h-11 rounded-xl border border-[#073F97] px-4 py-2 text-sm font-semibold text-[#073F97] hover:bg-blue-50 " + focusClass;
const selectedClass = "bg-[#073F97] text-white hover:bg-[#073F97]/90";
const enlargedContentClass =
  "[&_p]:!text-lg [&_li]:!text-lg [&_label]:!text-lg [&_button]:!text-lg " +
  "[&_input]:!text-lg [&_select]:!text-lg [&_td]:!text-lg [&_th]:!text-lg " +
  "[&_summary]:!text-lg [&_span]:!text-base";

function EvidenceCard({
  listing,
  compared,
  drafted,
  onCompare,
  onDraft,
}: {
  listing: EvidenceListing;
  compared: boolean;
  drafted: boolean;
  onCompare: () => void;
  onDraft: () => void;
}) {
  const canDraft = canAddToLocalDraft(listing);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-[#F0F4FC] text-[#073F97]" aria-hidden="true">
        <span className="text-4xl font-black">AT</span>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-[#5740B8]">{CATEGORY_LABELS[listing.category]}</p>
      <h3 className="mt-2 text-xl font-bold text-[#0C1833]">{listing.name}</h3>
      <p className="mt-2 text-sm text-slate-700">{listing.description}</p>
      <p className="mt-2 text-sm text-slate-700">Listed by: {listing.sellerLabel} (fictional)</p>
      <p className="mt-3 text-xl font-black text-[#073F97]">
        {formatIndicativePrice(listing.indicativePriceCents)}
        <span className="ml-2 text-xs font-normal text-slate-700">illustrative only</span>
      </p>
      <p className="mt-2 text-sm font-semibold text-[#0C1833]">{SAFETY_LABELS[listing.safetyGate]}</p>
      <p className="mt-1 text-sm text-slate-700">{CONDITION_LABELS[listing.condition]} · Availability unconfirmed</p>
      <details className="my-4 rounded-xl border border-slate-200 p-3">
        <summary className={"cursor-pointer font-semibold text-[#073F97] " + focusClass}>Product evidence and unknowns</summary>
        <p className="mt-3 text-sm text-slate-700">{listing.conditionNote}</p>
        <ul className="mt-3 space-y-3">
          {listing.evidence.map((item) => (
            <li key={item.name} className="text-sm">
              <strong className="block text-[#0C1833]">{item.name}: {item.detail}</strong>
              <span className="text-slate-700">{EVIDENCE_LABELS[item.source]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-700">{listing.deliveryNote}</p>
      </details>
      <div className="mt-auto flex flex-wrap gap-2">
        <button type="button" className={buttonClass + (compared ? " " + selectedClass : "")}
          aria-pressed={compared}
          aria-label={compared ? "Remove " + listing.name + " from comparison" : "Compare " + listing.name}
          onClick={onCompare}>
          {compared ? "Remove comparison" : "Compare"}
        </button>
        <button type="button" disabled={!canDraft} className={buttonClass + " disabled:cursor-not-allowed disabled:opacity-50"}
          aria-pressed={drafted}
          aria-label={!canDraft
            ? listing.name + " needs specialist review"
            : drafted
              ? "Remove " + listing.name + " from local draft"
              : "Add " + listing.name + " to local draft"}
          onClick={onDraft}>
          {!canDraft ? "Specialist review first" : drafted ? "Remove from draft" : "Add to local draft"}
        </button>
      </div>
    </article>
  );
}

export function MarketplaceEvidencePreview() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [condition, setCondition] = useState<Condition | "all">("all");
  const [lowerRiskOnly, setLowerRiskOnly] = useState(false);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [draftLines, setDraftLines] = useState<LocalDraftLine[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [largeText, setLargeText] = useState(false);

  const listings = useMemo(
    () => searchEvidenceListings({ query, category, condition, lowerRiskOnly }),
    [query, category, condition, lowerRiskOnly],
  );
  const compared = comparedIds
    .map((id) => EVIDENCE_DEMO_LISTINGS.find((listing) => listing.id === id))
    .filter((listing): listing is EvidenceListing => Boolean(listing));

  function toggleComparison(id: string) {
    if (comparedIds.includes(id)) {
      setComparedIds((ids) => ids.filter((existing) => existing !== id));
      setAnnouncement("Item removed from comparison.");
    } else if (comparedIds.length >= 3) {
      setAnnouncement("You can compare up to three examples. Remove an item first.");
    } else {
      setComparedIds((ids) => [...ids, id]);
      setAnnouncement("Item added to comparison.");
    }
  }

  function toggleDraft(id: string) {
    const listing = EVIDENCE_DEMO_LISTINGS.find((entry) => entry.id === id);
    if (!listing || !canAddToLocalDraft(listing)) {
      setAnnouncement("This example requires specialist review and cannot enter the local draft.");
      return;
    }
    setDraftLines((existing) =>
      existing.some((line) => line.listingId === id)
        ? existing.filter((line) => line.listingId !== id)
        : [...existing, { listingId: id, quantity: 1 }],
    );
    setAnnouncement("Local draft updated. No information was sent.");
  }

  function setDraftQuantity(id: string, value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      setAnnouncement("Quantity must be between 1 and 5.");
      return;
    }
    setDraftLines((lines) => lines.map((line) => line.listingId === id ? { ...line, quantity: value } : line));
  }

  function downloadDraft() {
    if (draftLines.length === 0) {
      setAnnouncement("Choose an example item first.");
      return;
    }
    const content = makeLocalEnquiryDraft(draftLines);
    if (content.startsWith("Invalid")) {
      setAnnouncement(content);
      return;
    }
    const file = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mapable-local-example-enquiry.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setAnnouncement("Text draft prepared for download. No supplier was contacted.");
  }

  return (
    <div className={largeText ? enlargedContentClass : ""} data-text-size={largeText ? "large" : "standard"}>
      <div className="rounded-2xl border border-[#073F97]/20 bg-[#F3F6FC] p-5">
        <p className="font-semibold text-[#073F97]">MapAble · Find access. Drive change.</p>
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#5740B8]">Marketplace evidence prototype</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0C1833] sm:text-4xl">Better information before you buy.</h1>
        <p className="mt-3 max-w-3xl text-slate-800">
          Explore example assistive technology and everyday products with clearly labelled seller statements,
          missing details and review requirements. Decide which details matter to you.
        </p>
        <p className="mt-4 rounded-xl border border-[#073F97]/20 bg-white p-3 text-sm font-semibold text-[#0C1833]" role="note">
          Demonstration only. All listings, suppliers and prices are synthetic. No checkout, seller contact,
          NDIS approval or safety certification is provided.
        </p>
        <button type="button" className={"mt-4 " + buttonClass} aria-pressed={largeText}
          onClick={() => setLargeText((value) => !value)}>
          {largeText ? "Use standard text size" : "Use larger text"}
        </button>
      </div>

      <section aria-labelledby="search-heading" className="mt-8">
        <h2 id="search-heading" className="text-2xl font-bold text-[#0C1833]">Explore equipment</h2>
        <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block font-semibold text-[#0C1833]" htmlFor="demo-equipment-search">Search examples</label>
            <input id="demo-equipment-search" type="search" autoComplete="off" value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try AAC, reacher, keyboard"
              className={"mt-2 min-h-11 w-full rounded-lg border border-slate-400 px-3 " + focusClass} />
          </div>
          <div>
            <label className="block font-semibold text-[#0C1833]" htmlFor="demo-equipment-category">Category</label>
            <select id="demo-equipment-category" value={category} onChange={(event) => setCategory(event.target.value as Category | "all")}
              className={"mt-2 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 " + focusClass}>
              <option value="all">All categories</option>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((id) =>
                <option value={id} key={id}>{CATEGORY_LABELS[id]}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#0C1833]" htmlFor="demo-equipment-condition">Condition</label>
            <select id="demo-equipment-condition" value={condition} onChange={(event) => setCondition(event.target.value as Condition | "all")}
              className={"mt-2 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 " + focusClass}>
              <option value="all">All conditions</option>
              {(Object.keys(CONDITION_LABELS) as Condition[]).map((id) =>
                <option value={id} key={id}>{CONDITION_LABELS[id]}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold text-[#0C1833]">
              <input type="checkbox" checked={lowerRiskOnly} onChange={(event) => setLowerRiskOnly(event.target.checked)}
                className={"h-5 w-5 accent-[#073F97] " + focusClass} />
              Show lower-risk example categories only
            </label>
          </div>
          <div className="lg:col-span-4">
            <button type="button" className={buttonClass} onClick={() => {
              setQuery(""); setCategory("all"); setCondition("all"); setLowerRiskOnly(false);
            }}>Clear filters</button>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-700" role="status">
          {listings.length} synthetic example {listings.length === 1 ? "listing" : "listings"} shown.
        </p>
        {listings.length ? (
          <ul className="mt-4 grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <EvidenceCard listing={listing}
                  compared={comparedIds.includes(listing.id)}
                  drafted={draftLines.some((line) => line.listingId === listing.id)}
                  onCompare={() => toggleComparison(listing.id)}
                  onDraft={() => toggleDraft(listing.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-400 p-6">
            No example items match. Try a broader search or clear the filters.
          </p>
        )}
      </section>

      <section aria-labelledby="comparison-heading" className="mt-10">
        <h2 id="comparison-heading" className="text-2xl font-bold text-[#0C1833]">Compare evidence</h2>
        <p className="mt-2 text-slate-700">Choose up to three examples. Missing information stays visible; no item receives a universal suitability score.</p>
        {compared.length === 0 ? <p className="mt-3 rounded-xl border border-slate-200 p-5">No examples selected for comparison.</p> : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <caption className="sr-only">Side-by-side evidence for selected synthetic equipment</caption>
              <thead className="bg-[#F3F6FC] text-[#0C1833]">
                <tr><th scope="col" className="border-b p-3">Property</th>
                  {compared.map((listing) => <th scope="col" key={listing.id} className="border-b p-3">{listing.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row" className="border-b p-3">Condition</th>
                  {compared.map((item) => <td key={item.id} className="border-b p-3">{CONDITION_LABELS[item.condition]}</td>)}
                </tr>
                <tr><th scope="row" className="border-b p-3">Indicative price</th>
                  {compared.map((item) => <td key={item.id} className="border-b p-3">{formatIndicativePrice(item.indicativePriceCents)}</td>)}
                </tr>
                <tr><th scope="row" className="border-b p-3">Safety review</th>
                  {compared.map((item) => <td key={item.id} className="border-b p-3">{SAFETY_LABELS[item.safetyGate]}</td>)}
                </tr>
                {fieldNames.map((field) => (
                  <tr key={field}>
                    <th scope="row" className="border-b p-3">{field}</th>
                    {compared.map((item) => {
                      const evidence = findEvidence(item, field);
                      return <td className="border-b p-3" key={item.id}>
                        <span className="block">{evidence.detail}</span>
                        <span className="mt-1 block text-slate-700">{EVIDENCE_LABELS[evidence.source]}</span>
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {compared.length > 0 ? <button type="button" className={"mt-3 " + buttonClass}
          onClick={() => { setComparedIds([]); setAnnouncement("Comparison cleared."); }}>Clear comparison</button> : null}
      </section>

      <section aria-labelledby="local-draft-heading" className="mt-10 rounded-2xl border border-[#073F97]/20 bg-[#F5F7FC] p-5">
        <h2 id="local-draft-heading" className="text-2xl font-bold text-[#0C1833]">Your local enquiry draft</h2>
        <p className="mt-2 text-slate-800">Draft only: no seller receives your selections. No order, invoice or payment is created.</p>
        {draftLines.length === 0 ? <p className="mt-3">No examples in your draft.</p> : (
          <ul className="mt-4 space-y-3">
            {draftLines.map((line) => {
              const listing = EVIDENCE_DEMO_LISTINGS.find((entry) => entry.id === line.listingId);
              if (!listing) return null;
              return <li key={line.listingId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
                <strong>{listing.name}</strong>
                <div className="flex items-center gap-3">
                  <label htmlFor={"demo-qty-" + line.listingId}>Quantity</label>
                  <input id={"demo-qty-" + line.listingId} type="number" min={1} max={5}
                    value={line.quantity} onChange={(event) => setDraftQuantity(line.listingId, Number(event.target.value))}
                    className={"min-h-11 w-16 rounded-lg border border-slate-400 px-2 " + focusClass}/>
                  <button type="button" className={buttonClass}
                    aria-label={"Remove " + listing.name + " from local draft"}
                    onClick={() => toggleDraft(line.listingId)}>Remove</button>
                </div>
              </li>;
            })}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={draftLines.length === 0}
            className={buttonClass + " " + selectedClass + " disabled:cursor-not-allowed disabled:opacity-50"}
            onClick={downloadDraft}>Download local text draft</button>
          <button type="button" disabled={draftLines.length === 0}
            className={buttonClass + " disabled:cursor-not-allowed disabled:opacity-50"}
            onClick={() => { setDraftLines([]); setAnnouncement("Local draft cleared."); }}>Clear draft</button>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 p-5" aria-labelledby="principles-heading">
        <h2 id="principles-heading" className="text-xl font-bold text-[#0C1833]">How MapAble protects informed choice</h2>
        <p className="mt-2 text-slate-700">
          Seller statements are not presented as independently verified. Unknown information is explicit.
          No diagnosis or funding details are requested. Paid promotion cannot affect comparisons.
          Specialist-dependent equipment remains outside the draft workflow. No clinical or NDIS funding assessment is made.
        </p>
      </section>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    </div>
  );
}
