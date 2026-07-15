"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import type { MasteryRecord } from "@/lib/access-intelligence/learning/schemas";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function LearningProgressClient() {
  const [mastery, setMastery] = useState<MasteryRecord[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    void fetch("/api/access-intelligence/learn/progress")
      .then((r) => r.json())
      .then((data) => {
        setMastery(data.mastery ?? []);
        setNote(data.note ?? "");
      });
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-slate-700">{note}</p>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Mastery by concept</caption>
        <thead>
          <tr className="border-b border-slate-200">
            <th scope="col" className="py-2 pr-4 font-black">
              Concept
            </th>
            <th scope="col" className="py-2 font-black">
              Level
            </th>
          </tr>
        </thead>
        <tbody>
          {mastery.length === 0 ? (
            <tr>
              <td colSpan={2} className="py-4 text-slate-500">
                No mastery records yet. Complete a Practice scenario to update concepts.
              </td>
            </tr>
          ) : (
            mastery.map((m) => (
              <tr key={`${m.userId}-${m.conceptId}`} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-semibold">{m.conceptId.replaceAll("_", " ")}</td>
                <td className="py-3">{m.level.replaceAll("_", " ")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <Link
        href="/access-intelligence/learn/scenarios"
        className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
      >
        Practice a scenario
      </Link>
    </div>
  );
}
