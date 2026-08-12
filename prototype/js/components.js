/* VowOS prototype — the component language from UI Plan 11.2.
 *
 * Each component here corresponds to a row in that table and carries its design
 * rule as a comment, so the rule travels with the implementation rather than
 * living in a document an engineer may never open (Masterplan section 9, step 2).
 */
(function (V) {
  'use strict';

  const html = V.html;
  const raw = V.raw;
  const esc = V.esc;

  const ui = {};

  /* Primary button: one per visible decision area. Terracotta fill, inverse
     text. A high-commitment action names its consequence in a line beside the
     button rather than borrowing a second accent color (11.2). */
  ui.button = function (label, opts) {
    const o = opts || {};
    const variant = o.variant || 'secondary';
    const attrs = [
      `class="vow-btn vow-btn--${variant}${o.full ? ' vow-btn--full' : ''}"`,
      `data-act="${esc(o.act || 'noop')}"`,
      o.value ? `data-value="${esc(o.value)}"` : '',
      o.disabled ? 'disabled' : '',
      o.ariaLabel ? `aria-label="${esc(o.ariaLabel)}"` : '',
      o.pressed !== undefined ? `aria-pressed="${o.pressed}"` : '',
    ].filter(Boolean).join(' ');
    const icon = o.icon ? V.icon(o.icon, { size: 17 }) : '';
    return `<button type="button" ${attrs}>${esc(label)}${icon}</button>`;
  };

  /* Evidence line: source, freshness, and certainty. Small text plus a
     restrained icon, never a technicolor badge. State is carried by icon and
     wording as well as color, so it survives without color (UI Plan 13). */
  ui.evidence = function (fact) {
    const r = fact && fact.meta ? fact : V.trust.resolve(fact);
    if (!r) return '';
    return html`<p class="vow-evidence" data-state="${r.state}">
      ${raw(V.icon(r.meta.icon, { className: 'vow-evidence__icon' }))}
      <span><span class="vow-sr">${r.meta.name}. </span>${r.line}</span>
    </p>`;
  };

  /* A labelled fact with its value and its evidence. The value renders through
     V.trust.displayValue so an Unknown can never print a figure. */
  ui.factRow = function (fact) {
    const r = fact && fact.meta ? fact : V.trust.resolve(fact);
    if (!r) return '';
    return html`<div class="vow-stack vow-stack--2">
      <div class="vow-row vow-row--between">
        <span style="font-size:var(--vow-font-size-body-small);font-weight:600">${r.label}</span>
        <span style="font-size:var(--vow-font-size-body-small)">${V.trust.displayValue(r)}</span>
      </div>
      ${raw(ui.evidence(r))}
    </div>`;
  };

  /* A disagreement between sources, presented as a disagreement. Both sides
     get equal visual weight, neither is marked as likelier, and the size of
     the gap is stated when it can be, because a dispute nobody has sized is
     easy to leave unresolved. UI Plan 2.5: trust is visible, not buried. */
  ui.dispute = function (group) {
    const sides = group.sides.map((side) => html`<div class="vow-dispute__side">
      <p class="vow-dispute__value">${V.trust.sourceValue(side)}</p>
      ${raw(ui.evidence(side))}
    </div>`).join('');

    return html`<section class="vow-dispute vow-stack vow-stack--4">
      <div class="vow-stack vow-stack--2">
        <div class="vow-row" style="gap:var(--vow-space-2)">
          ${raw(V.icon('alert', { size: 17 }))}
          <h3 class="vow-section-title" style="font-size:17px">Two sources disagree about ${group.label.toLowerCase()}</h3>
        </div>
        ${group.spread ? raw(html`<p class="vow-meta">The difference is about ${V.fmtMoney(group.spread)}, so it is worth settling before you decide.</p>`) : ''}
      </div>
      <div class="vow-dispute__sides">${raw(sides)}</div>
      ${raw(ui.agentNote(
        'Neither of these came from the place itself, so I am not putting either number in your comparison. ' +
        (group.resolvedBy ? `This gets settled by ${group.resolvedBy}` : 'I have asked the place to settle it.')
      ))}
    </section>`;
  };

  /* Reveals expand in place rather than opening a modal, preserving reading
     position (11.4). */
  ui.drawer = function (id, label, body, open) {
    return html`<div class="vow-drawer" data-drawer="${id}" data-open="${open ? 'true' : 'false'}">
      <button type="button" class="vow-drawer__toggle" data-act="toggle-drawer" data-value="${id}"
              aria-expanded="${open ? 'true' : 'false'}">
        ${raw(V.icon('chevron', { className: 'vow-drawer__chevron' }))}${label}
      </button>
      <div class="vow-drawer__body">${raw(body)}</div>
    </div>`;
  };

  /* Agent note: left rule, short first-person sentence, no chat bubble. */
  ui.agentNote = function (text, variant) {
    return html`<p class="vow-agent-note${variant ? ' vow-agent-note--' + variant : ''}">${text}</p>`;
  };

  /* Partner note: initials, a concise direct quote or status, no implication
     that either partner is ahead (2.6, 9.3). */
  ui.partnerNote = function (partnerId, body, opts) {
    const o = opts || {};
    const person = V.byId(V.data.couple.partners, partnerId);
    if (!person) return '';
    return html`<div class="vow-partner">
      <span class="vow-partner__initials" data-person="${person.slot}" aria-hidden="true">${person.initials}</span>
      <div class="vow-partner__body">
        <strong>${person.name}</strong>${o.suffix ? raw(` <span class="vow-quiet">${esc(o.suffix)}</span>`) : ''}
        <div style="margin-top:4px">${raw(body)}</div>
      </div>
    </div>`;
  };

  /* Status: text and icon, never a colored pill (9.1). */
  ui.status = function (text, opts) {
    const o = opts || {};
    return html`<span class="vow-status" data-tone="${o.tone || 'neutral'}">
      ${raw(o.icon ? V.icon(o.icon) : '')}${text}
    </span>`;
  };

  /* The reality check: one tradeoff or unknown, muted but never concealed
     below the fold (9.1). */
  ui.reality = function (text) {
    return html`<p class="vow-reality">${raw(V.icon('alert'))}<span>${text}</span></p>`;
  };

  const STATUS_WORDS = {
    suggested: 'Suggested',
    saved: 'Saved',
    contacted: 'Contacted',
    'tour-proposed': 'Tour proposed',
    toured: 'Toured',
    'ruled-out': 'Ruled out',
  };

  /* Place card: one hero composition, one reason, one reality check, one
     action based on current state (11.2). */
  ui.placeCard = function (place, opts) {
    const o = opts || {};
    const status = STATUS_WORDS[place.status] || 'Suggested';
    const dateFact = place.facts.find((f) => f.category === 'availability');
    const resolved = dateFact ? V.trust.resolve(dateFact) : null;

    return html`<article class="vow-place" data-status="${place.status}">
      <div class="vow-media">${raw(V.imagery.scene(place.scene))}</div>
      <div class="vow-place__body">
        <div>
          <h3 class="vow-place__name">${place.name}</h3>
          <p class="vow-meta">${place.location}. ${place.travel}.</p>
        </div>
        <p class="vow-place__reason">${place.whyItFits[0]}</p>
        ${raw(ui.reality(place.realityCheck))}
        ${raw(resolved ? ui.evidence(resolved) : '')}
        <div class="vow-row" style="margin-top:var(--vow-space-2)">
          ${raw(ui.button(o.primaryLabel || 'Open', { variant: 'secondary', act: 'open-place', value: place.id }))}
          <span class="vow-status">${status}</span>
        </div>
      </div>
    </article>`;
  };

  /* Timeline row: date left, sentence right, status by text and icon, never by
     color alone (11.2). */
  const TIMELINE_WORDS = {
    confirmed: { word: 'Confirmed', icon: 'check', tone: 'ready' },
    proposed: { word: 'Proposed, not confirmed', icon: 'clock', tone: 'neutral' },
    next: { word: 'Next', icon: 'arrow', tone: 'neutral' },
    later: { word: 'Later', icon: 'clock', tone: 'neutral' },
    risk: { word: 'Ends soon', icon: 'alert', tone: 'risk' },
    blocked: { word: 'Waiting on a decision', icon: 'hold', tone: 'neutral' },
    done: { word: 'Done', icon: 'check', tone: 'ready' },
  };

  ui.timelineRow = function (item) {
    const meta = TIMELINE_WORDS[item.state] || TIMELINE_WORDS.next;
    return html`<div class="vow-timeline__row" data-done="${item.state === 'done'}">
      <div class="vow-timeline__date">${V.fmtDate(item.date, 'weekdayShort')}</div>
      <div class="vow-stack vow-stack--2">
        <p class="vow-timeline__text">${item.text}</p>
        ${raw(ui.status(meta.word, { icon: meta.icon, tone: meta.tone }))}
        ${item.blockedBy ? raw(html`<p class="vow-meta">Blocked by: ${item.blockedBy}.</p>`) : ''}
      </div>
    </div>`;
  };

  /* Receipt: what was done, to whom, and what happens next. Replaces a toast
     for anything that left the product (11.4). */
  ui.receipt = function (title, lines, opts) {
    const o = opts || {};
    const rows = lines.map((l) => html`<div class="vow-receipt__line">
      <span class="vow-receipt__key">${l[0]}</span><span>${l[1]}</span>
    </div>`).join('');
    return html`<section class="vow-receipt vow-stack vow-stack--4">
      <div class="vow-row" style="gap:var(--vow-space-2)">
        ${raw(V.icon('check', { size: 19 }))}<h3 class="vow-section-title">${title}</h3>
      </div>
      <div>${raw(rows)}</div>
      ${o.next ? raw(ui.agentNote(esc(o.next))) : ''}
    </section>`;
  };

  /* Budget meter. Segments are labelled in a legend; the "not yet known"
     segment is always shown rather than folded into an optimistic total. */
  ui.meter = function (segments, total) {
    const bars = segments.map((s) =>
      `<span class="vow-meter__seg" data-kind="${esc(s.kind)}" style="width:${(s.amount / total) * 100}%"></span>`
    ).join('');
    const legend = segments.map((s) => html`<span>
      <span class="vow-legend__dot" style="background:${raw(s.color)}"></span>${s.label}, ${V.fmtMoney(s.amount)}
    </span>`).join('');
    return html`<div class="vow-stack vow-stack--3">
      <div class="vow-meter">${raw(bars)}</div>
      <div class="vow-legend">${raw(legend)}</div>
    </div>`;
  };

  ui.pageHead = function (eyebrow, title, lede) {
    return html`<header class="vow-pagehead">
      <p class="vow-label">${eyebrow}</p>
      <h1 class="vow-display">${title}</h1>
      ${lede ? raw(html`<p class="vow-lede">${lede}</p>`) : ''}
    </header>`;
  };

  ui.sectionHead = function (title, note) {
    return html`<div class="vow-section__head vow-stack vow-stack--2">
      <h2 class="vow-section-title">${title}</h2>
      ${note ? raw(html`<p class="vow-meta">${note}</p>`) : ''}
    </div>`;
  };

  /* The imagery credit line. Wherever a composition could be mistaken for a
     photograph of the real place, it says what it is (UI Plan 14). */
  ui.mediaCredit = function () {
    return html`<p class="vow-meta">${V.imagery.credit}</p>`;
  };

  V.ui = ui;
})(window.VowOS);
