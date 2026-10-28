# MapAble Places — ATAG 2.0 / WCAG 2.2 AA acceptance plan

**Not an accessibility certification or completed conformance audit.** This document identifies implemented design intentions and outstanding tests.

## Scope
- Web: WCAG 2.2 A/AA as target; user-generated content editing assessed using ATAG 2.0 Part A (accessible editor) and Part B (support accessible output).
- React Native Android/iOS: equivalent interaction expectations using platform accessibility APIs (TalkBack/VoiceOver, switch and voice control).
- No claim of ATAG 2.0 AA or WCAG 2.2 AA conformance until manual assessments and disabled-person co-design complete.

## Critical tasks and expected outcomes
| User task | Pass condition | Current evidence | Remaining work |
|---|---|---|---|
| Find place without GPS | Search, filters, details accessible using text | \`ExploreScreen.tsx\` | Test browser and screen readers |
| Save a place privately | Explicit action, no public presence, survives relaunch | \`domain.ts\`, \`store.tsx\` | Native restart QA |
| Write a private place memory | Label, edit, delete, confirmation, recovery | \`SavedScreen.tsx\` | Manual focus and keyboard review |
| Contribute accessibility observation | Feature/source/date/uncertainty + preview + local save/edit | \`ContributeScreen.tsx\`, \`validateReport\` | Disabled author usability tests |
| Draft a CripSquare discussion | Contextual writing prompts, title/body validation and preview | \`CommunityScreen.tsx\`, \`validatePost\` | Real moderation and publishing interface NOT implemented |
| Explore community activity | Interest only, clearly not RSVP/check-in | \`CommunityScreen.tsx\` | Event safeguarding / consent review |
| Export or delete data | Explicit share control, no silent network operation, deletion confirmation | \`PrivacyScreen.tsx\` | Test on Android/iOS/web and loss-of-storage scenarios |

## WCAG 2.2 AA traceability (target)
| SC | Design response | Verify |
|---|---|---|
| 1.3.1 Info and Relationships | Native labels, headings, radio groups; semantic HTML via React Native Web | NVDA/Firefox and VoiceOver/Safari |
| 1.3.2 Meaningful Sequence | Linear content, no map-only action | 200%/400% zoom |
| 1.4.3 Contrast (Minimum) | Dark text on light surfaces, status text separate from colour | Measure every state incl. disabled, errors |
| 1.4.10 Reflow | Vertical scrolling, responsive tab placement | 320 CSS px and 400% zoom; fix any clipping |
| 1.4.11 Non-text Contrast | Visible boundaries for input, focus, selected state | Automated/manual contrast checks |
| 2.1.1 Keyboard | Pressables, no gestures/dragging required | Tab, Shift+Tab, Enter, Space, native switch |
| 2.4.3 / 2.4.7 / 2.4.11 | Reading order and visible, unoccluded focus | Keyboard navigation through tabs and forms |
| 2.5.7 Dragging Movements | No drag-and-drop interactions | Check all controls |
| 2.5.8 Target Size (Minimum) | ~45–50+ px targets | Measure on actual devices and at zoom |
| 3.3.1 / 3.3.2 / 3.3.3 | Form labels, errors and repair guidance | Test invalid date, short reports, empty posts |
| 3.3.8 Accessible Authentication | No authentication required in prototype | Reassess before AD.iD integration |
| 4.1.2 / 4.1.3 | Names, roles, states, live status/errors | Screen readers and focus after updates |

## ATAG 2.0 traceability
- **A.1**: editor interface aims to meet applicable accessible UI requirements.
- **A.2**: user content appears as editable text; text previews preserve content meaning.
- **A.3**: accessible keyboard/platform controls, logical navigation, user-controlled edits.
- **A.4**: saved/edited drafts, explicit cancellation and deletion confirmation; incomplete-draft recovery remains a gap.
- **B.1**: automatic output restricted to plain-text drafts, not automatic publication.
- **B.2**: assistive prompts about text equivalents, context, sources, measurable access features, and uncertainty.
- **B.3**: review/preview before save; errors identify required repairs.
- **B.4**: built-in authoring help and external instructions.
- **Deliberate limitation**: multimedia and rich text are disabled until accessible image alternative entry, captions, heading hierarchy and preview support are implemented.

## Manual test environment
1. Windows Firefox + NVDA: keyboard, radio state, focus, form labels and status announcements.
2. macOS Safari + VoiceOver: discover, save, compose, preview, cancel, delete.
3. Android TalkBack + large text + switch access: navigation and composing long text.
4. iOS VoiceOver + Dynamic Type + Voice Control: recovery, sharing and deletion.
5. 200% text zoom and 400% where applicable; landscape on narrow mobile widths.
6. Network disabled after first load; existing data remains editable.
7. Usability sessions with people with mobility, communication, sensory, cognitive and psychosocial disabilities, including AAC/voice alternatives.

## Priority blockers for production
- Secure authenticated storage and server-side participant ownership/consent.
- CripSquare API and moderation integration including reporting, blocking, escalation and dispute handling.
- Privacy impact assessment, threat modelling (coercion, stalking, incidental location disclosure).
- Proper content warnings and content safety policy; no real-time location check-ins.
- Feature-level provenance linking using canonical AccessPlace IDs, not directory summary guesses.
- Full ATAG/WCAG regression evidence; accessible publication and author-repair workflows.
