import {
  addCalendarDays,
  isValidDateOnly,
  sydneyDateKey,
} from "@/lib/care/scheduler/ui-model";

import { sealPracticeValue, unsealPracticeValue } from "./passenger-storage";

export const PASSENGER_PATH = "/transport/passenger";
export const APPOINTMENT_PLAN_PATH = PASSENGER_PATH + "?plan=appointment";
export const APPOINTMENT_DRAFT_KEY = "mapable-care-transport-appointment-draft";

export type AppointmentDraft = { date: string; time: string };
let memoryDraft: AppointmentDraft | null = null;
export function sampleCareAppointment(now: Date): AppointmentDraft {
  return { date: addCalendarDays(sydneyDateKey(now), 1), time: "10:30" };
}
export async function storeAppointmentDraft({ date, time }: AppointmentDraft) {
  memoryDraft = { date, time };
  try {
    window.sessionStorage.removeItem(APPOINTMENT_DRAFT_KEY);
    const sealed = await sealPracticeValue(
      APPOINTMENT_DRAFT_KEY,
      JSON.stringify({ date, time }),
    );
    window.sessionStorage.setItem(APPOINTMENT_DRAFT_KEY, sealed);
    memoryDraft = null;
  } catch {
    /* Keep the one-time handoff in memory if private storage is unavailable. */
  }
}
export async function takeAppointmentDraft(): Promise<AppointmentDraft | null> {
  const fallback = memoryDraft;
  memoryDraft = null;
  try {
    const raw = window.sessionStorage.getItem(APPOINTMENT_DRAFT_KEY);
    window.sessionStorage.removeItem(APPOINTMENT_DRAFT_KEY);
    if (!raw) return fallback;
    // A draft left by an earlier preview is consumed once and never written back.
    const plain = raw.startsWith("{")
      ? raw
      : await unsealPracticeValue(APPOINTMENT_DRAFT_KEY, raw);
    const input = JSON.parse(plain);
    if (
      typeof input?.date === "string" &&
      isValidDateOnly(input.date) &&
      typeof input.time === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)
    ) {
      return { date: input.date, time: input.time };
    }
  } catch {
    /* A malformed or unavailable draft can be entered manually. */
  }
  return fallback;
}
