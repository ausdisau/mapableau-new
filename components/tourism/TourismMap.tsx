"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { getMapAttribution, getMapStyleUrl } from "@/lib/map/map-style";
import type { TourismPlace } from "@/lib/tourism/demo";
export function TourismMap({ places }: { places: TourismPlace[] }) {
 const container = useRef<HTMLDivElement>(null);
 const map = useRef<maplibregl.Map|null>(null);
 const [selected,setSelected] = useState("");
 const [showMap,setShowMap] = useState(true);
 const ids = places.map(p=>p.id).join("|");
 useEffect(()=>{
  if(!showMap || !container.current)return;
  let instance: maplibregl.Map | null = null;
  try {
   instance=new maplibregl.Map({container:container.current,style:getMapStyleUrl(),center:[151.207,-33.866],zoom:12,attributionControl:false});
   instance.addControl(new maplibregl.NavigationControl(),"top-right");
   instance.addControl(new maplibregl.AttributionControl({compact:true}),"bottom-right");
   map.current=instance;
   const markers=places.map(place=>{
    const dot=document.createElement("span");
    dot.className="block h-5 w-5 rounded-full border-[3px] border-white bg-[#005b7f] shadow-lg";
    dot.setAttribute("aria-hidden","true");
    return new maplibregl.Marker({element:dot}).setLngLat([place.longitude,place.latitude]).setPopup(new maplibregl.Popup({offset:18}).setText(place.name)).addTo(instance!);
   });
   if(places.length===1){instance.setCenter([places[0].longitude,places[0].latitude]);instance.setZoom(14);}
   if(places.length>1){const b=new maplibregl.LngLatBounds();places.forEach(p=>b.extend([p.longitude,p.latitude]));instance.fitBounds(b,{padding:65,maxZoom:13,duration:0});}
   return ()=>{markers.forEach(m=>m.remove());map.current=null;instance?.remove();};
  }catch{instance?.remove();}
 // Rebuild when the selected day's list changes; parent supplies immutable arrays.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[ids,showMap]);
 const choose=(p:TourismPlace)=>{setSelected(p.id);map.current?.flyTo({center:[p.longitude,p.latitude],zoom:14});};
 return <section aria-label="Tourism place map and accessible results" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4"><h2 className="text-xl font-black">Places in this view</h2><button aria-pressed={showMap} onClick={()=>setShowMap(v=>!v)} className="min-h-11 rounded-xl border border-slate-400 px-4 text-sm font-bold text-[#005b7f]">{showMap?"Hide map":"Show map"}</button></div>
 {showMap&&<div ref={container} className="h-[320px] w-full bg-[#deedf0]" role="img" aria-label="Illustrative map of Sydney locations; all places are listed below." />}
 <p className="px-5 pt-3 text-xs text-slate-600">{getMapAttribution()} · Pins are indicative; routes have not been checked for step-free access.</p>
 <div className="space-y-2 p-4">{places.length===0&&<p className="text-sm">No places yet. Add a stop to this day.</p>}{places.map(p=><div key={p.id} className={"flex items-center gap-3 rounded-xl border p-3 "+(selected===p.id?"border-[#005b7f] bg-sky-50":"border-slate-200")}><button aria-pressed={selected===p.id} onClick={()=>choose(p)} className="min-h-11 flex-1 text-left text-sm font-bold text-[#005b7f] underline">{p.name}<span className="block text-xs font-normal text-slate-600">{p.neighbourhood}</span></button><a href={"/tourism/places/"+p.id} className="rounded-lg border border-[#005b7f] px-3 py-3 text-xs font-bold text-[#005b7f]">Details</a></div>)}</div>
 </section>;
}
