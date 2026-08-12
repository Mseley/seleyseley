# The system of record

The first piece of the real product. It exists to move two things out of the browser, where they were designs, into a place where they are enforcement.

```bash
npm run test:server    # 19 checks
npm run check          # design system, interface, and server together
```

No dependencies. Storage is `node:sqlite`, built into Node 22.5 and later.

---

## Why this exists

The prototype's delegation model runs in the browser. A screen asks whether an action is allowed and renders an approval dialog if it is not. That is a good interface and **it is not a security control**: anyone who can open a developer console can call the action directly, because nothing on the far side of the button is checking.

The same is true of the trust model. In the prototype a fact is an object in memory, so "Verified by The Orchard House on August 4" is a claim with nothing behind it.

Both are now backed by something.

## The two decisions that shape everything here

### 1. Facts are append only

A fact is never updated and never deleted. Correcting one means inserting a new row that supersedes it, exactly as the trust model already describes. The old row stays.

This is not database fastidiousness. The evidence line is a claim the product makes to a couple who may be about to spend fifty thousand dollars on the strength of it. After an `UPDATE` there is no way to show what was said before, or to prove nothing was quietly changed afterward. The ledger is what makes the promise auditable when someone asks.

Enforced by triggers, so the guarantee holds against a future query that acquires an `UPDATE` by accident:

```
UPDATE facts SET value_json = '1' WHERE id = 'oh-fee'
  -> facts are append only: supersede the row instead of updating it
```

The audit log is append only for the same reason: its whole value is that it cannot be tidied afterward.

### 2. Permission is decided by stored settings, never by the request

`attempt()` reads the household's delegation settings from the database and evaluates them. **The caller says what it wants to do, never what it is allowed to do.** A request carrying `{allowed: true, delegation: {level: 'standing'}, bypass: true}` is ignored completely, and there is a test that sends exactly that.

Every attempt is logged whether it was permitted or refused, along with the settings in force at the time. A refused attempt is not noise; it is the evidence the model worked, and the only way to notice a client trying things it should not.

## Money needs both partners, on both paths

The delegation model already refuses to let any setting authorise a financial or irreversible action, which covers the agent. The human path needs its own answer, because a person legitimately can authorise these.

`authorize()` records one partner's approval of one specific request. For anything financial or irreversible, it will not run until **every** partner in the household has approved that same request. One partner approving twice does not count as two, and an approval from someone outside the household is rejected outright.

This is the sentence "it always comes back to you both" existing as a condition the executor checks rather than as a promise in a document.

## The models are shared, not reimplemented

`server/model.mjs` loads `prototype/js/util.js` and `prototype/js/model.js` into a bare context and re-exports them. The server and the interface run the *same* trust and delegation code.

Reimplementing them server-side would create precisely the fork the token pipeline exists to prevent, except in the layer where being wrong costs money. The models are pure logic with no DOM, which is why this works.

**The honest next refactor** turns those two files into real ES modules imported by both surfaces. That is mechanical. What matters is that there stays one implementation rather than two that agree today.

## Effects are injected, not imported

Sending mail, holding a date, and publishing a page do not exist. Rather than stub them inside the gate, where they would blur which parts are real, the executor takes an `effects` map:

```js
const exec = createExecutor(db, { 'request-tour': async ({ payload }) => mailer.send(...) });
```

**The gate is real. The effects are pluggable.** Tests use a recording fake and assert not only that a refused action returns a refusal, but that no effect fired behind it.

An action that is permitted but has no effect wired up throws, rather than silently succeeding. Reporting work to a couple that never happened is worse than an error.

## What this is not

- **No HTTP layer, no auth.** There are no accounts, sessions, or tokens. `actor` and `partnerId` are passed in and trusted. Wiring authentication is the next piece, and until it exists this is a library rather than a service.
- **No agent.** The ingestion pipeline that would read a place's website, write to them, and file the reply as a sourced fact is still entirely unbuilt. This is what that pipeline would write *into*.
- **No migrations.** The schema is created on open. A real deployment needs versioned migrations before the first row anyone cares about.

See [`docs/production-readiness.md`](../docs/production-readiness.md) for the full assessment.
