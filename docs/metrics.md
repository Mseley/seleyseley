# Metrics and instrumentation

Masterplan section 10 names five metrics and one anti-metric. This is the event schema behind them, so that "we should measure trust" becomes something an engineer can implement without inventing the definition themselves.

**Nothing here is instrumented yet.** The prototype has no backend and emits no events. This exists so that when instrumentation is built, the definitions come from the design program rather than from whatever was easiest to log.

## The rule that shapes all of it

A calm-agent product is unusually easy to measure wrongly. Every conventional engagement metric points the wrong way here: a couple who opens VowOS *less* because they have stopped worrying is the product working. So the schema below is built to answer **did the couple get to a good decision**, never **did the couple spend time with us**.

## What must never be logged

This list comes before the schema deliberately. A metric that requires reading a couple's private content is not worth having.

| Never logged | Why |
|---|---|
| Guest names, addresses, contact details, dietary or accessibility notes | UI Plan 10 restricts this inside the product. It has no business in analytics at all. |
| The text of the vision readback, notes between partners, or anything a couple wrote | Principle 2.6. A product that promises private preferences cannot mine them. |
| Message bodies sent to places or vendors | The couple authorised a send, not a corpus. |
| Which partner viewed what, at what time | The difference between shared planning and surveillance is exactly this. |

Events carry a household identifier and a partner identifier only where the metric genuinely requires attribution, and section 4 below constrains that.

## 1. North star: time from surfaced to resolved

*Does "one meaningful action per moment" reduce time to decision, or only time to scroll?*

| Event | When | Fields |
|---|---|---|
| `decision.surfaced` | A foreground decision first appears on the Planning Pulse | `household`, `decision_id`, `decision_kind`, `has_deadline`, `at` |
| `decision.resolved` | Both required approvals land | `household`, `decision_id`, `outcome` (`approved`, `declined`, `expired`), `at` |
| `decision.deferred` | The couple presses the defer action | `household`, `decision_id`, `at` |

**Computed:** median hours from `surfaced` to `resolved`, split by `decision_kind` and by whether a real deadline existed.

**Read it with care.** Faster is not automatically better. A decision resolved in four minutes may be one the couple did not understand. Pair this with metric 3 before concluding anything, and treat a fall in resolution *time* alongside a rise in confusion contacts as a warning, not a win.

## 2. Trust guardrail: how often a stated fact turns out to be wrong

*If this climbs, "trust is visible" is eroding even while the UI still looks calm.*

The supersession model makes this directly computable rather than estimated, because a walked-back claim is already a state transition rather than a judgement call.

| Event | When | Fields |
|---|---|---|
| `fact.confirmed` | A fact enters Confirmed | `household`, `fact_id`, `category`, `source_kind`, `at` |
| `fact.superseded` | A fact is replaced | `household`, `fact_id`, `category`, `was_acted_on`, `certainty_direction` (`up`, `down`, `level`), `at` |
| `fact.stale` | A Confirmed fact downgrades on age | `household`, `fact_id`, `category`, `age_days`, `at` |

**Computed:**

- **Correction rate**: `fact.superseded where was_acted_on` divided by all facts shown, by category.
- **Walk-back rate**: the subset where `certainty_direction = down`. This is the number that matters. The product knowing *more* over time is the system working; the product knowing *less* than it claimed is the promise breaking.
- **Staleness pressure**: `fact.stale` per category, which tells you whether a freshness window is set wrong rather than whether a source is unreliable.

A category whose staleness rate is high but whose walk-back rate is near zero has a window that is too short, not a data problem.

## 3. Calm guardrail: confusion about what the agent did

*A rise means the delegation model is being felt as opaque, regardless of how the UI reads in design review.*

| Event | When | Fields |
|---|---|---|
| `support.contact` | A support conversation is categorised | `household`, `reason_code`, `at` |
| `delegation.changed` | A level or scope is toggled | `household`, `level`, `scopes_on`, `direction` (`granted`, `revoked`), `at` |
| `approval.gate_shown` | An action is gated and the couple is asked | `household`, `action_id`, `reason_kind`, `at` |

`reason_code` must include, at minimum: `didnt_know_it_would_do_that`, `thought_it_had_done_something_it_hadnt`, `couldnt_tell_what_was_confirmed`, `wanted_it_to_act_and_it_asked`, `other`.

The first three are the failure modes of a delegated-execution product. The fourth is its opposite and is also worth knowing: an agent that asks too often is a different failure, not a safe default.

**Watch the ratio, not the count.** Revocations rising while gate-shown events fall means people are switching the agent off rather than telling you it is wrong.

## 4. Equity guardrail, and the tension inside it

*Tests "the relationship is shared" quantitatively.*

This one is genuinely uncomfortable, and pretending otherwise would be dishonest. Measuring whether both partners participate requires attributing actions to a partner, which is the same capability that would let the product tell one partner what the other has been doing. Principle 2.6 forbids the second thing while section 10 asks for the first.

**The constraint that resolves it:**

| Rule | Consequence |
|---|---|
| Partner attribution exists only in aggregate analytics, never in a product surface | No screen can ever show "Alex has approved 4 things this month" |
| The split is reported per cohort, never per household, to anyone inside the company | Nobody can look up one couple's balance |
| The product never acts on the split | It will not nudge the quieter partner, because that would convert a measurement into a pressure |

| Event | When | Fields |
|---|---|---|
| `approval.given` | A partner approves | `household`, `partner_slot` (`a` or `b`, stable per household, not a name), `decision_kind`, `at` |

**Computed:** distribution of the a/b split across households. A healthy result is a wide distribution, not a 50/50 average. Some couples divide work deliberately, and a product that treats that as a defect has confused fairness with symmetry.

## 5. The anti-metric

**Do not build, chart, or report:** session count, session duration, daily or weekly opens, screens per session, or any streak.

This is not a preference about dashboards. A couple who opens VowOS less often because they no longer worry is the product succeeding, and any dashboard that renders that as a declining line will eventually be optimised against. The cheapest way to protect the thesis is to never make the number visible.

If a specific question genuinely needs engagement data, it should be answered by a one-off analysis with a stated expiry, not by a standing metric.

## Sampling and retention

| Concern | Rule |
|---|---|
| Retention | Event-level data for 13 months, so a full planning cycle plus one month is analysable. Aggregates may persist. |
| Identifiers | `household` is a random identifier with no relationship to email, names, or the wedding date. |
| Deletion | Deleting an account deletes its events, not just its product data. |
| Sampling | None. These volumes are small, and sampling a rare-but-serious event like a walk-back would hide exactly what the guardrail is for. |
