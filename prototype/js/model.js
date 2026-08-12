/* VowOS prototype — trust data model and agent permission model.
 *
 * Masterplan sections 3 and 5. The roadmap requires both of these to work as
 * systems before any priority artifact goes to high fidelity, because the UI
 * patterns they support ("Verified by the venue on June 8", "I have sent the
 * five venue inquiries you approved") are promises the data layer has to keep.
 *
 * Nothing in the screens is allowed to invent an evidence line. Every one is
 * rendered from a fact resolved through V.trust.resolve().
 */
(function (V) {
  'use strict';

  /* ============================================================== TRUST == */

  const STATES = {
    confirmed: {
      id: 'confirmed',
      name: 'Confirmed',
      icon: 'check',
      definition: 'Sourced directly from the place, the vendor, or an official document, with a timestamp.',
    },
    reported: {
      id: 'reported',
      name: 'Reported',
      icon: 'doc',
      definition: 'Stated by a third party but not confirmed by the primary source.',
    },
    inferred: {
      id: 'inferred',
      name: 'Inferred',
      icon: 'approx',
      definition: 'Derived by the agent from a pattern, not stated by anyone.',
    },
    unknown: {
      id: 'unknown',
      name: 'Unknown',
      icon: 'unknown',
      definition: 'Actively not established, and the agent knows it.',
    },
  };

  /* Expected freshness window in days, by category. A Confirmed fact that ages
     past its window downgrades one level, toward Reported, without waiting for
     a user to notice a discrepancy. Masterplan section 3. */
  const FRESHNESS = {
    availability: 14,
    pricing: 90,
    policy: 180,
    capability: 365,
    contract: 365,
  };

  const CATEGORY_NOUN = {
    availability: 'Availability',
    pricing: 'Pricing',
    policy: 'Policy',
    capability: 'Capacity and capability',
    contract: 'Contract',
  };

  /* A fact with no resolved state cannot ship in a decision-relevant surface.
     Rather than trusting reviewers to catch it, an unstated state resolves to
     Unknown and reports itself, because a silent omission reads as confidence
     the product does not have. */
  function normalize(fact) {
    if (!fact) return null;
    if (!fact.state || !STATES[fact.state]) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(
          `[VowOS trust] Fact "${fact.id || fact.label}" has no resolved state. ` +
          'Rendering as Unknown per Masterplan section 3.'
        );
      }
      return Object.assign({}, fact, { state: 'unknown', value: fact.value || null });
    }
    return fact;
  }

  /* Resolves a stored fact into what the UI is allowed to say about it today. */
  function resolve(rawFact, now) {
    const fact = normalize(rawFact);
    if (!fact) return null;

    const today = now || V.NOW;
    let state = fact.state;
    let downgraded = false;
    let ageDays = null;
    const window = FRESHNESS[fact.category];

    if (fact.asOf) {
      ageDays = V.daysBetween(fact.asOf, today);
      if (state === 'confirmed' && window && ageDays > window) {
        state = 'reported';
        downgraded = true;
      }
    }

    return Object.assign({}, fact, {
      state,
      originalState: fact.state,
      downgraded,
      ageDays,
      window: window || null,
      meta: STATES[state],
      line: describe(fact, state, downgraded, window),
    });
  }

  /* The human wording for each state. This is the only place evidence
     sentences are written, so the vocabulary cannot drift screen to screen. */
  function describe(fact, state, downgraded, window) {
    const source = fact.source || 'an unnamed source';

    if (downgraded) {
      const noun = CATEGORY_NOUN[fact.category] || 'These';
      return `Confirmed by ${source} on ${V.fmtDate(fact.asOf, 'dayMonth')}. ` +
        `${noun} facts age after ${window} days, so we will re-check before you commit.`;
    }

    switch (state) {
      case 'confirmed':
        return `Verified by ${source} on ${V.fmtDate(fact.asOf, 'dayMonth')}.`;
      case 'reported':
        return `According to ${source}, not yet confirmed.`;
      case 'inferred':
        return fact.basis
          ? `Our estimate based on ${fact.basis}.`
          : 'Our estimate, not stated by the place.';
      case 'unknown':
      default:
        return fact.pending
          ? `We have not confirmed this yet. ${fact.pending}`
          : 'We have not confirmed this yet.';
    }
  }

  /* A fact's value is only shown as a number when the state supports it.
     Unknown never renders a figure, because a figure implies a source. */
  function displayValue(resolved) {
    if (!resolved) return 'Not confirmed';
    /* A contested claim has no single value, so the ordinary value path
       refuses to produce one. Each side's figure is reachable only through
       sourceValue(), which the disputes component uses, so a screen cannot
       accidentally render one side of a disagreement as the answer. */
    if (resolved.contested) return 'Sources disagree';
    if (resolved.state === 'unknown') return 'Not confirmed';
    if (resolved.value === null || resolved.value === undefined) return 'Not confirmed';
    if (resolved.state === 'inferred' && typeof resolved.value === 'number') {
      return `About ${V.fmtMoney(resolved.value)}`;
    }
    return typeof resolved.value === 'number' ? V.fmtMoney(resolved.value) : String(resolved.value);
  }

  /* How much the product is entitled to claim, per state. Used to detect the
     direction of a correction: replacing a fact with a less certain one is the
     case that most needs saying out loud, because the product is walking back
     a claim rather than sharpening it. */
  const CERTAINTY = { confirmed: 3, reported: 2, inferred: 1, unknown: 0 };

  function supersededIds(facts) {
    const dead = Object.create(null);
    for (const f of facts || []) if (f && f.supersedes) dead[f.supersedes] = true;
    return dead;
  }

  /* Supersession assumes the newer fact wins. A contested claim has no winner:
     two live sources describe the same thing and disagree, and neither is the
     primary source. The product's job is to refuse to resolve it. Averaging
     them, picking the pessimistic one, or quietly showing the most recent are
     all ways of inventing a fact nobody stated. */
  function contestedClaims(facts) {
    const dead = supersededIds(facts);
    const byClaim = Object.create(null);
    for (const f of facts || []) {
      if (!f || !f.claim || dead[f.id]) continue;
      (byClaim[f.claim] = byClaim[f.claim] || []).push(f.id);
    }
    const contested = Object.create(null);
    for (const claim of Object.keys(byClaim)) {
      if (byClaim[claim].length > 1) {
        for (const id of byClaim[claim]) contested[id] = claim;
      }
    }
    return contested;
  }

  /* Masterplan 4.5. A correction is not a paragraph somebody wrote. It is what
     the product owes the couple whenever a fact it *acted on* is replaced, and
     it is assembled from the transition itself: what was said, where it came
     from, what it touched, what replaced it, what is being done, and what did
     not happen. The last clause is the one teams forget and the one that
     decides whether trust survives. */
  function corrections(facts, now) {
    const byId = Object.create(null);
    for (const f of facts || []) if (f && f.id) byId[f.id] = f;

    const out = [];
    for (const fact of facts || []) {
      if (!fact || !fact.supersedes) continue;
      const previous = byId[fact.supersedes];
      /* Superseding a fact nobody was shown is just an update, not a
         correction. The product does not apologise for work in progress. */
      if (!previous || !previous.actedOn) continue;

      const before = resolve(previous, now);
      const after = resolve(fact, now);
      const subject = previous.subject || previous.label.toLowerCase();

      const sentences = [
        `On ${V.fmtDate(previous.asOf, 'dayMonth')} I told you ${subject} was ${displayValue(before)}.`,
        `That came from ${previous.source}, and it was ${previous.actedOn}.`,
        `${V.capitalize(fact.supersededBecause)}.`,
        `I have ${fact.remedy}.`,
      ];

      const lessCertain = CERTAINTY[after.state] < CERTAINTY[before.state];
      if (lessCertain) sentences.push('That leaves us less certain than I implied, not more.');
      if (fact.bound) sentences.push(fact.bound);

      out.push({
        id: `correction-${fact.id}`,
        title: `I was wrong about ${subject}.`,
        body: sentences.join(' '),
        lessCertain,
        before,
        after,
      });
    }
    return out;
  }

  V.trust = {
    STATES,
    FRESHNESS,
    CERTAINTY,
    resolve,
    displayValue,
    /* One side of a dispute, formatted. Only the disputes component may use
       this, because outside that context a single side is a misrepresentation. */
    sourceValue: function (resolved) {
      if (!resolved) return 'Not confirmed';
      return typeof resolved.value === 'number' ? V.fmtMoney(resolved.value) : String(resolved.value);
    },
    corrections,
    /* Resolves a list together, so each fact knows whether a later one has
       replaced it. A superseded fact stays in the record, because the history
       is what makes the correction checkable, but it never renders as current. */
    resolveAll: function (facts, now) {
      const dead = supersededIds(facts);
      const contested = contestedClaims(facts);
      return (facts || []).map((f) => {
        const r = resolve(f, now);
        if (r) {
          r.superseded = Boolean(dead[r.id]);
          r.contested = Boolean(contested[r.id]);
        }
        return r;
      }).filter(Boolean);
    },

    /* Groups the live facts that disagree, so a screen can present the
       disagreement itself rather than one side of it. */
    disputes: function (facts, now) {
      const resolved = V.trust.resolveAll(facts, now);
      const groups = Object.create(null);
      for (const f of resolved) {
        if (!f.contested) continue;
        (groups[f.claim] = groups[f.claim] || []).push(f);
      }
      return Object.keys(groups).map((claim) => {
        const sides = groups[claim];
        return {
          claim,
          label: sides[0].label,
          subject: sides[0].subject || sides[0].label.toLowerCase(),
          sides,
          /* What the disagreement is worth, when it can be stated in money.
             A dispute nobody can size is easy to leave unresolved. */
          spread: sides[0].spread || null,
          resolvedBy: sides[0].resolvedBy || null,
        };
      });
    },
    /* Used by the budget: totals must declare what they exclude. A total built
       over any Unknown is never presented as a total. */
    summarize: function (facts, now) {
      /* A superseded fact is history, not a current claim, so it never counts
         toward what the product knows or admits it does not know. */
      const resolved = V.trust.resolveAll(facts, now).filter((f) => !f.superseded);
      return {
        facts: resolved,
        confirmed: resolved.filter((f) => f.state === 'confirmed').length,
        unknown: resolved.filter((f) => f.state === 'unknown'),
        inferred: resolved.filter((f) => f.state === 'inferred'),
        stale: resolved.filter((f) => f.downgraded),
        complete: resolved.every((f) => f.state === 'confirmed'),
      };
    },
  };

  /* ========================================================= DELEGATION == */

  const LEVELS = [
    {
      id: 'propose',
      name: 'Propose only',
      summary: 'VowOS drafts everything and holds it for you.',
      detail: 'Messages, shortlists, and plans are prepared and wait for your review. Nothing leaves VowOS without you.',
    },
    {
      id: 'standing',
      name: 'Act with standing approval',
      summary: 'VowOS acts inside the specific permissions you have given, and asks about everything else.',
      detail: 'You name the situations. VowOS acts in those and reports back. Anything outside them waits for you.',
    },
    {
      id: 'report',
      name: 'Act and report',
      summary: 'For reversible housekeeping only. Never money, contracts, or messages.',
      detail: 'Reordering your plan, filing documents, and tidying your own workspace. This level never extends to a third party.',
    },
  ];

  /* The scopes a couple can grant under "Act with standing approval". Each is
     stated in plain language before the agent acts on it, never discovered
     afterward. Principle 2.8. */
  const SCOPES = [
    {
      id: 'follow-up-once',
      label: 'Follow up once if a place has not replied in five days',
      granted: true,
    },
    {
      id: 'propose-tour-times',
      label: 'Propose tour times to places you have saved',
      granted: true,
    },
    {
      id: 'request-missing-facts',
      label: 'Ask a place for a fact we are missing, like a fee or a curfew',
      granted: true,
    },
    {
      id: 'send-inquiry-packs',
      label: 'Send a first inquiry to a place you have not saved yet',
      granted: false,
    },
  ];

  /* Every action the prototype can take is declared here. An action that is
     not declared cannot be performed, which is what stops autonomy from
     creeping one reasonable-looking feature at a time. */
  const ACTIONS = {
    'request-tour': {
      label: 'Ask a place for a tour time',
      external: true, financial: false, reversible: true, scope: 'propose-tour-times',
    },
    'follow-up': {
      label: 'Follow up on an unanswered message',
      external: true, financial: false, reversible: true, scope: 'follow-up-once',
    },
    'ask-question': {
      label: 'Ask a place to confirm a missing fact',
      external: true, financial: false, reversible: true, scope: 'request-missing-facts',
    },
    'send-inquiry-pack': {
      label: 'Send an inquiry pack to new places',
      external: true, financial: false, reversible: false, scope: 'send-inquiry-packs',
    },
    'hold-date': {
      label: 'Place a hold on a date',
      external: true, financial: true, reversible: false, scope: null,
    },
    'approve-place': {
      label: 'Commit to a place',
      external: true, financial: true, reversible: false, scope: null,
    },
    'publish-website': {
      label: 'Publish a change to the guest website',
      external: true, financial: false, reversible: true, scope: null,
    },
    'reorder-plan': {
      label: 'Reorder the plan timeline',
      external: false, financial: false, reversible: true, scope: null,
    },
    'save-place': {
      label: 'Save or rule out a place',
      external: false, financial: false, reversible: true, scope: null,
    },
  };

  function evaluate(actionId, settings) {
    const action = ACTIONS[actionId];
    if (!action) {
      return {
        allowed: false,
        requiresApproval: true,
        reason: 'This is not a capability VowOS has been given.',
        action: null,
      };
    }

    const level = (settings && settings.level) || 'standing';
    const granted = (settings && settings.scopes) || [];

    /* Money and irreversible commitments never resolve to allowed, at any
       level. This is the line the permission model does not move. */
    if (action.financial) {
      return {
        allowed: false, requiresApproval: true, action,
        reason: 'Anything involving money or a commitment always comes back to you both, whatever your settings say.',
      };
    }

    if (action.external) {
      if (level === 'propose') {
        return {
          allowed: false, requiresApproval: true, action,
          reason: 'You have VowOS set to propose only, so anything that leaves VowOS waits for your review.',
        };
      }
      if (level === 'report') {
        return {
          allowed: false, requiresApproval: true, action,
          reason: 'Act and report never covers contacting anyone. This waits for your approval.',
        };
      }
      const scope = SCOPES.find((s) => s.id === action.scope);
      if (scope && granted.indexOf(action.scope) !== -1) {
        return {
          allowed: true, requiresApproval: false, action, scope,
          reason: `Covered by a standing approval you gave: “${scope.label}.”`,
        };
      }
      if (!action.reversible) {
        return {
          allowed: false, requiresApproval: true, action,
          reason: 'This one cannot be taken back once it is sent, so it waits for your approval.',
        };
      }
      return {
        allowed: false, requiresApproval: true, action,
        reason: 'This sits outside the standing approvals you have given, so it waits for you.',
      };
    }

    return {
      allowed: true, requiresApproval: false, action,
      reason: 'This is reversible and stays inside your own plan, so VowOS does it and tells you.',
    };
  }

  V.delegation = {
    LEVELS,
    SCOPES,
    ACTIONS,
    evaluate,
    levelById: (id) => LEVELS.find((l) => l.id === id) || LEVELS[1],
    /* One condensed sentence for the visibility table (UI Plan section 10),
       expanded only where a user is about to authorize something. */
    summarize: function (settings) {
      const level = V.delegation.levelById(settings.level);
      const count = (settings.scopes || []).length;
      if (settings.level !== 'standing') return level.summary;
      return `VowOS acts on ${V.numberWord(count)} specific permissions you have given, and asks about everything else.`;
    },
  };
})(window.VowOS);
