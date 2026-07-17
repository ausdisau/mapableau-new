# Participation life plans

Participation plans move through draft, simulated, approved, executing, completed, paused, or cancelled states.

Plans reference `calendarEventId`, `bookingId`, `accessJourneyPlanId`, and `consentDirectiveIds` instead of duplicating those systems. Cancellation affects the participation plan only and does not block future access, booking, support, or journey options.

Support allocation is a Wave 16 adapter stub in this branch. The stub returns "Wave 16 workforce allocation is required" and performs no reservation.
