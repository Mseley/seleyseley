# Terminology glossary

Masterplan section 6 and section 9, step 3. One approved term per concept, so the product does not accumulate synonyms that quietly imply different commitment levels.

**This file is enforced.** `scripts/verify.mjs` reads the table below and fails the build if a banned term appears in product copy. Adding a row here adds a check; it is not a note for people to remember.

## The rules

| Concept | Approved | Banned in product copy | Why it matters |
|---|---|---|---|
| Somewhere the wedding could happen | **place** | venue | The workspace is called Places and the agent said "venue" in ten spots. Two words for one thing makes a reader wonder whether they are two things. |
| Someone providing a service, not a location | **vendor** | supplier, provider | A photographer is not a place. Keeping this distinct from "place" is what lets "place" stay precise. |
| A date being held for you, not yet committed | **hold** | reservation | The gap between held and booked is the difference between reversible and not. A synonym here misrepresents the level of commitment. |
| The other person getting married | **partner** | spouse, fiancé, fiancée, bride, groom, husband, wife | UI Plan 13. Never default to a gendered or heteronormative frame. |
| A time the place has agreed to | **confirmed** | booked, locked in, secured | UI Plan 9.2. The product must never imply it has booked something it has only proposed. |
| Work the agent does on its own | **standing approval** | auto, automatic, autopilot | Principle 2.8: autonomy is disclosed in terms of what the couple granted, not described as a machine property. |
| A fact with no source | **not confirmed** | TBD, N/A, unknown (as user-facing copy) | UI Plan 11.5. "Unknown" is the internal state name; the couple reads a sentence, not a status code. |

## Allowed exceptions

Some banned words are legitimate when they name a third party's own thing rather than ours:

| Exception | Why |
|---|---|
| "venue directory", "venue directories" | That is what those sites call themselves. Renaming a third party's category would be inaccurate. |
| "booked" in a negative construction, as in "nothing is booked until they answer" | Naming the thing that has *not* happened is the clearest way to draw the line. |

Exceptions are encoded in the checker, not applied by judgement at review time.

## Changing this file

Per section 11, a new term or a new ban needs the design systems lead and the content design lead jointly. Every row must name the concept, the approved term, and what is banned. A row with no ban is a preference, not a rule, and it does not belong here: if nothing is forbidden, nothing is enforced.
