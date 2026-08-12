# Evaluative protocols

UI Plan section 17 states acceptance tests as design intent. Section 17.1 sketches methods. These are those methods as scripts someone can run, plus three the plan does not cover and needs.

**Setup for all of them.** Run the prototype at `npm run serve`, or open `dist/vowos-prototype.html`. Desktop at 1440px wide, phone at 390px. Reset between participants by reloading, since the prototype holds state in memory only.

Every protocol below states what would mean we were wrong. If a session cannot produce that outcome, fix the protocol before recruiting.

---

## Round one

Run once the Planning Pulse and Vision Readback are the screens under discussion. Five to eight participants.

### 1. Does the one important thing read as the one important thing

*Tests UI Plan 17, artifact 1: a user identifies the meaningful next action in five seconds.*

Show the Today screen for **five seconds**, then hide it.

> "What is this asking you to do?"

Then show it again and ask them to tap the thing they would do first.

**Measure:** whether their first tap is *Compare the two places*, and whether their spoken answer names a decision about venues rather than a description of the page.

**Passes if:** six of eight first taps land on the primary action.

**Would mean we were wrong:** participants name the correction panel ("I was wrong about the service charge") as the most important thing. That would mean an admission of error outcompetes the actual decision for attention, and the correction needs to move below the fold or become quieter. This is a live risk, not a hypothetical: it is the only red element on a page designed to be calm.

### 2. Can they tell what VowOS knows from what it guessed

*Tests artifact 2: a user feels understood while still seeing what is confirmed versus inferred.*

Open a place detail page. Give them a minute to read.

> "Point at anything on this page VowOS knows for certain."

> "Now point at anything it's guessing at."

Say nothing else. Do not define the words.

**Measure:** their sorting against the actual states. The Orchard House page has four Confirmed facts, one Reported, one Inferred, one Unknown, and one Confirmed fact that has gone stale and downgraded itself.

**Passes if:** participants reliably separate Confirmed from Unknown. Confusing Reported and Inferred with each other is acceptable and expected; the distinction matters to the data model, not to a couple.

**Would mean we were wrong:** participants read *everything* as certain. That is the failure that matters, because it means the evidence lines are decorative and the product is making promises it has not earned. It would invalidate the "trust is visible" claim regardless of how the UI reads in design review.

**Also worth watching:** whether anyone notices the stale fact on their own. If nobody does, the downgrade is honest but invisible, and honesty nobody perceives buys no trust.

### 3. Curated shortlist or vendor directory

*Tests artifact 3.*

Show the Places screen for 30 seconds.

> "Describe this page to someone who can't see it."

Then:

> "How many places do you think there are in total?"

**Measure:** their unprompted vocabulary. Words like *chosen*, *picked*, *for us*, *shortlist* mean the curation reads. Words like *results*, *listings*, *options*, *search* mean it does not. The second question tests whether the five feel like a selection or the top of a list.

**Passes if:** most participants describe selection rather than search, and expect a bounded set rather than more pages.

**Would mean we were wrong:** participants ask where the filters are, or feel the five are hiding something. That would mean curation reads as restriction, which is the exact failure the product's differentiation depends on avoiding.

### 4. Can they state what the agent may do without asking

*Not in the UI Plan. The master checklist asks this question and it has never been tested.*

Have them use the product for a few minutes, including opening a place and pressing **Ask VowOS to request a tour**.

Then, without letting them look back:

> "In your own words, what is VowOS allowed to do without checking with you?"

> "What would it always ask about first?"

**Measure:** whether their answer matches the actual delegation settings. The correct answer is roughly: it can ask places for times and for missing facts and follow up once, and it always asks before anything involving money or anything it cannot take back.

**Passes if:** participants get the money boundary right. That is the one that matters. Fuzziness about which specific scopes are on is tolerable.

**Would mean we were wrong:** participants believe VowOS can spend money, book, or commit on their behalf. Anyone holding that belief is a person the product has quietly frightened, and the disclosure model has failed even though every screen states its permissions.

---

## Round two

Run once the Decision Room and tour coordination are the screens under discussion. **Recruit couples who currently disagree about at least one real decision.** This is harder to recruit and it is the point; a round two run on agreeable couples tests nothing.

### 5. Does the Decision Room de-escalate, or perform neutrality

*Tests UI Plan 9.3 and the disagreement handling added in v1.1.*

Both partners together. Open the Decision Room.

> "Read this together and talk to each other about it the way you normally would."

Then stay quiet for as long as you can stand.

**Measure:** whether they talk to each other or to the screen. Whether either one points at the evidence to make a point. Whether the held-open state reads as support or as the product refusing to help. Whether anyone looks for a way to break the tie.

Afterward, separately:

> "Did that feel fair?"

> "Did it feel like it was on anyone's side?"

**Passes if:** neither partner felt the product favoured the other, and at least one of them used something on the screen to advance the conversation.

**Would mean we were wrong:** they experience the held-open decision as the product being useless. "It just told us what we already knew" is the failure mode. The design assumes couples want a neutral space; they may want a recommendation they can argue with instead, which would be a different product.

### 6. Does admitting a mistake build trust or spend it

*Not in the UI Plan, and the riskiest untested assumption in the product.*

The generated correction on Today assumes that a product saying "I was wrong about the service charge at Maison 98" earns trust. **That is an assumption, not a finding.** It could as easily read as an admission of unreliability, and the more prominent it is, the more it costs.

Show the Today screen. After they have read it:

> "What do you make of that second box?"

Then:

> "Does that make you more or less confident in this thing?"

**Measure:** the direction, and the reason. Watch specifically whether they generalise ("what else has it got wrong?") or bound it ("at least it caught it").

**Passes if:** most participants bound it rather than generalising, and can say what was actually affected.

**Would mean we were wrong:** participants generalise. If a single disclosed error makes people doubt everything else, the correction needs to be quieter and more local, closer to the fact it concerns rather than on the home screen. The feature would still be right; its prominence would be wrong.

**Do not:** explain the feature, defend it, or use the word "honest". If you have to explain why the disclosure is good, it is not working.

### 7. Proposed, held, or confirmed

*Tests artifact 5.*

Open the tour screen, which shows one confirmed tour and one where no time has been requested.

> "Which of these is definitely happening?"

> "What happens if you tap *Ask for this time*?"

**Passes if:** participants correctly identify only the confirmed tour as certain, and expect the button to send a request rather than to book.

**Would mean we were wrong:** anyone believes tapping books the slot. In a product that acts on a couple's behalf, a user who thinks something is booked when it is only proposed is the most expensive misunderstanding available.

---

## Standing checks in both rounds

**Accessibility, in the room.** One screen-reader user and one keyboard-only user per round, running the same protocols above rather than a separate script. Note where the reading order stops matching the visual order, and whether the agent's status announcements arrive at a useful moment or interrupt.

**Both partners.** At least one household interviewed separately and then together.

**Outside our defaults.** At least one couple whose situation sits outside the design team's own cultural or relationship default.

---

## Screener

Recruit for:

- Currently planning, four to fourteen months out
- Both partners willing to take part
- A mix across budget, guest count, and whether anyone is helping them

Quotas across the whole round, not per session:

- At least one same-sex couple
- At least one couple with a family contributor involved in decisions or money
- At least one couple planning within a tradition outside the design team's own background
- At least one professional planner using the product on a client's behalf
- One screen-reader user, one keyboard-only user

Screen out anyone who works in software design, engineering, or product management. They are the easiest people to recruit and the least informative, because they read interfaces professionally rather than as people trying to get married.

Ask the screener questions about the past, not the future. "How far along are you?" not "How interested would you be in a planning tool?"
