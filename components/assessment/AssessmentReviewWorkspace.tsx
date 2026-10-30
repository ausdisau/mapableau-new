"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

type ConcernKind = "omission" | "disputed_finding" | "unmet_support" | "correction";
const kinds: { value: ConcernKind; label: string }[] = [
  { value: "omission", label: "Something was left out" },
  { value: "disputed_finding", label: "I disagree with a finding" },
  { value: "unmet_support", label: "A support need is unmet" },
  { value: "correction", label: "Incorrect personal information" },
];
type Entry = { id: string; kind: ConcernKind; need: string; finding: string; evidence: string; requested: string };
const field = "w-full rounded-lg border border-input bg-background p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export function AssessmentReviewWorkspace() {
 const [need,setNeed]=useState("");
 const [finding,setFinding]=useState("");
 const [evidence,setEvidence]=useState("");
 const [requested,setRequested]=useState("");
 const [kind,setKind]=useState<ConcernKind>("omission");
 const [entries,setEntries]=useState<Entry[]>([]);
 const [approved,setApproved]=useState(false);
 const [status,setStatus]=useState("");
 const report=useMemo(()=>[
 "MapAble participant-authored assessment review — draft",
 "This is not an official NDIA review or automatically transmitted request.",
 "",
 ...entries.flatMap((e,i)=>[`Concern ${i+1}: ${kinds.find(k=>k.value===e.kind)?.label}`,
  `Original support needs: ${e.need}`,`Assessor report / page reference: ${e.finding || "Not recorded"}`,
  `Evidence: ${e.evidence || "Not provided"}`,`Requested action: ${e.requested}`,""]),
 ].join("\n"),[entries]);
 const [frozen,setFrozen]=useState("");
 function add() {
  if(!need.trim()||!requested.trim()) { setStatus("Describe the original need and the action requested.");return; }
  setEntries(e=>[...e,{id:crypto.randomUUID(),kind,need:need.trim(),finding:finding.trim(),evidence:evidence.trim(),requested:requested.trim()}]);
  setNeed("");setFinding("");setEvidence("");setRequested("");setApproved(false);setFrozen("");
  setStatus("Concern added locally. It has not been sent or saved to your account.");
 }
 function download() {
  const output=approved?frozen:report;
  const file=new Blob([output],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(file);const anchor=document.createElement("a");
  anchor.href=url;anchor.download="mapable-assessment-review.txt";anchor.click();
  URL.revokeObjectURL(url);
 }
 return <main className="mx-auto max-w-3xl space-y-6">
   <Link href="/dashboard/assessment" className="text-primary underline">Back to my assessment</Link>
   <h1 className="text-3xl font-bold">Review an assessor's report</h1>
   <p>Compare your account with the report. A missing link does not by itself prove an omission. You decide which concerns to raise.</p>
   <div className="rounded-xl border p-5 space-y-4">
    <h2 className="text-xl font-semibold">Add a concern</h2>
    <label className="block font-medium" htmlFor="review-kind">What needs attention?</label>
    <select id="review-kind" className={field} value={kind} onChange={e=>setKind(e.target.value as ConcernKind)}>{kinds.map(k=><option key={k.value} value={k.value}>{k.label}</option>)}</select>
    <label className="block font-medium" htmlFor="review-need">What did you originally say you need?</label>
    <textarea id="review-need" className={field} rows={3} maxLength={4000} value={need} onChange={e=>setNeed(e.target.value)} />
    <label className="block font-medium" htmlFor="review-finding">What does the assessor's report say? (optional)</label>
    <textarea id="review-finding" className={field} rows={3} maxLength={4000} value={finding} onChange={e=>setFinding(e.target.value)} />
    <label className="block font-medium" htmlFor="review-evidence">Evidence and page references (optional)</label>
    <textarea id="review-evidence" className={field} rows={2} maxLength={2000} value={evidence} onChange={e=>setEvidence(e.target.value)} />
    <label className="block font-medium" htmlFor="review-request">What should happen next?</label>
    <textarea id="review-request" className={field} rows={3} maxLength={2000} value={requested} onChange={e=>setRequested(e.target.value)} />
    <button type="button" className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground" onClick={add}>Add concern</button>
    <p role="status" aria-live="polite">{status}</p>
   </div>
   <section className="space-y-3" aria-label="Concerns">
    <h2 className="text-xl font-semibold">Your concerns ({entries.length})</h2>
    {entries.map((e,i)=><article className="rounded-xl border p-4" key={e.id}>
      <h3 className="font-semibold">Concern {i+1}: {kinds.find(k=>k.value===e.kind)?.label}</h3>
      <p className="mt-2"><strong>Original:</strong> {e.need}</p>
      <p><strong>Report:</strong> {e.finding||"Not recorded"}</p>
      <p><strong>Request:</strong> {e.requested}</p>
      {!approved ? <button className="mt-3 rounded-lg border px-4 py-3" type="button" onClick={()=>setEntries(prev=>prev.filter(x=>x.id!==e.id))}>Remove concern</button>:null}
    </article>)}
   </section>
   <section className="space-y-3 rounded-xl border p-5">
    <h2 className="text-xl font-semibold">Review and export</h2>
    <p>Your entries are held only in this browser session. They are not saved or shared automatically. Download your draft before leaving.</p>
    <label className="flex items-start gap-3">
     <input type="checkbox" checked={approved} disabled={entries.length===0} onChange={e=>{setApproved(e.target.checked);setFrozen(e.target.checked?report:"");}} className="mt-2" />
     <span>I have reviewed this wording and approve it for my own use. Nothing will be sent automatically.</span>
    </label>
    <button disabled={entries.length===0} className="rounded-lg border px-5 py-3 disabled:opacity-50" type="button" onClick={download}>Download {approved?"approved wording":"draft"} (text)</button>
   </section>
 </main>;
}
