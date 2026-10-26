"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, CheckCircle2, Compass, ExternalLink, Info, MapPinned, Plus, RotateCcw, Save, Trash2, Wheelchair } from "lucide-react";

import {
  addTourismStop, getTourismPlaceInTrip, isTourismTrip, makeSydneyDemoTrip, moveTourismStop,
  removeTourismStop, SYDNEY_TOURISM_PLACES, TOURISM_NEEDS, TOURISM_TRIP_STORAGE_KEY,
  type TourismNeed, type TourismPlace, type TourismTrip,
} from "@/lib/tourism/demo";
import { TourismMap } from "@/components/tourism/TourismMap";
import { OpenTripMapDiscovery } from "@/components/tourism/OpenTripMapDiscovery";

function chip(status: string) {
  if (status === "unknown") return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800"><Info size={13} aria-hidden /> Access unknown</span>;
  return status === "documented"
    ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900"><CheckCircle2 size={13} aria-hidden /> Documented</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900"><Info size={13} aria-hidden /> Confirm access</span>;
}
function card(place: TourismPlace, action?: React.ReactNode) {
  return <article key={place.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
    <div className="relative flex h-32 items-end overflow-hidden bg-gradient-to-br from-[#00698b] via-[#267d87] to-[#f8c51c] p-5 text-white">
      <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[28px] border-white/10" aria-hidden />
      <div className="absolute right-6 top-4 text-5xl font-black text-white/15" aria-hidden>{place.recommendedDay.toString().padStart(2, "0")}</div>
      <p className="relative text-xs font-black uppercase tracking-widest">{place.neighbourhood} · {place.category}</p>
    </div>
    <div className="space-y-3 p-5">
      <h3 className="text-xl font-bold leading-snug text-[#0c1833]"><Link className="hover:underline focus-visible:outline-4 focus-visible:outline-offset-2" href={ "/tourism/places/"+place.id}>{place.name}</Link></h3>
      <p className="text-sm leading-relaxed text-slate-600">{place.description}</p>
      <div className="flex flex-wrap gap-2">{chip(place.stepFree.status)}{chip(place.accessibleToilet.status)}</div>
      <p className="text-xs text-slate-600">Source checked: {place.checkedOn}</p>
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
        <Link className="text-sm font-bold text-[#005b7f] underline underline-offset-4" href={"/tourism/places/"+place.id}>View access evidence</Link>
        {action}
      </div>
    </div>
  </article>;
}

function useDemoTrip() {
  const [trip, setTrip] = useState<TourismTrip>(() => makeSydneyDemoTrip());
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TOURISM_TRIP_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isTourismTrip(parsed)) setTrip(parsed);
      }
    } catch { /* Browser storage is optional. */ }
    setLoaded(true);
  }, []);
  const save = (next: TourismTrip) => {
    setTrip(next);
    try { window.localStorage.setItem(TOURISM_TRIP_STORAGE_KEY, JSON.stringify(next)); }
    catch { /* The itinerary remains editable for this session. */ }
  };
  const reset = () => save(makeSydneyDemoTrip());
  return { trip, save, reset, loaded };
}

function frame(children: React.ReactNode) {
  return <main className="min-h-screen bg-[#f6fbfc] text-[#0c1833]">
    <div className="border-b border-slate-200 bg-white">
      <nav aria-label="Tourism navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link href="/tourism" className="inline-flex items-center gap-2 text-xl font-black text-[#005b7f]"><Compass aria-hidden /> MapAble <span className="font-medium text-[#0c1833]">Tourism</span></Link>
        <div className="flex flex-wrap gap-5 text-sm font-bold text-[#005b7f]">
          <Link className="hover:underline focus-visible:outline-4" href="/tourism">Discover</Link>
          <Link className="hover:underline focus-visible:outline-4" href="/tourism/plan">Plan a trip</Link>
          <Link className="hover:underline focus-visible:outline-4" href="/tourism/trips/sydney-demo">My itinerary</Link>
          <Link className="hover:underline focus-visible:outline-4" href="/tourism/map">Explore map</Link>
        </div>
      </nav>
    </div>
    {children}
    <footer className="mx-auto max-w-7xl px-5 py-10 text-sm text-slate-600 lg:px-8">MapAble Tourism concept by Australian Disability Ltd. Sydney places are illustrative. No accessibility route, booking or live transport service is verified.</footer>
  </main>;
}

function eyebrow(text: string) {
  return <p className="text-xs font-black uppercase tracking-[0.2em] text-[#005b7f]">{text}</p>;
}

export function TourismDiscover() {
  const [query, setQuery] = useState("");
  const [needFilters, setNeedFilters] = useState<TourismNeed[]>(["step-free", "accessible-toilet"]);
  const visible = useMemo(() => SYDNEY_TOURISM_PLACES.filter(p =>
    [p.name, p.neighbourhood, p.category].join(" ").toLowerCase().includes(query.trim().toLowerCase())
    && (!needFilters.includes("step-free") || p.stepFree.status !== "unknown")
    && (!needFilters.includes("accessible-toilet") || p.accessibleToilet.status !== "unknown")
  ), [query, needFilters]);
  return frame(<>
    <section className="relative overflow-hidden bg-[#073451] text-white">
      <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full border-[70px] border-[#36b9ae]/20" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-36 h-44 w-44 rounded-full bg-[#f8c51c]/15 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-sm font-black uppercase tracking-widest text-[#a7eee0]">Your city. Your pace. Your choice.</p>
        <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.1] tracking-tight md:text-7xl">Go places.<br/><span className="text-[#f8c51c]">Know the access.</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90">Discover Sydney, plan a trip that fits your needs and see what is documented — and what still needs checking.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-xl bg-[#f8c51c] px-6 py-4 font-black text-[#0c1833] focus-visible:outline-4 focus-visible:outline-offset-4" href="/tourism/plan">Start planning <span aria-hidden>→</span></Link>
          <Link className="rounded-xl border border-white/70 px-6 py-4 font-bold text-white focus-visible:outline-4" href="/tourism/trips/sydney-demo">Explore Sydney in 3 days</Link>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl space-y-8 px-5 py-12 lg:px-8" aria-labelledby="tourism-places">
      <div className="flex flex-wrap justify-between gap-4"><div>{eyebrow("Find your next experience")}<h2 id="tourism-places" className="mt-2 text-3xl font-black">Explore Sydney</h2></div><p className="max-w-md text-sm text-slate-600">Venue accessibility claims are attributed to sources, not independently audited by MapAble.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="tourism-search" className="block text-sm font-bold">Search places or neighbourhoods</label>
        <input id="tourism-search" className="mt-2 min-h-12 w-full rounded-xl border border-slate-400 px-4 text-base focus-visible:outline-4 focus-visible:outline-[#005b7f]" placeholder="Try Opera House, museums or Darling Harbour" value={query} onChange={e=>setQuery(e.target.value)} />
        <fieldset className="mt-4 flex flex-wrap gap-5"><legend className="mb-2 text-sm font-bold">Access preferences</legend>
          {TOURISM_NEEDS.map(n=><label key={n.id} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-5 w-5 accent-[#005b7f]" checked={needFilters.includes(n.id)} onChange={e=>setNeedFilters(p=>e.target.checked?[...p,n.id]:p.filter(x=>x!==n.id))}/>{n.label}</label>)}
        </fieldset>
        <p className="mt-3 text-xs text-slate-600">Filters show places with published information, including conditional access. They do not guarantee personal access fit.</p>
      </div>
      <p role="status" className="text-sm text-slate-600">{visible.length} illustrative Sydney places</p>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map(place=>card(place))}</div>
    </section>
    <OpenTripMapDiscovery />
  </>);
}

export function TourismPlanner() {
  const { trip, save, loaded } = useDemoTrip();
  const [days, setDays] = useState(3);
  const [destination, setDestination] = useState("Sydney");
  const [needs, setNeeds] = useState<TourismNeed[]>(["step-free","accessible-toilet"]);
  const [message, setMessage] = useState("");
  function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (destination !== "Sydney") { setMessage("The prototype currently supports Sydney only. Choose Sydney to create a sample itinerary."); return; }
    save(makeSydneyDemoTrip(days));
    setMessage("Your illustrative itinerary is saved locally. Open My itinerary to edit it.");
  }
  return frame(<div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
    {eyebrow("Make the journey yours")}
    <h1 className="mt-2 text-4xl font-black">Plan your next adventure</h1>
    <p className="mt-3 max-w-2xl text-slate-600">Create a sample itinerary without sharing your accessibility preferences with a third party. No bookings or route calculations are made.</p>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={generate} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div><label className="block font-bold" htmlFor="tourism-destination">Destination</label><select id="tourism-destination" value={destination} onChange={e=>setDestination(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-400 px-3"><option>Sydney</option></select></div>
        <div><label className="block font-bold" htmlFor="tourism-days">Trip duration</label><select id="tourism-days" value={days} onChange={e=>setDays(Number(e.target.value))} className="mt-2 min-h-12 w-full rounded-xl border border-slate-400 px-3">{[1,2,3,4,5].map(d=><option key={d} value={d}>{d} {d===1?"day":"days"}</option>)}</select></div>
        <fieldset className="space-y-3"><legend className="font-bold">Your access priorities</legend>{TOURISM_NEEDS.map(n=><label key={n.id} className="flex min-h-12 items-start gap-3 rounded-xl bg-[#f6fbfc] p-4"><input className="mt-1 h-5 w-5 accent-[#005b7f]" type="checkbox" checked={needs.includes(n.id)} onChange={e=>setNeeds(p=>e.target.checked?[...p,n.id]:p.filter(x=>x!==n.id))}/><span><strong className="block">{n.label}</strong><span className="mt-1 block text-sm text-slate-600">{n.hint}</span></span></label>)}</fieldset>
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">This is an illustrative dataset. Selecting a preference highlights documented information; it does not certify that an entire journey will be accessible.</p>
        <button className="min-h-12 rounded-xl bg-[#005b7f] px-6 py-3 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2" type="submit">Generate sample itinerary</button>
        <p role="status" aria-live="polite">{message || (loaded ? "Your plan stays in this browser." : "Loading your saved example…")}</p>
        {message && <Link href="/tourism/trips/sydney-demo" className="inline-block font-bold text-[#005b7f] underline">Open your itinerary →</Link>}
      </form>
      <aside className="self-start rounded-3xl bg-[#073451] p-6 text-white"><CalendarDays size={34} aria-hidden/><h2 className="mt-4 text-2xl font-black">Sydney, your way</h2><p className="mt-3 leading-relaxed text-white/90">Your {days}-day outline uses curated harbour, culture and waterfront destinations, with room to move activities and take breaks.</p><p className="mt-5 text-sm text-white/85">Current saved itinerary: {trip.days.length} days.</p></aside>
    </div>
  </div>);
}

export function TourismItinerary() {
  const {trip, save, reset, loaded} = useDemoTrip();
  const [selectedDay, setSelectedDay] = useState(1);
  const [selection, setSelection] = useState<string|null>(null);
  const day = trip.days.find(d=>d.day===selectedDay) ?? trip.days[0];
  return frame(<div className="mx-auto max-w-7xl space-y-7 px-5 py-12 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div>{eyebrow("Saved in this browser only")}<h1 className="mt-2 text-4xl font-black">Your Sydney itinerary</h1><p className="mt-3 text-slate-600">A flexible demo journey. Move stops, take breaks and confirm accessibility before travelling.</p></div><button onClick={()=>{reset();setSelectedDay(1);setSelection(null);}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-400 bg-white px-4 font-bold"><RotateCcw size={17} aria-hidden/> Reset trip</button></div>
    <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-950" role="status" aria-live="polite"><Save size={18} aria-hidden/>{loaded?"Changes automatically save on this device. No travel services have been booked.":"Loading saved itinerary…"}</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Select itinerary day">{trip.days.map(d=><button key={d.day} onClick={()=>{setSelectedDay(d.day);setSelection(null);}} aria-pressed={day.day===d.day} className={"min-h-12 rounded-xl border px-5 font-bold "+(day.day===d.day?"border-[#005b7f] bg-[#005b7f] text-white":"border-slate-300 bg-white text-[#005b7f]")}>Day {d.day}</button>)}</div>
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.83fr)]">
      <section aria-labelledby="itinerary-day" className="space-y-4"><div>{eyebrow("At your pace")}<h2 id="itinerary-day" className="mt-2 text-2xl font-black">{day.title}</h2></div>
        {day.stopIds.length===0 && <p className="rounded-2xl border border-dashed border-slate-400 bg-white p-7">This day is free. Add an attraction below.</p>}
        {day.stopIds.map((id,index)=>{const p=getTourismPlaceInTrip(trip,id);if(!p)return null;return <div key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7f5ef] font-black text-[#005b7f]">{index+1}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">{p.neighbourhood} · {p.experienceMinutes ? "Suggested visit " + Math.round(p.experienceMinutes/15)*15 + " min" : "Duration to confirm"}</p><h3 className="mt-1 text-xl font-black">{p.name}</h3><p className="mt-2 text-sm text-slate-600">{p.description}</p><div className="mt-3 flex flex-wrap gap-2">{chip(p.stepFree.status)}{chip(p.accessibleToilet.status)}</div><p className="mt-3 text-sm font-semibold text-amber-900">Check before travel: {p.caution}</p><Link className="mt-2 inline-block text-sm font-bold text-[#005b7f] underline" href={"/tourism/places/"+p.id}>View evidence and venue information</Link></div></div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <button disabled={index===0} onClick={()=>save(moveTourismStop(trip,day.day,id,day.day,index-1))} className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-sm font-semibold disabled:opacity-40"><ArrowUp size={16} aria-hidden/>Earlier</button>
            <button disabled={index===day.stopIds.length-1} onClick={()=>save(moveTourismStop(trip,day.day,id,day.day,index+1))} className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-sm font-semibold disabled:opacity-40"><ArrowDown size={16} aria-hidden/>Later</button>
            <label className="text-sm font-semibold">Move to day <select className="ml-1 min-h-11 rounded-lg border px-2" value={day.day} onChange={e=>{save(moveTourismStop(trip,day.day,id,Number(e.target.value)));setSelectedDay(Number(e.target.value));}}>{trip.days.map(d=><option key={d.day} value={d.day}>{d.day}</option>)}</select></label>
            <button onClick={()=>save(removeTourismStop(trip,id))} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-red-300 px-3 text-sm font-semibold text-red-800"><Trash2 size={16} aria-hidden/>Remove</button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Allow a break and independently confirm the journey between locations. No travel-time estimate is provided.</p>
        </div>})}
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-black">Add an attraction</h3><label htmlFor="add-tourism-stop" className="mt-3 block text-sm font-semibold">Choose an available place</label><select id="add-tourism-stop" className="mt-1 min-h-12 w-full rounded-xl border px-3" value={selection??""} onChange={e=>setSelection(e.target.value)}><option value="">Choose a place…</option>{[...SYDNEY_TOURISM_PLACES, ...(trip.externalPlaces ?? [])].filter(p=>!trip.days.some(d=>d.stopIds.includes(p.id))).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button disabled={!selection} onClick={()=>{if(selection)save(addTourismStop(trip,selection,day.day));setSelection(null);}} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#005b7f] px-5 font-bold text-white disabled:opacity-50"><Plus size={18} aria-hidden/> Add to day {day.day}</button></div>
      </section>
      <aside className="space-y-4"><TourismMap places={day.stopIds.map(id=>getTourismPlaceInTrip(trip,id)).filter((p):p is TourismPlace=>Boolean(p))}/><div className="rounded-2xl bg-[#073451] p-5 text-white"><h3 className="text-xl font-black">Travel checks</h3><p className="mt-3 text-sm leading-relaxed text-white/90">Check station lifts, accessible buses or ferries, kerb ramps and drop-off locations. Attraction accessibility does not validate the travel route.</p><a href="https://transportnsw.info/trip" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold underline">Transport for NSW Trip Planner<ExternalLink size={14} aria-hidden /></a></div></aside>
    </div>
  </div>);
}

export function TourismPlaceDetail({id}:{id:string}) {
  const {trip, loaded}=useDemoTrip();
  const place=getTourismPlaceInTrip(trip,id);
  if(!place && !loaded)return frame(<div className="mx-auto max-w-5xl px-5 py-16" role="status">Loading saved place details…</div>);
  if(!place)return frame(<div className="mx-auto max-w-5xl px-5 py-16"><h1 className="text-3xl font-black">Place not found</h1><Link className="mt-4 inline-block underline" href="/tourism">Back to discovery</Link></div>);
  return frame(<div className="mx-auto max-w-6xl space-y-7 px-5 py-12 lg:px-8">
    <Link className="text-sm font-bold text-[#005b7f] underline" href="/tourism">← All Sydney places</Link>
    {eyebrow(place.neighbourhood+" · "+place.category)}
    <h1 className="text-4xl font-black">{place.name}</h1>
    <p className="max-w-3xl text-lg text-slate-600">{place.description}</p>
    <div className="grid gap-7 lg:grid-cols-2">
      <section className="space-y-5 rounded-3xl border bg-white p-6"><h2 className="text-2xl font-black">Accessibility evidence</h2>
        <div><div className="mb-2 flex flex-wrap items-center gap-2"><Wheelchair size={20} aria-hidden/><h3 className="font-bold">Step-free access</h3>{chip(place.stepFree.status)}</div><p className="text-slate-700">{place.stepFree.detail}</p></div>
        <div><div className="mb-2 flex flex-wrap items-center gap-2"><CheckCircle2 size={20} aria-hidden/><h3 className="font-bold">Accessible toilets</h3>{chip(place.accessibleToilet.status)}</div><p className="text-slate-700">{place.accessibleToilet.detail}</p></div>
        <div className="rounded-xl bg-amber-50 p-4"><h3 className="font-bold text-amber-950">Access caveat</h3><p className="mt-1 text-sm text-amber-950">{place.caution}</p></div>
        <div className="text-sm text-slate-600"><p>Evidence type: published operator or tourism listing; not an independent MapAble inspection.</p><p>Source reviewed: {place.checkedOn}</p><a className="mt-2 inline-flex items-center gap-1 font-bold text-[#005b7f] underline" href={place.sourceUrl} target="_blank" rel="noopener noreferrer">Read source: {place.sourceName}<ExternalLink size={14} aria-hidden /></a></div>
      </section>
      <div className="space-y-5"><TourismMap places={[place]}/><div className="rounded-2xl bg-white p-5"><MapPinned size={22} aria-hidden/><h2 className="mt-2 font-black">Plan the whole journey</h2><p className="mt-2 text-sm text-slate-600">{place.address}</p><p className="mt-2 text-sm text-slate-600">Check the exact approach, pedestrian crossings and any lift outages before departure.</p><Link href="/tourism/trips/sydney-demo" className="mt-4 inline-block rounded-xl bg-[#005b7f] px-5 py-3 font-bold text-white">Edit Sydney itinerary</Link></div></div>
    </div>
  </div>);
}

export function TourismMapPage() {
  return frame(<div className="mx-auto max-w-7xl space-y-6 px-5 py-12 lg:px-8">{eyebrow("See the city differently")}<h1 className="text-4xl font-black">Explore Sydney on the map</h1><p className="max-w-3xl text-slate-600">Select a marker or use the place list. The map locates venues but does not calculate or guarantee step-free routes.</p><TourismMap places={SYDNEY_TOURISM_PLACES}/></div>);
}
