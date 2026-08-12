# VowOS Design Program Masterplan
## From a strong visual direction to a system that holds

**Status:** Masterplan, version 2.0
**Supersedes:** Masterplan v1.0
**Builds on:** Project VowOS UI and Experience Plan, v1.1
**Purpose:** v1.0 audited the UI Plan and named six gaps. This version closes four of them in working code, specifies the remaining two as process, and records what building the thing taught us that no amount of specification would have.

---

## 0. How to read this document

The UI Plan is the *what*. v1.0 of this masterplan was the *how it stays true*. This version is the *how it stays true, and here is the part that now runs*.

Three kinds of statement appear here, and they are labelled, because a plan that does not distinguish them is how teams end up believing a specification is a system:

| Marker | Meaning |
|---|---|
| **Built** | Exists as running code in this repository. A reader can execute it. |
| **Specified** | Precisely defined here, not yet built. Someone still has to do it. |
| **Deferred** | Deliberately not decided yet, with the reason and the trigger for deciding. |

Nothing here contradicts the UI Plan. Where this document adds a rule, it cites the UI Plan section it extends.

---

## 1. What changed since v1.0

v1.0's audit rated six dimensions as **Gap**. Their status now:

| v1.0 gap | Status | Where it lives |
|---|---|---|
| Agent behavior and autonomy | **Built** | `prototype/js/model.js`, delegation model. Three levels, four grantable scopes, a closed registry of nine actions, live evaluation. Section 4 below. |
| Engineering handoff and tokenization | **Built** | `design-system/tokens.json` plus `build.mjs`. Single source, generated CSS, drift check, contrast gate. Section 5 below. |
| Trust data model (rated *solid but incomplete*) | **Built** | `prototype/js/model.js`, four states plus automatic staleness downgrade. Section 3 below. |
| Research and validation | **Materials built, none run** | Section 7 plus [`docs/research/`](research/): an interview guide, eight protocols, a screener. No session has happened. |
| Success metrics | **Specified** | Section 10, with the event schema in [`docs/metrics.md`](metrics.md). |
| Governance and change control | **Built in part** | The token pipeline, the glossary, and CI enforce the mechanical half on every push. The human half, Section 11, is still process. |
| Risk awareness | **Specified**, updated | Section 12, with two risks retired and two added from the build. |

**The honest headline:** the load-bearing frameworks are real, the design system is real, and the six priority artifacts exist at high fidelity. Everything involving *other people* (research participants, metrics from real couples, a named accessibility owner) is still specification, because it cannot be built, only staffed.

---

## 2. Design principles

The UI Plan's six principles (Section 2) hold unchanged. v1.0 added two. Building the system earned a third.

### 2.7 Every trust claim has a machine-checkable source

"Verified by the place on June 8" is a promise, not a caption. If a fact shown as verified cannot be traced to a timestamped source in the data model, it must not use verified language. **Built:** `V.trust.resolve()` is the only path to an evidence line, and `V.trust.displayValue()` refuses to print a figure for an Unknown, because a figure implies a source.

### 2.8 The agent's autonomy is disclosed, not just its output

Users should never have to infer what VowOS may do on its own by watching what it did last time. **Built:** every delegation decision returns a plain-language reason, and that reason is rendered next to the action *before* it is taken, not after.

### 2.9 A rule is executable or it is decoration

This one is new, and it comes from the build. The UI Plan bans rose clay, mist blue, and soft gold as text colors. That ban survived exactly as long as someone remembered it. It is now three assertions in the contrast audit that are *required to fail*, so the ban breaks the build if a value is ever adjusted to make it passable.

The general form: when a rule can be expressed as a check, expressing it as prose instead is a decision to let it rot. Not every rule can be checked. Those that can, must be.

The principle turned on its author twice, which is the best argument for it. The first pass of `app.css` carried seven hand-typed `rgba(29, 28, 26, …)` washes, restating ink's value in the one file whose header claims no raw color appears in it. The same pass shipped an em dash in `displayValue`, in a document that bans em dashes. Both were written by someone who had just written the rule down, and neither was caught by reading. They are now two lines in `npm test`.

A corollary, learned the same way: **a check that cannot fail is also decoration.** The harness in `scripts/verify.mjs` was mutation-tested before being trusted. Granting a financial action, planting an em dash and a doubled period, hand-typing a hex value, and inverting a scenario's arithmetic were each introduced deliberately; each was caught by the check written for it, and by no other. A suite nobody has seen fail is a suite nobody has tested.

---

## 3. Trust and evidence data model  **Built**

Every fact the product surfaces resolves to exactly one of four states, and only these four, so the evidence vocabulary in UI Plan 11.3 stays honest at scale.

| State | Definition | How it reads | Example in the prototype |
|---|---|---|---|
| **Confirmed** | Sourced directly from the place, the vendor, or an official document, with a timestamp | "Verified by The Orchard House on August 4." | Site fee of $34,200 |
| **Reported** | Stated by a third party but not confirmed by the primary source | "According to a Hudson Valley venue directory, not yet confirmed." | A 22 percent service charge |
| **Inferred** | Derived by the agent from a pattern, not stated by anyone | "Our estimate based on three comparable places in Hudson." | Maison 98's service charge |
| **Unknown** | Actively not established, and the agent knows it | "We have not confirmed this yet. I asked on August 9 and expect an answer this week." | Whether outside catering is allowed |

**Design rule, enforced in code:** a fact with no resolved state does not silently vanish and does not quietly render as a value. It resolves to Unknown and writes a console warning naming itself. An omission reads as confidence the product does not have.

### 3.1 Staleness

Every Confirmed fact carries an expected freshness window by category. Past that window it downgrades one level, toward Reported, without waiting for a user to notice a discrepancy.

| Category | Window | Reasoning |
|---|---:|---|
| Availability | 14 days | A date can be taken by another couple any week |
| Pricing | 90 days | Rate sheets move seasonally |
| Policy | 180 days | Curfews and rules change slowly |
| Capacity and capability | 365 days | Buildings rarely change size |
| Contract | 365 days | Signed terms are stable until renegotiated |

The prototype ships one deliberately stale fact so the mechanism is visible rather than theoretical: The Orchard House confirmed your date on July 20, which is 22 days before the prototype's fixed present, against a 14 day window. It renders as *"Confirmed by The Orchard House on July 20. Availability facts age after 14 days, so we will re-check before you commit."* No screen author wrote that sentence.

### 3.2 Supersession  **Built**

A fact can be replaced. The record keeps both, because the history is what makes a correction checkable, and the replaced fact is marked superseded so it never renders as a current claim or counts toward what the product knows.

Two fields carry the weight:

| Field | On | What it does |
|---|---|---|
| `actedOn` | The old fact | States what the product did with it. This is what separates a correction from a quiet update. |
| `supersededBecause`, `remedy`, `bound` | The new fact | What replaced it, what is being done, and what did *not* happen as a result. |

Superseding a fact nobody was shown is an update, and the product says nothing. Superseding a fact the couple was shown produces a correction, assembled by `V.trust.corrections()`. See section 4.5.

The model also reads the **direction** of the change. Certainty is ranked (Confirmed 3, Reported 2, Inferred 1, Unknown 0), and when a replacement lowers it, the correction says so outright: *"That leaves us less certain than I implied, not more."* That sentence was not in the hand-written version of this apology. It only appeared once the transition was modelled, which is the argument for modelling it.

### 3.3 Contested claims  **Built**

Supersession assumes the newer fact wins. A **contested** claim has no winner: two live sources describe the same thing, they disagree, and neither is the primary source. Averaging them, taking the pessimistic one, or quietly showing the most recent are all ways of inventing a fact nobody stated.

Facts sharing a `claim` identifier are contested when more than one is live. The product then does three things and refuses a fourth:

| It does | It refuses |
|---|---|
| Shows both sides at identical visual weight, each with its own evidence line | To mark either side as likelier |
| States what the disagreement is worth, in money, when that can be computed | To put either figure into a total, a scenario, or a comparison |
| Names what would settle it, and what has already been asked | |

**The refusal is structural, not editorial.** `displayValue()` returns "Sources disagree" for any contested fact. Each side's figure is reachable only through `sourceValue()`, which only the disputes component calls. A screen therefore cannot render one side of a disagreement as the answer, even by mistake, because the ordinary value path will not produce one.

In the prototype: The Orchard House's service charge. A directory says 22 percent on top of food and drink; the place's own 2026 brochure says it is included. That is about $6,292 apart, which is larger than the gap between the two places under consideration. The product says so, and puts neither number in the budget.

**Why the sizing matters.** A dispute nobody has quantified is easy to leave open indefinitely. Stating that this one is worth more than the decision it sits inside is what turns "we should check that" into "we cannot decide until we check that."

---

## 4. Agent behavior and permission model  **Built**

The UI Plan's agent-language table (11.3) shows the agent sending inquiries, following up, and proposing tour times. None of that is safe without an explicit permission model, because the calm tone of 11.3 describes an agent that overstepped exactly as well as one that did not.

### 4.1 Delegation levels

| Level | What the agent may do without asking again | What still requires explicit approval |
|---|---|---|
| **Propose only** | Draft a message, a shortlist, or a plan and hold it for review | Everything that leaves the product or touches a third party |
| **Act with standing approval** | Act within a scope the couple has explicitly pre-approved | Anything outside that stated scope, any financial commitment |
| **Act and report** | Fully reversible, zero-cost, zero-external-party actions only | Never extends to money, contracts, or communication with vendors or guests |

### 4.2 Scopes

Under "Act with standing approval," the couple grants named permissions, each stated in plain language before the agent acts on it:

- Follow up once if a place has not replied in five days
- Propose tour times to places you have saved
- Ask a place for a fact we are missing, like a fee or a curfew
- Send a first inquiry to a place you have not saved yet *(off by default)*

### 4.3 The line that does not move

**Money and irreversible commitments never resolve to allowed, at any level, under any scope.** This is a hard branch at the top of `evaluate()`, before level and scope are consulted, so it cannot be reached around by a future scope. In the product this reads as: *"Anything involving money or a commitment always comes back to you both, whatever your settings say."*

### 4.4 The closed action registry

Nine actions are declared. An action that is not declared cannot be performed. This is the structural answer to autonomy creep: a new capability requires a new registry entry, which is a visible diff, rather than accumulating as one reasonable-looking feature at a time.

The Design system page in the prototype renders this registry evaluated live against the current settings, so the documentation of the permission model cannot describe a model the product does not have.

### 4.5 The agent must be able to say it was wrong  **Built**

UI Plan 11.3's "gentle correction" covers misunderstanding *before* acting. This covers having already acted on wrong information, which for a product executing real communications is a when, not an if.

**The correction is generated, not written.** `V.trust.corrections()` assembles it from the supersession in section 3.2, in this order:

| Clause | Source | Rendered |
|---|---|---|
| What was said, and when | The old fact's value and date | "On August 6 I told you the service charge at Maison 98 was 18 percent." |
| Where it came from | The old fact's source | "That came from a venue directory," |
| What it affected | `actedOn` | "and it was in the budget comparison I put in front of you." |
| What replaced it | `supersededBecause` | "Their proposal arrived on August 7 and does not state a service charge at all." |
| What is being done | `remedy` | "I have taken that figure out of your comparison and asked Maison 98 to confirm the real one." |
| The direction of the change | Derived from the certainty ranks | "That leaves us less certain than I implied, not more." |
| The bound on the damage | `bound` | "Nothing was sent to anyone and no money was committed on it." |

The last clause is the one teams forget, and it is the one that decides whether trust survives. It is now a required field: `npm test` fails if a fact supersedes something the couple was shown without declaring both a remedy and a bound.

This matters more than it looks. A hand-written apology is a promise that the *next* mistake will also be explained, made by someone who may not be on the team by then. A generated one is a property of the system.

---

## 5. Design system governance and tokenization  **Built**

| Layer | Owner | Format | Change process |
|---|---|---|---|
| Design tokens | Design systems lead | `design-system/tokens.json`, consumed by the build | Any change requires a documented reason and passes the contrast gate. `npm run check` fails on drift. |
| Components | Shared design and engineering pair | `prototype/js/components.js`, each carrying its 11.2 design rule as a comment | A new component requires its design rule *before* build |
| Copy and agent language | Content design lead | Rendered from one place per pattern | Any new situation requires the "avoid" column, not just the preferred language, so the pattern is falsifiable |
| Interaction washes | Design systems lead | Derived from ink with `color-mix` in the token file, never restated as literals | Ink's value stays in exactly one place. If `color-mix` is unavailable the wash drops out and the state still reads through weight, border, and wording, which is UI Plan 13 working as intended. |

**The rule that prevents drift:** nothing in UI Plan sections 3, 11, or 14 exists in two places with two values. `prototype/styles/tokens.css` is generated and carries a do-not-edit header. `app.css` uses no raw hex, spacing number, or duration.

### 5.1 Standing findings from the contrast audit

The audit is not decoration. It found something on the first run.

**CF-01 — Terracotta is a fill, not a text color.** Terracotta measures 4.88:1 on porcelain and **4.48:1 on paper**, which is below the 4.5:1 AA minimum for body text. Since paper is the background of every decision surface, terracotta body copy on a decision surface would have failed AA. It is therefore cleared only as a button fill, a left rule, and large-text emphasis at 24px and above. Small text needing a warm accent uses ink or moss (6.89:1 on paper).

This is precisely the class of error that ships when a palette is specified in prose and implemented by eye.

### 5.2 What `npm run check` enforces

The governance in this section is only as good as the gate in front of it. One command, no dependencies, runs in about a second:

| Gate | What it catches |
|---|---|
| Token drift | A generated file edited by hand, or one left stale after a `tokens.json` change |
| Contrast | Any of 21 required pairs regressing, and any of the three banned text colors becoming passable |
| Trust model | Staleness not firing, an unstated fact rendering as something other than Unknown, a figure printed for a state that has no source |
| Corrections | A superseded fact still rendering as current, a replaced claim producing no correction, a correction missing its remedy or its bound, or an apology reappearing as hand-written copy |
| Permission model | A financial action permitted at any level under any scope, an external action escaping propose-only, an undeclared action being reachable, an evaluation returning no user-facing reason |
| Scenario coherence | Copy quoting a figure the data no longer supports, a scenario note contradicting its own arithmetic, the shortlist exceeding five |
| Editorial rules | Em dashes, doubled periods, placeholder leakage, and every banned term in the glossary, including gendered defaults and any synonym for a commitment level |
| Design system | A raw color literal in `app.css`, a token with no stated usage rule |

The permission-model gate matters most. It is the only one where a regression is a safety failure rather than a quality failure, and it is the one a code review is least likely to catch, because permitting an action looks exactly like enabling a feature.

**CF-02 — Porcelain and paper are close by design, so layering never relies on fill alone.** The two surfaces differ by 1.09:1. UI Plan 3.1 flagged the risk that they collapse on a low-quality panel in daylight. The resolution: **every paper surface carries a hairline border in addition to its fill.** Removing that border is a system change, not a visual preference. The same reasoning drove painting the desktop rail column on the shell rather than on the sticky rail element, so the column reads as continuous down a long page.

---

## 6. Content design system  **Specified**

| Component | Content |
|---|---|
| Voice principles | Direct, dated, concrete, first person for the agent, never apologetic beyond what is warranted, never performing enthusiasm |
| Terminology glossary | **Built** as [`docs/glossary.md`](glossary.md), and enforced rather than remembered: `npm test` parses the table and fails on a banned term in user-facing copy, so adding a row adds a check. Seven concepts, twenty banned terms. A time is **proposed**, **held**, or **confirmed**, and those three words are never traded for each other. |
| Number style | Small numbers are spelled out in agent sentences ("five inquiries," "three days from now"), figures are used for money and counts in tables. Implemented as `V.numberWord()` so the rule is applied rather than remembered. |
| Sentence assembly | Formatted values that already end in a period, such as "5:30 p.m.", never take a second one. This sounds trivial and it produced a real defect during the build. |
| Edge-case taxonomy | **Specified, not built.** Guest-provided content unsafe to publish; a vendor unresponsive past the follow-up window; a couple asking for something outside any delegation level; a Confirmed fact later found false. |
| Localization notes | Which phrases are idiomatic English that will need rewriting, not translating. Flagged now because it is cheap now. |

---

## 7. Research and validation program  **Materials built, no research run**

The UI Plan 17.1 acceptance-test methods are the *instruments*. This is the *program*. The runnable materials now live in [`docs/research/`](research/): a generative interview guide, seven evaluative protocols, and a screener with the recruiting quotas built in.

**Every protocol states, before it runs, what result would mean we were wrong.** This is the research form of principle 2.9: a study that cannot come back negative is theatre, and it is the expensive kind, because it produces confident-sounding evidence for whatever the team already believed. The verification suite was mutation-tested for the same reason.

Three protocols cover claims the UI Plan never proposed testing, and all three are load-bearing:

- **Can a user state what the agent may do without asking?** The master checklist asks this and it has never been tested. The pass condition is narrow: they must get the money boundary right. Anyone who believes VowOS can commit money on their behalf is a person the product has quietly frightened.
- **Does admitting a mistake build trust or spend it?** See risk register.
- **Proposed, held, or confirmed.** A user who believes something is booked when it was only proposed is the most expensive misunderstanding a delegated-execution product can produce.

| Phase | Timing | Method | What it validates |
|---|---|---|---|
| Generative | Before the priority artifacts are finalized | Contextual interviews with couples currently planning, both partners separately and together | Whether "calm agent" is the felt need, or the team's taste |
| Evaluative, round one | Once Planning Pulse and Vision Readback exist | The 17.1 protocols, five to eight participants per test | Whether the five-second and "feels understood" claims hold under real use |
| Evaluative, round two | Once Decision Room and Tour coordination exist | Moderated sessions recruiting couples who disagree on at least one real decision | Whether the disagreement handling de-escalates rather than performing neutrality |
| Ongoing | Post-launch, quarterly | A rotating sample including at least one same-sex couple, one couple with family-contributor involvement, one couple planning within a tradition outside the design team's background, and one professional planner | Whether the inclusion claims are true in practice, not just in intent |

**Recruiting rule:** every evaluative round includes at least one household where both partners are interviewed. The product's central differentiator, shared and non-surveilling planning, cannot be validated by interviewing one partner and assuming the other's experience.

**A caution the prototype makes concrete.** The Decision Room is currently built on one disagreement scenario, written by the same people who designed the response to it. That is a demonstration, not evidence. Round two exists to find out whether real couples experience the held-open decision as respectful or as the product refusing to help.

---

## 8. Accessibility as a process  **Specified**, with a built floor

UI Plan section 13's checklist stays. It needs a cadence and an owner to hold at scale.

| Element | Specification |
|---|---|
| Owner | One named accessibility lead with authority to block a release, not just flag issues |
| Cadence | **Built.** `.github/workflows/check.yml` runs the contrast audit, the token drift check, and the verification suite on every push. Until that file existed no build ran, which made this row a claim rather than a cadence. A full manual screen-reader and keyboard pass still happens per artifact, and the research kit puts both users inside the ordinary evaluative rounds rather than in a separate track. |
| Blocking bar | Any regression against the Section 13 table blocks release. New features are not exempt because they are new. |
| Real-user testing | At minimum one screen-reader user and one keyboard-only user in every evaluative round, not a separate accessibility track that runs later and less often |

**What the build already enforces**, so the process starts above zero rather than at it:

- Contrast is a build gate, not a review item. 21 pairs, measured, blocking.
- Every state is carried by icon and wording as well as color.
- Focus is visible, and it *survives a re-render*: the app records the focused control before rendering and restores it after, which is what makes the keyboard claim real rather than aspirational.
- `prefers-reduced-motion` removes every transition. `prefers-contrast: more` strengthens borders and lifts metadata to full ink.
- The skip link targets main, which takes programmatic focus on every navigation without painting an outline around the whole page.
- Touch targets are 44px minimum, enforced by a token rather than per component.

---

## 9. Engineering handoff  **Built**

| Step | Deliverable | Status |
|---|---|---|
| 1. Tokens as code | `tokens.json` is the literal source the frontend consumes. No manual re-entry of hex values or spacing numbers. | Built |
| 2. Components with usage docs | Each component carries its design rule as a comment where it is implemented, not in a separate document engineers may not open. | Built |
| 3. Copy from one source | Evidence sentences are written in exactly one function, corrections are assembled in exactly one function, and the glossary is enforced against all product copy. A screen cannot compose its own vocabulary. | Built |
| 4. Visual QA gate | Side-by-side design-versus-build review against UI Plan section 15 before ship. | Specified |
| 5. Figma parity | The token file is designed to be consumed by Figma as well as the codebase. That side does not exist yet. | **Deferred** until there is a Figma file worth binding |

---

## 10. Success metrics and guardrails  **Specified**, with the schema in [`docs/metrics.md`](metrics.md)

| Metric type | Example | Why it matters here specifically |
|---|---|---|
| North star | Share of foreground decisions resolved within one week of surfacing | Tests whether "one meaningful action per moment" reduces time-to-decision, not just time-to-scroll |
| Trust guardrail | Rate of Confirmed facts that later downgrade or are found wrong | If this climbs, "trust is visible" is eroding even while the UI still looks calm. The supersession model in section 3.2 makes this directly computable rather than estimated: a walked-back claim is already a state transition. The number that matters is the subset where certainty went *down*. |
| Calm guardrail | Support contacts citing confusion about agent actions | A rise means the delegation model is felt as opaque regardless of how the UI reads in design review |
| Equity guardrail | Decision-approval split between partners in shared households | Tests "the relationship is shared" quantitatively. It is also the one metric in genuine tension with principle 2.6, since attributing actions to a partner is the same capability that would let the product report on one partner to the other. `docs/metrics.md` section 4 states the constraints that resolve it: aggregate only, never per household, and the product never acts on the split. |
| **Anti-metric** | Do not optimize screen time, session count, or daily opens | A calm-agent product that couples open *less* because they no longer worry is working as intended. Treating reduced engagement as failure would contradict the product's own thesis. |

---

## 11. Governance model

| Question | Answer |
|---|---|
| Who approves a new color, component, or agent-language pattern? | Design systems lead and content design lead jointly. Never a single-discipline unilateral change. |
| Who approves a new agent capability? | Product lead and design lead jointly, with the action registry (Section 4.4) updated in the same change. Never a silent capability expansion. |
| How does this document stay current? | The UI Plan and this masterplan are versioned together. Any UI Plan change affecting a Section 3 to 8 framework requires a corresponding update in the same release. |
| What triggers a full review against UI Plan section 15? | Any priority artifact, any new workspace, and any change to the trust or delegation model. |
| What does the build enforce without a human? | Token drift, contrast, and the ban on the three fill-only colors as text. |

---

## 12. Risk register

**Retired since v1.0:**

- *Trust UI outruns the trust data model.* The four-state model now ships before the evidence component, and the evidence component cannot be used without it.
- *Design system forks under deadline pressure.* The manual step where drift starts has been removed; `npm run check` catches it.

**Standing:**

| Risk | Why it matters | Mitigation |
|---|---|---|
| Agent autonomy creep | Each expansion feels reasonable; the cumulative effect is an agent acting far beyond what any single approval covered | Closed action registry, joint sign-off, and the hard financial branch that no scope can reach around |
| Calm aesthetic mistaken for calm product | A quiet UI can hide a confusing or overstepping agent as easily as it can express a well-run one | The calm and trust guardrail metrics, which are the check against this exact failure mode |
| Inclusion claims untested against real diversity | A design team's default assumptions are invisible to that same team | The Section 7 recruiting rule as a standing requirement of every round |

**New, from the build:**

| Risk | Why it matters | Mitigation |
|---|---|---|
| The demonstration is mistaken for evidence | Every hard case in the prototype was authored by the same people who designed the response. It proves the system *can* express these situations, not that couples experience them well. | Section 7 round two exists for exactly this. Until it runs, no claim about how the Decision Room *feels* is supported. |
| A disclosed error spends trust instead of building it | Section 4.5 assumes a product that says "I was wrong about the service charge" earns trust by saying so. That is an assumption, and it could as easily read as an admission of unreliability. The more prominent the disclosure, the more it costs if the assumption is wrong. The correction currently sits on the home screen, in the only red element on a page designed to be calm. | Protocol 6 in the research kit tests the direction directly, and watches for the specific failure: participants generalising from one disclosed error to doubting everything. If they generalise, the feature is still right and its prominence is wrong: the correction moves next to the fact it concerns rather than onto Today. |
| Generated imagery becomes a permanent crutch | The abstract compositions are the honest choice with no licensed photography, and they look intentional enough to be kept for the wrong reason | They carry a visible credit line. Real venue photography with rights and provenance replaces them the moment it exists. |

---

## 13. Phased roadmap

| Phase | Focus | Status |
|---|---|---|
| **Foundation** | Trust data model and delegation levels as working systems before any priority artifact goes to high fidelity. Token pipeline. Generative research. | Frameworks, pipeline, and the CI that runs them **done**. Generative research **not started**, though the materials to run it now exist. It is the critical path, and it is the only Foundation item that cannot be closed by building something. |
| **Prove the system** | Build and evaluatively test the six priority artifacts in order. Accessibility cadence. Guardrail metrics dashboard. | Artifacts **built**. Testing, cadence, and dashboard **not started**. |
| **Scale with governance** | Remaining workspaces under the governance model. Quarterly diverse-sample research. First full risk-register review against production data. | Not started. |

**The sequencing risk worth naming:** the plan called for generative research *before* the priority artifacts were finalized, and the artifacts now exist without it. That was the right call for a prototype whose job is to make the system legible and testable, and it is the wrong call to carry forward. These six screens should be treated as a well-formed hypothesis, not as a validated design. The first evaluative round should be prepared to invalidate parts of them.

---

## 14. Master checklist

| Question | Required answer | Status |
|---|---|---|
| Can every "Confirmed" fact trace to a timestamped source? | Yes, via the Section 3 model, no exceptions for launch pressure | **Yes**, enforced in code |
| Can a user state, in their own words, what VowOS may do without asking? | Yes, tested via research, not assumed from UI copy | **Not yet.** The model is built and disclosed; nobody has tested comprehension. |
| Does a token change happen in exactly one place? | Yes | **Yes**, enforced by `npm run check`. Interaction washes derive from ink rather than restating it, so `app.css` holds no color literal at all. |
| Can the permission model regress without anyone noticing? | No | **No.** Every action is evaluated against every level with every scope granted, on each run. |
| Has the check suite itself been seen to fail? | Yes, deliberately | **Yes**, mutation-tested against four planted defects |
| Has this quarter's research sample included a couple outside the team's own cultural or relationship default? | Yes | **No.** No research has run. The quota is written into the screener so it cannot be quietly skipped at recruiting time. |
| Does every research protocol state, before it runs, what result would mean we were wrong? | Yes | **Yes**, for all eight in the research kit |
| Do the build gates actually run, rather than merely existing? | Yes | **Yes**, on every push, per section 8 |
| Is any success metric implicitly rewarding more screen time or more opens? | No | **Yes, satisfied.** The anti-metric is explicit and no metric contradicts it. |
| Does every new component or agent-language pattern have a named owner and a change process? | Yes | **Partly.** The process exists; the roles are unfilled. |
| If the agent acted on wrong information, does the product have a designed way to say so? | Yes | **Yes**, and it is generated from the fact history rather than written, so it cannot be forgotten for the next mistake |
| Can a claim the couple was shown be dropped quietly? | No | **No.** Replacing an acted-on fact produces a correction, and the build fails if it lacks a remedy or a bound. |

---

## 15. What the prototype deliberately does not do

Stated plainly so that nobody mistakes the boundary of the demonstration for the boundary of the design.

| Not done | Why | What would change it |
|---|---|---|
| No backend, no real venue data, no messages actually sent | The frameworks under test are the trust model, the permission model, and the visual system. None require a network. | Integration work, which does not affect any decision recorded here |
| Place imagery is generated abstract composition | UI Plan 14 bans generic stock couples, and there is no licensed venue photography available. Drawn composition is the third permitted option and is labelled as such wherever it could be mistaken for a photograph. | Real imagery with rights and provenance |
| The display serif falls back to Iowan Old Style or Georgia | Newsreader is not bundled, and the page makes no external requests by design | Self-hosting Newsreader as a subset woff2, which is a production requirement, not an optional polish |
| No dark mode | The UI Plan commits to a single warm daylight look and never mentions a dark variant. Inventing one would be a design decision made by an implementer rather than by the plan. | An explicit product decision, at which point the token file already has the structure to carry a second theme |
| Right-to-left and CJK are untested | UI Plan 13 correctly flags that generous negative space and an editorial serif are defaults to validate per language, not universal constants | Localization work, which should happen before the type system is declared global |
| One fictional couple, one region, five places | A consistent, realistic scenario is what makes a calm interface falsifiable. A second scenario would not test anything the first does not. | A stress scenario: 300 guests, two countries, a contested fact. Worth building before scaling the IA. |

---

## 16. Final direction

VowOS should feel like a beautiful private planning room, not a wedding website, a marketplace, or a productivity tool. Quiet enough that a user feels relief on arrival, warm enough to feel personal, precise enough to be trusted with meaningful work.

The strongest differentiator was never going to be a gradient, an illustration style, or an agent avatar. It is that the calm is *earned*: the interface is quiet because the system underneath has actually resolved what it knows, what it is guessing, and what it is allowed to do without asking. A quiet interface over an unresolved system is just a confident-looking one.

That is the thing this repository exists to keep true.
