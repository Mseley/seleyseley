# VowOS design program

**Calm enough to trust. Warm enough to love.**

This repository turns the VowOS UI and Experience Plan into a working system: design tokens as code, a governed design system, the two frameworks the plan depends on, and a high-fidelity prototype of the six priority artifacts.

## Run it

```bash
npm run serve      # http://localhost:4173
```

No dependencies, no install step. Node 22.5 or newer, for the built-in SQLite the server uses.

```bash
npm test           # 68 checks: 49 on the design system and interface, 19 on the server
npm run check      # the above, plus fail if generated files have drifted from tokens.json
npm run tokens     # regenerate tokens.css and the contrast report from tokens.json
npm run bundle     # inline everything into dist/
npm run build      # tokens + bundle
```

`npm run check` is the CI entry point, and `.github/workflows/check.yml` runs it on every push. It fails the build on a drifted token, a contrast regression, a permission-model hole, an editorial slip, a stale `dist/`, or an external URL creeping into the bundle.

`dist/vowos-prototype.html` is a single self-contained file you can open by double-clicking. It makes no external requests: no CDN, no web fonts, no remote images.

## What is here

| Path | What it is |
|---|---|
| `docs/VowOS_Design_Program_Masterplan.md` | The program document, version 2.0. Start here. |
| `docs/Project_VowOS_UI_Plan.md` | The visual and interaction direction, version 1.1. |
| `docs/contrast-report.md` | Generated. Every color pair, measured, with the standing findings. |
| `docs/diagrams/` | Information architecture, decision loop, trust states, delegation. |
| `docs/research/` | The interview guide, eight protocols, and a screener. Ready to run; not yet run. |
| `docs/glossary.md` | One approved term per concept. Enforced by `npm test`, not remembered. |
| `docs/metrics.md` | The event schema behind the guardrails, and what must never be logged. |
| `docs/production-readiness.md` | An honest assessment of what this is and is not. Read before planning a launch. |
| `design-system/tokens.json` | The only place a token value may be edited. |
| `design-system/build.mjs` | Generates the CSS, audits contrast, blocks the build on a failure. |
| `scripts/verify.mjs` | 49 checks. No dependencies, no browser: the models load into a bare context. |
| `prototype/` | The prototype source. |
| `prototype/js/model.js` | The trust data model and the agent permission model. |
| `server/` | The system of record. Append-only fact ledger, server-side permission enforcement, dual approval for money. |

## The two rules that hold this together

**A token changes in exactly one place.** `tokens.json` is the source. `prototype/styles/tokens.css` is generated and carries a do-not-edit header. `npm run check` fails if the two disagree, which is how a hand-typed hex value gets caught before it forks the system.

**A trust claim is machine-checkable or it is not made.** Every fact resolves through `V.trust.resolve()` to one of four states: Confirmed, Reported, Inferred, Unknown. A fact with no state renders as Unknown and reports itself to the console. No screen is allowed to write its own evidence line, and no apology is written by hand: replacing a fact the couple was shown generates the correction, and the build fails if it lacks a remedy or a bound.

Both rules are enforced by `npm run check` rather than by anyone remembering them. The harness itself was mutation-tested: granting a financial action, planting an em dash, hand-typing a hex value, and inverting a scenario's arithmetic were each introduced deliberately, and each was caught by the check written for it.

## Seeing the system work

The prototype is not a click-through mockup. A few things are worth doing in order:

1. **Open Places.** The Orchard House shows "Confirmed by The Orchard House on July 20. Availability facts age after 14 days, so we will re-check before you commit." Nobody wrote that sentence. The fact was confirmed 22 days ago against a 14 day freshness window, so it downgraded itself.

2. **Open Vision and switch off "Propose tour times to places you have saved."** Then open a place. The action's consequence line changes, and the button now opens an approval gate instead of acting.

3. **Open the Decision Room and press "We have agreed on one."** Committing is financial, so no delegation setting reaches it. Both partners disagree, so the room holds the decision open and offers a next step rather than a tie-breaker.

4. **Read "I was wrong about the service charge at Maison 98" on Today.** That apology is not stored anywhere. A figure taken from a directory was shown in the budget comparison, then replaced when the place's own proposal turned out not to state one. The product assembles the explanation from that transition, including the line "That leaves us less certain than I implied, not more," which it works out by comparing the two certainty levels. Delete the superseded fact and the apology disappears with it.

5. **Scroll to "Two sources disagree about service charge" on The Orchard House.** A directory says 22 percent on top; the place's own brochure says it is included. That is about $6,292 apart, wider than the gap between the two places under consideration. The product shows both sides at equal weight, sizes the disagreement, and puts neither number in the budget. It is not being coy: `displayValue()` structurally refuses to return a single value for a contested claim, so no screen can render one side as the answer even by mistake.

6. **Open Design system.** The action table is evaluated live against your current settings, so it cannot describe a permission model the product does not actually have. The "When a fact is replaced" panel shows the before and after that generated the correction above.

7. **Narrow the window below 1024px.** The Decision Room switches to one place at a time with a persistent switcher rather than stacking two unlabelled answers under one row label.

## Is this production ready

Not yet, but it is no longer only a prototype. `server/` is the beginning of the real thing: an append-only fact ledger, permissions enforced against stored settings rather than asserted by the caller, and money gated behind approval from both partners. What is still missing is authentication, an HTTP layer, and the agent itself. The premise of the product, software that reads a place's website, writes to them, and files the reply as a sourced fact, is the largest piece of engineering in it and none of it is here. [`docs/production-readiness.md`](docs/production-readiness.md) is the full assessment, including what *is* production-grade and what a real build would take.

## What the prototype deliberately does not do

**Most importantly, it has not been tested with anyone.** Every hard case in it was authored by the same people who designed the response to it, which proves the system can express those situations and proves nothing about how couples experience them. [`docs/research/`](docs/research/) is the kit for finding out, and each protocol states in advance what result would mean the design is wrong.

It has no backend, no real place data, and no real messages are sent. Place imagery is generated abstract composition, labelled as such, because the plan bans stock couple photography and there is no licensed venue photography to use. The display serif falls back to Iowan Old Style or Georgia; production must self-host Newsreader. See section 15 of the masterplan for the full list.
