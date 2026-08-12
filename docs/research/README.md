# Research kit

Masterplan section 7 specifies a research program. Nothing in it has run. These are the materials to start it, written so that someone who is not a researcher can run the first round competently.

**The state of the design right now: a well-formed hypothesis.** The six priority artifacts exist, they are internally consistent, and every hard case in them was authored by the same people who designed the response to it. That proves the system *can* express these situations. It does not prove couples experience them well. Everything here exists to find out.

## The principle these protocols are built on

The verification suite in `scripts/verify.mjs` was mutation-tested before it was trusted, because a check that cannot fail is decoration. **The same applies to research.** A study that cannot come back negative is theatre, and it is the most expensive kind of theatre because it produces confident-sounding evidence for whatever the team already believed.

So every protocol here states, before it runs, **what result would mean we were wrong**. If a session cannot possibly produce that result, the protocol is broken and should be fixed before recruiting anyone.

## What to run, in order

| Order | Protocol | Answers | Blocks |
|---:|---|---|---|
| 1 | [Generative interviews](generative-guide.md) | Is a calm, execution-first agent the actual felt need, or our taste? | Everything. Run this before refining any screen. |
| 2 | [Evaluative round one](evaluative-protocols.md#round-one) | Do the Planning Pulse and Vision Readback work on first contact? | High-fidelity work on the remaining screens |
| 3 | [Evaluative round two](evaluative-protocols.md#round-two) | Does the Decision Room de-escalate a real disagreement, or perform neutrality? | Launch |

Round one and two both include the standing checks below.

## Standing rules for every round

These come from masterplan section 7 and section 8. They are not optional and they are not "when we can get to it."

**Both partners.** At least one household per round where both partners are interviewed, separately and then together. The product's central claim is shared, non-surveilling planning. That claim cannot be validated by interviewing one person and assuming the other's experience.

**Outside our defaults.** Each round includes at least one couple whose situation sits outside the design team's own cultural or relationship default. A team's assumptions are invisible to that same team, which is the entire reason this is a rule rather than a preference.

**Access is in the room, not in a later study.** At minimum one screen-reader user and one keyboard-only user in every evaluative round. Not a separate accessibility track that runs later and less often, because that is how accessibility becomes a retrofit.

**Nobody who builds software for a living.** Designers, engineers, and product managers read interfaces differently from everyone else. They are the easiest participants to recruit and the least informative.

## How to not ruin the data

The three ways small teams usually wreck their own research, in order of frequency:

1. **Saying the word first.** Never use "calm", "overwhelming", "trust", "clear", or "simple" before the participant does. If you introduce the word, their use of it back to you is worthless. Wait for their language and then borrow it.
2. **Rescuing.** When someone is stuck, the instinct is to help. Their confusion *is* the finding. Count to five, then say "what are you thinking?" and nothing else.
3. **Asking about the future.** "Would you use this?" and "Would you pay?" produce polite fiction. Ask what they did last week instead; behaviour that already happened is the only reliable evidence.

## Sample size

Five to eight participants per evaluative protocol. This is enough to find the problems that affect most people and nowhere near enough to measure anything. Treat every number these sessions produce as a description of those eight people, never as a rate. If a decision needs a rate, this is the wrong instrument.

## Recording what you find

One page per round, structured as: what we expected, what happened, what we changed, what we are deliberately not changing yet and why. Append it to `docs/research_and_design_log.md`, which is where the build findings already live, so the design record stays in one place rather than in someone's drive.
