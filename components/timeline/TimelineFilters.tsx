"use client";

export function TimelineFilters() {
  return (
    <form className="flex flex-wrap gap-2" aria-label="Filter timeline">
      <label className="sr-only" htmlFor="timeline-type">
        Event type
      </label>
      <select
        id="timeline-type"
        name="eventType"
        className="min-h-11 rounded-lg border border-input px-3"
        defaultValue=""
      >
        <option value="">All activity</option>
        <option value="booking_created">Bookings</option>
        <option value="goal_created">Goals</option>
        <option value="support_ticket_opened">Support</option>
      </select>
    </form>
  );
}
