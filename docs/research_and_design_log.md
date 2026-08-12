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

### The rule caught its own author, twice

Principle 2.9 says a rule is executable or it is decoration. Two defects found while writing the verification harness are the argument for it, because both were committed by someone who had just written the rule down.

`app.css` opens with a header stating that no raw hex value appears in the file. It contained seven hand-typed `rgba(29, 28, 26, ...)` washes, restating ink's value in the one place that claims not to. They now derive from ink through `color-mix` in the token file, so ink's value lives in exactly one place and `app.css` holds no color literal at all.

`displayValue` returned an em dash for a missing fact, in a product whose review checklist bans em dashes. It was user-visible copy, not a comment.

Neither was caught by reading, twice. Both are now one line each in `npm test`.

A useful side effect of the `color-mix` change: if a browser does not support it, the wash drops out and the state still reads through font weight, border, and wording. The colour was never load-bearing, which is UI Plan section 13 working as designed rather than as claimed.

### The harness was mutation-tested before being trusted

A suite nobody has seen fail is a suite nobody has tested. Four defects were planted deliberately in a throwaway copy:

| Planted defect | Caught by |
|---|---|
| `evaluate()` permits financial actions | Money refused at every level and scope, plus two collateral checks |
| An em dash and a doubled period in vision copy | The two editorial checks, separately |
| A hand-typed hex in `app.css` | No raw color literals |
| A scenario note claiming comfort while its arithmetic goes over | Each note agrees with the direction of its arithmetic |

Each was caught by the check written for it and not masked by another. The financial mutant tripping three checks rather than one is the correct behaviour: a permission hole should be over-detected, not under-detected.

### Modelling the apology produced a better apology

The masterplan listed one item under section 3 as Deferred: the correction scenario was narrative copy rather than a state transition. By the document's own principle 2.9, that made it decoration. A paragraph explaining one mistake is a promise that the *next* mistake will also be explained, made by people who may not be on the team by then.

Supersession is now modelled. A fact can be replaced; both stay in the record, and the replaced one is marked so it never renders as current or counts toward what the product knows. One field on the old fact, `actedOn`, does most of the work: it separates a quiet update from something the couple is owed an explanation for. Superseding a fact nobody saw produces silence, which is correct.

The result was better than the copy it replaced. Ranking the four states by certainty let the model read the *direction* of a correction, and this one moves downward: a Reported figure was replaced by an Inferred estimate, so the product ended up knowing less than it had implied. The generated text says so:

> That leaves us less certain than I implied, not more.

That sentence was not in the hand-written version. Nobody thought to write it. It exists because the transition was modelled rather than described, and it is arguably the most honest line in the product.

The remedy and the bound are now required fields rather than good intentions: `npm test` fails if a fact supersedes something the couple was shown without declaring both what is being done and what did not happen.

### The glossary caught real drift the moment it was enforced

Section 6 listed a terminology glossary as a thing to write. Writing it was not the point; enforcing it was. `docs/glossary.md` is now parsed by `npm test`, so adding a row adds a check.

On its first run it found what nobody had noticed by reading: **ten uses of "venue" against a hundred and seventy-eight of "place"**, in a product whose workspace is literally called Places. Two words for one thing makes a reader wonder whether they are two things. Also "unknown" leaking out of the data model into a user-facing toast, when Unknown is an internal state name and the couple is supposed to read a sentence.

Building the checker took three passes, and each failure was instructive about what "copy" actually means:

1. Regexing the source flagged `grid-template-columns: ... auto`. CSS is not copy.
2. Stripping style attributes still flagged `behavior: 'auto'`. A JS value is not copy either.
3. Extracting string literals flagged `'approve-venue'`. A hyphenated identifier looks like two words.

The working definition, arrived at by being wrong three times: **copy is a string literal containing two words separated by a space**, with console output excluded because it addresses engineers. Anything narrower misses real prose; anything wider drowns in code.

### Contested claims, and a refusal built into the type rather than the guidance

Supersession assumes the newer fact wins. Some facts have no winner: two live sources disagree and neither is the place itself. Averaging them, taking the pessimistic one, or quietly showing the most recent all invent a fact nobody stated.

The interesting part was not the model but where the refusal lives. Guidance saying "do not show one side of a dispute as the answer" would have held until the first deadline. Instead `displayValue()` returns "Sources disagree" for any contested fact, and each side's figure is reachable only through `sourceValue()`, which only the disputes component calls. **A screen cannot render one side as the answer even by mistake, because the ordinary value path will not produce one.**

The prototype's dispute is worth more than the decision it sits inside: The Orchard House's service charge is either 22 percent on top or included, a gap of about $6,292, against a $7,400 difference between the two places being compared. Stating the size is what turns "we should check that" into "we cannot decide until we check that." A dispute nobody has quantified stays open indefinitely.

### Writing the research protocols found a risk in the design

Protocol 6 asks whether admitting a mistake builds trust or spends it. That question did not exist until the exercise of writing "what result would mean we were wrong" forced an argument against the product's own feature.

The correction feature assumes disclosure earns trust. It could as easily read as an admission of unreliability, and it currently sits on the home screen in the only red element on a page designed to be calm. If participants generalise from one disclosed error to doubting everything, the feature is right and its prominence is wrong. That is now in the risk register, found by writing a falsification condition rather than by review.

### Verified before hand-off

- 49 of 49 verification checks pass, covering the trust model, contested claims, corrections, the permission model, scenario arithmetic, the enforced glossary, and design system enforcement.
- 21 of 21 contrast checks pass, including the three that must fail.
- No console errors or failed network requests on any route, desktop or mobile.
- Approval flow shows exact recipients before anything leaves the product.
- Revoking a delegation scope changes both the consequence line and the gate, live.
- A financial action stays gated at every delegation level.
- The Decision Room shows one place at a time below 1024px and both above it.
