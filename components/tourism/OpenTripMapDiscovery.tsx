"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Compass, ExternalLink, Info, Plus, Search } from "lucide-react";

import {
  addOpenTripMapStop, isTourismTrip, makeSydneyDemoTrip,
  TOURISM_TRIP_STORAGE_KEY, type TourismTrip,
} from "@/lib/tourism/demo";
import {
  isOpenTripMapPlace,
  type OpenTripMapKind, type OpenTripMapPlace, type OpenTripMapSearchResponse,
} from "@/lib/tourism/open-trip-map";

const kindOptions: { value: OpenTripMapKind; label: string }[] = [
  { value: "interesting_places", label: "All attractions" },
  { value: "museums", label: "Museums" },
  { value: "historic", label: "History and heritage" },
  { value: "natural", label: "Nature" },
];

export function OpenTripMapDiscovery() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<OpenTripMapKind>("interesting_places");
  const [items, setItems] = useState<OpenTripMapPlace[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "live" | "disabled" | "error">("idle");
  const [message, setMessage] = useState("");
  const [trip, setTrip] = useState<TourismTrip>(() => makeSydneyDemoTrip());
  const [daysForPlace, setDaysForPlace] = useState<Record<string, number>>({});
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TOURISM_TRIP_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isTourismTrip(parsed)) setTrip(parsed);
      }
    } catch {
      // Private browsing and disabled storage remain supported for browsing.
    }
  }, []);

  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (q.length > 0 && q.length < 3) {
      setState("error");
      setMessage("Enter at least three characters, or leave the search empty to browse nearby attractions.");
      return;
    }
    setItems([]);
    setState("loading");
    setSavedMessage("");
    setMessage("Searching Sydney tourism places…");
    try {
      const params = new URLSearchParams({ kind });
      if (q) params.set("q", q);
      const response = await fetch("/api/tourism/opentripmap?" + params.toString(), {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!body || typeof body !== "object") throw new Error("Invalid API response");
      const data = body as Partial<OpenTripMapSearchResponse>;
      if (!Array.isArray(data.places) || typeof data.message !== "string") throw new Error("Invalid API response");
      setItems(data.places.filter(isOpenTripMapPlace));
      setState(data.status === "live" ? "live" : data.status === "disabled" ? "disabled" : "error");
      setMessage(data.message);
    } catch {
      setState("error");
      setMessage("The live tourism feed is unavailable. You can still use the curated Sydney places above.");
    }
  }

  function addPlace(place: OpenTripMapPlace) {
    const dayNumber = daysForPlace[place.xid] ?? 1;
    const next = addOpenTripMapStop(trip, place, dayNumber);
    if (next === trip) {
      setSavedMessage("This stop may already be in your trip, or the local plan has reached its limit.");
      return;
    }
    setTrip(next);
    try {
      window.localStorage.setItem(TOURISM_TRIP_STORAGE_KEY, JSON.stringify(next));
      setSavedMessage(place.name + " added to Day " + dayNumber + ". Your itinerary was saved on this device.");
    } catch {
      setSavedMessage(place.name + " added for this session, but browser storage is unavailable. Open My itinerary to check your saved plan.");
    }
  }

  return (
    <section id="tourism-opentripmap" aria-labelledby="tourism-opentripmap-title" className="border-t border-slate-200 bg-[#eff7f9] py-14">
      <div className="mx-auto max-w-7xl space-y-6 px-5 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.19em] text-[#005b7f]">Connected tourism data · optional</p>
            <h2 id="tourism-opentripmap-title" className="mt-3 text-3xl font-black text-[#0c1833]">Discover more Sydney attractions</h2>
            <p className="mt-3 text-slate-700">
              Search points of interest from OpenTripMap. These results are tourism listings,
              not MapAble accessibility assessments. Step-free access and accessible toilets are
              <strong> unknown until separately confirmed</strong>.
            </p>
          </div>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#005b7f]">
            <Compass size={17} aria-hidden /> Sydney CBD · 7 km radius
          </span>
        </div>

        <form onSubmit={search} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_220px_auto] md:items-end">
          <div>
            <label htmlFor="opentripmap-search" className="block text-sm font-bold">Search by attraction name (optional)</label>
            <input id="opentripmap-search" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}
              placeholder="e.g. gallery, museum or garden" className="mt-2 min-h-12 w-full rounded-xl border border-slate-400 px-4 text-base focus-visible:outline-4 focus-visible:outline-[#005b7f]" />
          </div>
          <div>
            <label htmlFor="opentripmap-kind" className="block text-sm font-bold">Category</label>
            <select id="opentripmap-kind" className="mt-2 min-h-12 w-full rounded-xl border border-slate-400 px-3" value={kind}
              onChange={e=>setKind(e.target.value as OpenTripMapKind)}>
              {kindOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={state==="loading"}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#005b7f] px-5 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 disabled:opacity-50">
            <Search size={18} aria-hidden /> {state==="loading" ? "Searching…" : "Find attractions"}
          </button>
        </form>

        <p role="status" aria-live="polite" className="text-sm font-medium text-[#0c1833]">
          {state === "idle" ? "Search is optional. The curated Sydney places work without a third-party API." : message}
        </p>
        {state === "disabled" && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <Info className="mr-2 inline" size={16} aria-hidden /> A site administrator must enable this feature and set a server-side API key after licence review. No key is sent to your browser.
        </p>}
        {state === "live" && <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <CheckCircle2 size={16} aria-hidden /> {items.length} OpenTripMap places returned; accessibility not assessed.
        </div>}
        {savedMessage && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-950">
          {savedMessage} <Link href="/tourism/trips/sydney-demo" className="underline underline-offset-2">View itinerary</Link>
        </p>}

        {items.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map(place=>{
            const alreadyAdded=trip.days.some(day=>day.stopIds.includes("otm:"+place.xid));
            return <article key={place.xid} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-[#005b7f]">OpenTripMap · Discovery data</p>
              <h3 className="mt-2 text-xl font-black text-[#0c1833]">{place.name}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {place.kinds.slice(0,3).map(k=>k.replace(/_/g," ")).join(" · ") || "Tourism point of interest"}
              </p>
              {place.distanceMeters !== undefined && <p className="mt-2 text-xs text-slate-600">
                Approximately {(place.distanceMeters/1000).toFixed(1)} km from Sydney CBD (straight line, not travel distance)
              </p>}
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">
                <Info size={16} className="mr-2 inline" aria-hidden /> Step-free access: unknown · Accessible toilets: unknown
              </div>
              <p className="mt-3 text-xs text-slate-600">Source ID: {place.xid} · Retrieved {new Date(place.retrievedAt).toLocaleDateString("en-AU")}</p>
              <div className="mt-auto border-t border-slate-100 pt-4">
                <label htmlFor={"otm-day-"+place.xid} className="block text-sm font-bold">Add to itinerary day</label>
                <select id={"otm-day-"+place.xid} className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-3"
                  value={daysForPlace[place.xid] ?? 1}
                  onChange={e=>setDaysForPlace(prev=>({...prev,[place.xid]:Number(e.target.value)}))}>
                  {trip.days.map(day=><option key={day.day} value={day.day}>Day {day.day}</option>)}
                </select>
                <button type="button" disabled={alreadyAdded} onClick={()=>addPlace(place)}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#005b7f] px-4 font-bold text-white disabled:bg-slate-200 disabled:text-slate-600">
                  <Plus size={17} aria-hidden /> {alreadyAdded ? "Already in your trip" : "Add unverified place"}
                </button>
              </div>
            </article>;
          })}
        </div>}

        <p className="text-xs leading-relaxed text-slate-600">
          Place information: <a href="https://dev.opentripmap.org/product" className="font-semibold underline" target="_blank" rel="noopener noreferrer">OpenTripMap <ExternalLink size={12} aria-hidden className="inline" /></a>,
          using community open data including <a href="https://www.openstreetmap.org/copyright" className="font-semibold underline" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors (ODbL)</a>.
          Retained place metadata must respect upstream and original-source licences. No accessibility certification is implied.
        </p>
      </div>
    </section>
  );
}
