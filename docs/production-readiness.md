# Production readiness

**Verdict: no, but it is no longer only a design program.** The repository now contains a system of record with the permission model enforced on the server, alongside the design program and the prototype. What it still does not contain is authentication, an HTTP layer, or the agent.

That is not a criticism of the work, and it is not hedging. The distinction matters because the two are worth different things and cost different amounts, and confusing them is how a project ships a beautiful shell over an agent that has never sent an email.

---

## What is production-grade

These are finished, and a team could take them into a real build tomorrow without redoing the thinking.

| Asset | Why it holds up |
|---|---|
| The design system | Tokens are a single source, generated, drift-checked, and contrast-gated in CI. `app.css` contains no raw color literal. This is how a mature design system is run. |
| The trust data model | Four states, staleness, supersession, contested claims. Roughly 300 lines of dependency-free logic with no DOM and no framework. It ports into a real backend nearly as-is. |
| The delegation model | Three levels, four scopes, a closed action registry, and a hard branch that money cannot reach around. Same portability. |
| The verification approach | 68 checks, all mutation-tested, wired to CI. The suite is the specification in executable form. |
| The system of record | `server/`. Facts are append only, enforced by database triggers rather than convention. Permissions are evaluated against stored settings, so a caller cannot assert its own authority. Money requires approval from both partners before an effect can fire. |
| The documentation | The masterplan, glossary, metrics schema, and research kit are the artifacts that survive a team change. |

**The escaping discipline also holds.** Three XSS payloads were injected where real user content would live, a partner's note, a place name, and the vision text, across three routes. None executed; all rendered as text. The default-escaping template is doing its job.

---

## What is missing

### 1. There is no product underneath

This is the whole of it, and everything else is a footnote by comparison.

| Missing | Current state |
|---|---|
| Backend | **Started.** `server/` holds the system of record: an append-only fact ledger, the permission model enforced against stored settings, dual approval for money, and an audit log. No HTTP layer yet, so it is a library rather than a service. |
| Persistence | **Started.** SQLite via `node:sqlite`, with append-only enforced by database triggers rather than by convention. |
| Accounts and authentication | None. No login, no sessions, no identity. `actor` and `partnerId` are passed in and trusted, which is the next piece. |
| The agent itself | None. There is no model, no email sending, no reading of replies, no ingestion of place data. |
| Real data | Five fictional places with hand-authored facts. |

**The agent is the hard part and it is at zero.** The product's premise is software that reads a place's website, writes to them on a couple's behalf, understands the reply, and files the answer as a Confirmed fact with a source and a date. Every screen in this prototype assumes that pipeline already works. Building it is most of the engineering in the product, and none of it is here.

The trust model is what that pipeline would write *into*. That is genuinely useful: the schema is settled before the ingestion is built, which is the right order. But a settled schema is not an ingestion.

### 2. The architecture is prototype-shaped on purpose

Deliberate choices that are correct for a prototype and wrong for production:

- **Rendering is one `innerHTML` write of the entire screen** on every interaction. It forced hand-rolled focus restoration, and it will not survive real data volumes or live regions. Production wants a framework with real DOM diffing.
- **No module system.** Global namespace and script concatenation, chosen so the prototype runs from `file://` with no build.
- **Escaping is a convention, not a guarantee.** The `html` template escapes by default, and 227 `raw()` calls opt out of it. Today every one wraps component output that escapes internally. Nothing enforces that, and with real user content a single careless `raw()` becomes an XSS. In production this needs a framework where escaping is structural rather than disciplined.

None of this is technical debt in the usual sense, because it was never intended to be extended. It is a proof to be read and then rewritten.

### 3. Nothing legal, security, or compliance has been touched

A product that holds guest addresses, dietary and accessibility details, contract documents, and money decisions, and that sends email as the couple, carries obligations this repository does not acknowledge:

- Personal data of people who never signed up, namely the guests, under GDPR and similar regimes
- Data deletion, export, and retention, sketched in `docs/metrics.md` and implemented nowhere
- Sending email on a user's behalf, including authentication, deliverability, and anti-spam rules
- Storing contracts and any payment path
- A security review of a system with the standing authority to contact third parties

### 4. It has never been shown to a couple

Every hard case was authored by the same person who designed the response to it. `docs/research/` is ready and unrun. Until it runs, the design is a well-formed hypothesis.

### 5. Smaller, concrete items

- **Newsreader is not bundled.** The display serif falls back to Iowan Old Style or Georgia. Production must license and self-host a subset.
- **No dark mode.** A deliberate single-theme commitment, but a real product will be asked for one.
- **Right-to-left and dense scripts are untested.** UI Plan 13 flags that generous space and an editorial serif are defaults to validate per language.
- **Place imagery is drawn composition.** Honest and labelled, but production wants real photography with rights and provenance.

---

## What "production ready" would actually take

Rough order of magnitude, not an estimate. The ordering matters more than the sizing.

| Phase | Work | Size |
|---|---|---|
| 1 | Run the generative research. It can invalidate parts of the design, and it is cheapest to find that out now. | Weeks |
| 2 | Build the data pipeline: place ingestion, outbound email, reply parsing, and writing results into the trust model. | The largest single piece |
| 3 | Accounts, authentication, and an HTTP layer over the system of record. The ledger and the permission enforcement now exist; identity does not. | Medium |
| 4 | Rebuild the frontend on a real framework, porting the design system and the two models rather than the rendering. | Medium |
| 5 | Security review, legal and compliance, deliverability. | Medium, and blocking |
| 6 | Evaluative research rounds against the real thing, then launch. | Weeks |

---

## The honest summary

What exists is the part most teams skip and later wish they had: a settled visual system, two load-bearing frameworks with their edge cases resolved, executable rules that prevent drift, a written record of why each decision was made, and now a system of record where those frameworks are enforced rather than merely designed.

What does not exist is the part most teams start with: the agent, an identity layer, and everything that touches the outside world.

That order is unusual and, for this particular product, defensible. The riskiest thing about a wedding agent is not whether it can be built but whether people will trust it to act for them, and that risk lives in the design. Getting the trust model, the permission model, and the correction behaviour right before writing an ingestion pipeline means the pipeline gets built against a schema that has already survived its hard cases.

The honest description of this repository is now **a specification, a working proof, and the enforcement layer underneath it**. That is further along than a prototype and a long way short of a product.

A useful test of the difference: the prototype's permission model could be defeated by opening a browser console, because nothing behind the button was checking. The server's cannot, and there is a test that sends a payload claiming every permission it can think of and asserts that no effect fires. That is the transition from a design to a control, and it has now happened once, for one framework. It has not happened for identity, for the agent, or for anything that leaves the machine.
