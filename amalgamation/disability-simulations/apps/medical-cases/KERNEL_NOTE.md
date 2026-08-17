# Kernel migration note

This app currently ships a standalone JS runtime (`src/runtime.js`) with the same
AAC-pause and evidence-gated station invariants as `@ausdisau/sim-kernel`.
Next step after remote publish: reimplement stations on `SimulationKernel` events.
