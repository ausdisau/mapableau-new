# MapAble Search campaign media attribution

Status: **pending upload** (23 November 2026 Australia/Sydney).

Sydney GoPro-style dolly visuals and the brand-reveal video were specified for
MapAble Search but were not present in the Cloud Agent workspace at
implementation time. Do not invent substitute photographs or ship unrelated
music/lyric videos as campaign media.

## Expected source package

From `MapAble_Sydney_GoPro_Dolly_GIFs.zip` (illustrative 2.5D drawings — not
verified GoPro footage or access audits):

| Asset                                         | Notes                                            |
| --------------------------------------------- | ------------------------------------------------ |
| `MapAble_Sydney_harbour_bridge_POV_Dolly.gif` | 800×450, 5s, 12fps + preview PNG                 |
| `MapAble_Sydney_george_street_POV_Dolly.gif`  | same                                             |
| `MapAble_Sydney_opera_house_POV_Dolly.gif`    | same                                             |
| `MapAble_Sydney_barangaroo_POV_Dolly.gif`     | same                                             |
| `MapAble_Sydney_sydney_network_POV_Dolly.gif` | same                                             |
| Matching `*_preview.png` stills               | Prefer network or harbour bridge for first paint |
| `MapAble_Sydney_GoPro_Dolly_Storyboard.mp4`   | Silent ~23s storyboard                           |
| Contact sheet / scripts / JSON                | Keep outside the runtime bundle                  |

Separate campaign file:

| Asset                           | Notes                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `MapAble_Logo_Brand_Reveal.mp4` | Silent 1080×1080, ~5s, 24fps — optional “Watch brand reveal” only; not a splash gate |

Source notes state walking-profile map routes are **illustrative** and do not
prove wheelchair accessibility, step-free travel, gradients, kerbs, or lift
operation.

## Runtime paths (when approved exports are committed)

Under `public/brand/mapable-search/`:

- `sydney-network-poster.webp` (or harbour-bridge equivalent) — static poster
- `sydney-storyboard.mp4` — user-triggered, `preload="none"`, native controls, no autoplay
- Optional brand reveal linked separately — never required to use Search

Do **not** load all five GIFs on first paint. Honour `prefers-reduced-motion`.

Required caption (visible without playback):

> Concept visualisation — routes illustrative; accessibility not verified.

## Current runtime behaviour

[`MapAbleSearchMedia`](../../components/search/MapAbleSearchMedia.tsx) falls
back to the official MapAble brand lockup and keeps the Explore Sydney control
disabled until the poster and storyboard files above are present.
