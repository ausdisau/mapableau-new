import {
  addCalendarDays,
  isValidDateOnly,
  sydneyDateKey,
} from "@/lib/care/scheduler/ui-model";

export const PASSENGER_PATH = "/transport/passenger";
export const APPOINTMENT_PLAN_PATH = PASSENGER_PATH + "?plan=appointment";
export const APPOINTMENT_DRAFT_KEY = "mapable-care-transport-appointment-draft";

export type AppointmentDraft = { date: string; time: string };

export function sampleCareAppointment(now: Date): AppointmentDraft {
  return { date: addCalendarDays(sydneyDateKey(now), 1), time: "10:30" };
}

export function storeAppointmentDraft(appointment: AppointmentDraft) {
  try {
    const { date, time } = appointment;
    window.sessionStorage.setItem(
      APPOINTMENT_DRAFT_KEY,
      JSON.stringify({ date, time }),
    );
  } catch {
    // The passenger can still enter a date and time manually.
  }
}

export function takeAppointmentDraft(): AppointmentDraft | null {
  try {
    const raw = window.sessionStorage.getItem(APPOINTMENT_DRAFT_KEY);
    window.sessionStorage.removeItem(APPOINTMENT_DRAFT_KEY);
    if (!raw) return null;
    const input = JSON.parse(raw);
    if (
      typeof input?.date === "string" &&
      isValidDateOnly(input.date) &&
      typeof input.time === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)
    ) {
      return { date: input.date, time: input.time };
    }
  } catch {
    // Includes browsers that block storage and drafts from older versions.
  }
  return null;
}
