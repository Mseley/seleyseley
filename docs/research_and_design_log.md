# Research and design log

## Diagram review, August 11, 2026

- `agentic_architecture.png` rendered successfully at 3120 x 980 pixels. It shows the people and channels, experience, intelligence, control, and Wedding State Graph layers with legible labels. The diagram is intentionally wide, appropriate for a landscape masterplan page or focused zoom.
- `couple_journey.png` rendered successfully at 3120 x 412 pixels. It presents the end-to-end journey and four critical value moments in a concise sequence.
- `approval_workflow.png` rendered successfully and will be added to the final masterplan after visual verification.

## Version 2 diagram review, August 11, 2026

- `v2_venue_intelligence.png` rendered successfully at 3120 x 1012 pixels. It clearly separates couple inputs, intent interpretation, the Venue Intelligence Graph, matching and decision system, and authorized coordination. The wide format is appropriate for a masterplan architecture page.
- `v2_content_pipeline.png` rendered successfully at 3120 x 364 pixels. It presents the content system as a controlled flow from a factual contract through grounding, editorial linting, critique, approval, publication, and audit.

## UI plan diagram review, August 11, 2026

- `vowos_ui_information_architecture.png` rendered successfully at 3120 x 1232 pixels. It shows the intentionally shallow workspace structure, with Today, Vision, Places, Plan, Guests, and More leading to the Decision Room when a meaningful choice is ready.
- `vowos_ui_decision_flow.png` rendered successfully at 3120 x 536 pixels. It illustrates the calm decision loop from Planning Pulse through evidence, approval, and a quiet receipt, including an "ask VowOS" route for unresolved questions.

---

## Build log, August 11, 2026

The design program moved from specification to running code. What follows is what the build found, in the order it found it, because several of these are things no amount of review would have caught.

### The contrast audit found a real defect on its first run

Terracotta on paper measures **4.48:1**, below the 4.5:1 AA minimum for body text. Paper is the background of every decision surface in the system, so terracotta body copy on a decision surface would have shipped failing AA.

The palette was specified precisely and reviewed carefully, and the defect was still there, because 4.48 and 4.5 are indistinguishable to the eye. Recorded as standing finding CF-01: terracotta is cleared as a button fill, a left rule, and large-text emphasis at 24px and above, never as body text.

This is the origin of principle 2.9. The colour bans in UI Plan section 13 are now three assertions in the audit that are *required to fail*, so the ban breaks the build if a value is ever softened.

### Porcelain and paper resolved as a component rule, not a colour change

UI Plan 3.1 flagged that the two surfaces sit close enough to collapse on a low-quality panel in daylight. Measured, they differ by 1.09:1.

The resolution was not to push the values apart, which would have cost the warmth the palette exists for. Every paper surface carries a hairline border in addition to its fill, so layering never depends on the fill alone. Recorded as CF-02.

The same reasoning applied to the desktop rail: because it is sticky and one viewport tall, its column stopped mid-scroll on a long page. The column is now painted on the shell rather than on the rail element, so it reads as continuous.

### The trust model earned its place immediately

One fact was authored deliberately stale: The Orchard House confirmed the couple's date on July 20, which is 22 days before the prototype's fixed present, against a 14 day availability window.

It renders as *"Confirmed by The Orchard House on July 20. Availability facts age after 14 days, so we will re-check before you commit."* No screen author wrote that sentence, and no screen author could have forgotten to write it. That is the difference between a data model and a convention.

### The Decision Room failed at 390px, in the way the plan predicted

Stacking two columns under one row label produced exactly the failure UI Plan 9.3 warned about: under "Cost", the mobile layout showed `$34,200` and `$26,800` in sequence with no indication of which place either belonged to. The comparison was unreadable while looking, at a glance, fine.

Fixed as the plan specifies: one place at a time with a persistent switcher. The lesson is that a responsive rule can be followed at the CSS level and broken at the comprehension level, and only the second one matters.

### Small copy defects that specification does not catch

- `fmtTime` returns "5:30 p.m.", already ending in a period. Three sentences appended a second one. Now a stated content rule.
- Number style drifted within a single sentence: "five of 8 facts verified". Spelled-out numbers are now applied by a function rather than remembered.
- A display heading began with a lowercase generated number word.

None of these are interesting individually. Together they are the argument for generating copy from one place per pattern rather than composing it per screen.

### Accessibility findings

- The skip-link target takes programmatic focus on every navigation, which is correct. It also painted a focus outline around the entire page, visible below the sticky rail. Outline suppressed on that element only; focus behaviour kept.
- Keyboard focus was being lost on every re-render, since the app re-renders the whole screen. The app now records the focused control before rendering and restores it after. Without this the keyboard claim in UI Plan section 13 would have been aspirational.
- Verified tab order from the top of the Planning Pulse: skip link, then the six workspaces, then the agent status, then the one primary action. That ordering is the information architecture, read aloud.

### Imagery

There is no licensed venue photography and UI Plan section 14 bans generic stock couples, so every place image is a drawn composition: layered flat shapes in palette-derived colours, one per venue, deterministic. Six scenes, all inline SVG, no external requests.

This is the third option the plan already permits, not a placeholder for photography. It carries a visible credit line wherever it could be mistaken for a photograph of the real place, which means the imagery rule is demonstrated by the prototype rather than merely described by it.

### Verified before hand-off

- 21 of 21 contrast checks pass, including the three that must fail.
- No console errors or failed network requests on any route, desktop or mobile.
- Approval flow shows exact recipients before anything leaves the product.
- Revoking a delegation scope changes both the consequence line and the gate, live.
- A financial action stays gated at every delegation level.
- The Decision Room shows one place at a time below 1024px and both above it.
