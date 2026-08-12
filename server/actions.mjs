/* The gate every side effect passes through.
 *
 * THE POINT OF THIS FILE. In the prototype, the delegation model runs in the
 * browser: a screen asks whether an action is allowed and renders a dialog if
 * it is not. That is a good interface and it is not a security control. Anyone
 * who can open a console can call the action directly, because nothing on the
 * far side of the button is checking.
 *
 * Here the check is on the server, evaluated against the household's STORED
 * settings, and it is the only path to an effect. A request cannot assert its
 * own permission: the caller says what it wants to do, never what it is allowed
 * to do. That distinction is the whole difference between a permission model
 * that is designed and one that is enforced.
 *
 * Effects are injected rather than imported. Sending mail, holding a date, and
 * publishing a page do not exist yet, and pretending otherwise inside the gate
 * would hide which parts are real. The gate is real; the effects are pluggable.
 */

import { trust, delegation } from './model.mjs';

/* Actions whose consequences fall on someone other than the couple, or which
   cannot be taken back, need an explicit approval from BOTH partners before
   they run. The delegation model already refuses to let any setting authorise
   these; this is the second half of that rule, on the human path. */
function requiresBothPartners(actionId) {
  const action = delegation.ACTIONS[actionId];
  return Boolean(action && (action.financial || action.reversible === false));
}

/* Takes a SCOPED handle, never the raw database. The executor therefore has no
   way to name a household at all, so an effect cannot land on the wrong one. */
export function createExecutor(scope, effects = {}) {
  const householdId = scope.householdId;

  function settingsFor() {
    return scope.getDelegation();
  }

  function record(actor, actionId, verdict, payload) {
    const settings = settingsFor();
    scope.logAttempt({
      actor, actionId,
      allowed: verdict.allowed,
      reason: verdict.reason,
      level: settings.level,
      scopes: settings.scopes,
      payload,
    });
  }

  async function run(actionId, payload) {
    const effect = effects[actionId];
    if (!effect) {
      /* A declared action with no implementation must fail loudly. Silently
         succeeding would report work to a couple that never happened. */
      throw new Error(`action "${actionId}" is permitted but has no effect wired up`);
    }
    return effect({ householdId, payload, scope });
  }

  return {
    /* The agent acting on its own. Evaluated against stored settings only. */
    async attempt(actionId, payload) {
      const settings = settingsFor();
      const verdict = delegation.evaluate(actionId, settings);
      record('agent', actionId, verdict, payload);

      if (!verdict.allowed) {
        return { ran: false, allowed: false, reason: verdict.reason, requiresApproval: true };
      }
      const result = await run(actionId, payload);
      return { ran: true, allowed: true, reason: verdict.reason, result };
    },

    /* A partner explicitly authorising one specific request. */
    async authorize(requestId, actionId, partnerId, payload) {
      if (!delegation.ACTIONS[actionId]) {
        const verdict = { allowed: false, reason: 'This is not a capability VowOS has been given.' };
        record(partnerId, actionId, verdict, payload);
        return { ran: false, allowed: false, reason: verdict.reason };
      }

      scope.recordApproval(requestId, actionId, partnerId, payload);

      const partners = scope.partnerIds();
      const approvals = scope.approvalsFor(requestId);
      const approvedBy = new Set(approvals.map((a) => a.partner_id));

      if (requiresBothPartners(actionId)) {
        const missing = partners.filter((id) => !approvedBy.has(id));
        if (missing.length) {
          const verdict = {
            allowed: false,
            reason: `Waiting on ${missing.join(' and ')}. Anything involving money or a commitment needs you both.`,
          };
          record(partnerId, actionId, verdict, payload);
          return { ran: false, allowed: false, reason: verdict.reason, waitingOn: missing };
        }
      }

      const verdict = {
        allowed: true,
        reason: requiresBothPartners(actionId)
          ? `Approved by ${partners.join(' and ')}.`
          : `Approved by ${partnerId}.`,
      };
      record(partnerId, actionId, verdict, payload);
      const result = await run(actionId, payload);
      return { ran: true, allowed: true, reason: verdict.reason, result };
    },

    /* Read-only: what would happen, without doing it or logging an attempt.
       Used by the interface to render a consequence line honestly. */
    preview(actionId) {
      const settings = settingsFor();
      const verdict = delegation.evaluate(actionId, settings);
      return {
        allowed: verdict.allowed,
        reason: verdict.reason,
        needsBothPartners: requiresBothPartners(actionId),
      };
    },
  };
}

/* Resolving a household's facts through the shared model, so the server and the
   interface can never disagree about what is Confirmed. */
export function readFacts(scope, placeId) {
  const stored = scope.facts(placeId);
  return {
    facts: trust.resolveAll(stored).filter((f) => !f.superseded),
    disputes: trust.disputes(stored),
    corrections: trust.corrections(stored),
    summary: trust.summarize(stored),
  };
}
