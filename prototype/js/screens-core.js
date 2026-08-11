/* VowOS prototype — Today, Vision, Places, and place detail.
 * Priority artifacts 1, 2, and 3 from UI Plan section 17.
 */
(function (V) {
  'use strict';

  const html = V.html;
  const raw = V.raw;
  const ui = V.ui;

  const screens = {};

  function greeting() {
    const hour = V.NOW.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function placeStatus(place) {
    return V.state.placeStatus[place.id] || place.status;
  }

  function livePlace(id) {
    const place = V.byId(V.data.places, id);
    if (!place) return null;
    return Object.assign({}, place, { status: placeStatus(place) });
  }

  /* ========================================================= 1. TODAY == */
  /* The Planning Pulse. An editorial briefing, not a dashboard: one greeting,
     one foreground decision, then quiet work, look-ahead, and recent progress
     in decreasing weight (UI Plan 7.2). */

  screens.today = function () {
    const d = V.data;
    const days = V.daysBetween(V.NOW, d.wedding.date);
    const holdDays = V.daysBetween(V.NOW, d.decision.deadline);
    const orchard = V.byId(d.places, 'orchard-house');
    const maison = V.byId(d.places, 'maison-98');

    const feeFacts = [
      V.trust.resolve(orchard.facts.find((f) => f.id === 'oh-fee')),
      V.trust.resolve(maison.facts.find((f) => f.id === 'm98-fee')),
    ];

    const work = d.agentWork.map((w) => html`<li class="vow-row" style="align-items:flex-start;flex-wrap:nowrap;gap:var(--vow-space-3)">
      <span style="flex:none;margin-top:3px;color:${raw(w.tone === 'done' ? 'var(--vow-color-moss)' : 'var(--vow-color-ash)')}">
        ${raw(V.icon(w.icon, { size: 17 }))}
      </span>
      <span style="font-size:var(--vow-font-size-body-small)">${w.text}</span>
    </li>`).join('');

    const week = d.thisWeek.map((item) => html`<li class="vow-timeline__row">
      <span class="vow-timeline__date">${V.fmtDate(item.date, 'weekdayShort')}</span>
      <span>${item.text}${item.risk ? raw(html` <span class="vow-status" data-tone="risk">${raw(V.icon('alert'))}Ends soon</span>`) : ''}</span>
    </li>`).join('');

    const done = d.recent.map((item) => html`<li class="vow-timeline__row" data-done="true">
      <span class="vow-timeline__date">${V.fmtDate(item.date, 'short')}</span>
      <span class="vow-timeline__text">${item.text}</span>
    </li>`).join('');

    return html`
      <div class="vow-col">
        <header class="vow-pagehead">
          <p class="vow-label">${V.fmtDate(V.NOW, 'weekday')}. ${days} days until ${raw(V.fmtDate(d.wedding.date, 'dayMonth'))}.</p>
          <h1 class="vow-display">${greeting()}, ${d.couple.title}.</h1>
        </header>

        <section class="vow-surface vow-surface--airy vow-stack vow-stack--5">
          <p class="vow-label">One thing worth deciding this week</p>
          <h2 class="vow-title">Two places are ready to compare.</h2>
          <p class="vow-body">
            The Orchard House and Maison 98 both fit the long dinner you described.
            Maison 98 keeps about ${raw(V.fmtMoney(7400))} more of your budget available for food and music.
            The Orchard House lets the music run two hours later.
          </p>

          <div class="vow-evidence-list">
            ${raw(feeFacts.map((f) => ui.evidence(f)).join(''))}
          </div>

          <hr class="vow-rule"/>

          <div class="vow-stack vow-stack--3">
            <div class="vow-row vow-row--actions">
              ${raw(ui.button('Compare the two places', { variant: 'primary', act: 'go', value: '#/decide' }))}
              ${raw(ui.button('Not this week', { variant: 'quiet', act: 'defer-decision' }))}
            </div>
            <p class="vow-consequence">
              Comparing does not commit you to anything. The Orchard House is holding
              ${raw(V.fmtDate(d.wedding.date, 'dayMonth'))} until ${raw(V.fmtDate(d.decision.deadline, 'weekday'))}
              at ${raw(V.fmtTime(d.decision.deadline))}, which is ${raw(V.numberWord(holdDays))} days from now.
            </p>
          </div>
        </section>

        <section class="vow-section">
          <div class="vow-panel vow-stack vow-stack--3" style="border-left:2px solid var(--vow-color-alert)">
            <h2 class="vow-section-title">${d.correction.title}</h2>
            <p class="vow-body" style="font-size:var(--vow-font-size-body-small)">${d.correction.body}</p>
            <div class="vow-row">
              ${raw(ui.button('See what changed in the budget', { variant: 'secondary', act: 'go', value: '#/plan' }))}
            </div>
          </div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Moving quietly', 'Work that is underway. Nothing here needs you.'))}
          <ul class="vow-stack vow-stack--4">${raw(work)}</ul>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('This week'))}
          <ul class="vow-timeline">${raw(week)}</ul>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Recently'))}
          <ul class="vow-timeline">${raw(done)}</ul>
        </section>
      </div>`;
  };

  /* ======================================================== 2. VISION == */
  /* The Vision Readback. Proves understanding without pretending certainty:
     every line is labelled confirmed, heard, or still open (UI Plan 8.1). */

  screens.vision = function () {
    const d = V.data;
    const v = d.vision;
    const palette = V.byId(v.palettes, V.state.palette) || v.palettes[0];

    const priorities = v.priorities.map((p, i) => html`<li class="vow-row" style="align-items:flex-start;flex-wrap:nowrap;gap:var(--vow-space-3)">
      <span class="vow-quiet" style="flex:none;font-variant-numeric:tabular-nums;font-size:var(--vow-font-size-meta);margin-top:3px">${i + 1}</span>
      <span>${p}</span>
    </li>`).join('');

    const avoiding = v.avoiding.map((a) => html`<li class="vow-row" style="align-items:flex-start;flex-wrap:nowrap;gap:var(--vow-space-3)">
      <span class="vow-quiet" style="flex:none;margin-top:3px">${raw(V.icon('avoid', { size: 15 }))}</span>
      <span>${a}</span>
    </li>`).join('');

    const practical = v.practical.map((p) => html`<div class="vow-receipt__line">
      <span class="vow-receipt__key">${p.label}</span>
      <span>${p.value}
        <span class="vow-status" style="margin-left:var(--vow-space-2)">${p.certainty === 'fixed' ? 'Fixed' : 'Flexible'}</span>
      </span>
    </div>`).join('');

    const questions = v.questions.map((q, i) => html`<li class="vow-stack vow-stack--2" style="padding:var(--vow-space-4) 0;border-top:1px solid var(--vow-color-hairline)">
      <p>${q}</p>
      <div class="vow-row">
        ${raw(ui.button('Answer now', { variant: 'secondary', act: 'answer-question', value: String(i) }))}
        ${raw(ui.button('Skip for now', { variant: 'quiet', act: 'skip-question', value: String(i) }))}
      </div>
    </li>`).join('');

    const palettes = v.palettes.map((p) => html`<button type="button" class="vow-palette"
        data-act="choose-palette" data-value="${p.id}" aria-pressed="${p.id === palette.id}">
      <span class="vow-swatches">${raw(p.colors.map((c) => `<span class="vow-swatch" style="background:${c}"></span>`).join(''))}</span>
      <span style="display:block;font-weight:600;font-size:var(--vow-font-size-body-small)">${p.name}</span>
      <span class="vow-meta" style="display:block;margin-top:4px">${p.note}</span>
      <span class="vow-status" style="margin-top:var(--vow-space-3)" data-tone="${p.id === palette.id ? 'ready' : 'neutral'}">
        ${raw(p.id === palette.id ? V.icon('check') : '')}${p.id === palette.id ? 'Accepted' : 'Explore this one'}
      </span>
    </button>`).join('');

    const delegation = V.state.delegation;
    const levels = V.delegation.LEVELS.map((l) => html`<button type="button" class="vow-dateopt"
        data-act="set-delegation" data-value="${l.id}" aria-pressed="${l.id === delegation.level}">
      <span class="vow-dateopt__day">${l.name}</span>
      <span class="vow-dateopt__note">${l.summary}</span>
    </button>`).join('');

    const scopes = V.delegation.SCOPES.map((s) => {
      const on = delegation.scopes.indexOf(s.id) !== -1;
      return html`<li class="vow-row vow-row--between" style="padding:var(--vow-space-3) 0;border-top:1px solid var(--vow-color-hairline);flex-wrap:nowrap;gap:var(--vow-space-4)">
        <span style="font-size:var(--vow-font-size-body-small)">${s.label}</span>
        ${raw(ui.button(on ? 'On' : 'Off', {
          variant: 'secondary', act: 'toggle-scope', value: s.id, icon: on ? 'check' : null,
          ariaLabel: `${s.label}. Currently ${on ? 'on' : 'off'}.`, pressed: on,
        }))}
      </li>`;
    }).join('');

    return html`
      <div class="vow-col vow-col--wide">
        ${raw(ui.pageHead('Vision readback', 'This is what we heard.',
          'Correct anything that is not right. Nothing here is fixed, and changing it changes what we look for.'))}

        <div class="vow-readback">
          <div class="vow-sticky vow-stack vow-stack--3">
            <div class="vow-media vow-media--tall">${raw(V.imagery.palette(palette.colors))}</div>
            ${raw(ui.mediaCredit())}
          </div>

          <div class="vow-stack vow-stack--7">
            <section class="vow-stack vow-stack--3">
              <p class="vow-label">The feeling</p>
              <p class="vow-editable vow-body" contenteditable="true" role="textbox" aria-label="The feeling, editable"
                 style="font-family:var(--vow-font-display);font-size:23px;line-height:1.4">${v.feeling}</p>
              <div class="vow-row">
                ${raw(ui.button('Not quite', { variant: 'quiet', act: 'refine-feeling' }))}
              </div>
            </section>

            <section class="vow-stack vow-stack--4">
              <div class="vow-row vow-row--between">
                <p class="vow-label">What matters most</p>
                <span class="vow-status" data-tone="ready">${raw(V.icon('check'))}Confirmed by you both on ${raw(V.fmtDate('2026-08-05', 'dayMonth'))}</span>
              </div>
              <ul class="vow-stack vow-stack--3">${raw(priorities)}</ul>
            </section>

            <section class="vow-stack vow-stack--4">
              <p class="vow-label">What we are avoiding</p>
              <ul class="vow-stack vow-stack--3">${raw(avoiding)}</ul>
            </section>

            <section class="vow-stack vow-stack--4">
              <p class="vow-label">The practical shape</p>
              <div>${raw(practical)}</div>
            </section>

            <section class="vow-stack vow-stack--3">
              <p class="vow-label">We still need to know</p>
              <p class="vow-meta">Three questions, no more. Skipping one is a real answer and I will stop asking.</p>
              <ul>${raw(questions)}</ul>
            </section>
          </div>
        </div>

        <section class="vow-section">
          ${raw(ui.sectionHead('Visual direction', 'The accepted palette shapes what we show you and what your guest website looks like. It never changes the parts of VowOS you need to read.'))}
          <div class="vow-palettes">${raw(palettes)}</div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('What VowOS may do on its own',
            V.delegation.summarize(delegation)))}
          <div class="vow-stack vow-stack--5">
            <div class="vow-daterail" style="flex-direction:column">${raw(levels)}</div>
            ${delegation.level === 'standing' ? raw(html`
              <div class="vow-panel vow-stack vow-stack--2">
                <p class="vow-label">The permissions you have given</p>
                <ul>${raw(scopes)}</ul>
                ${raw(ui.agentNote('Money and anything you cannot take back always come back to you both, whatever is switched on here.'))}
              </div>`) : ''}
          </div>
        </section>

        <section class="vow-section">
          <div class="vow-row vow-row--actions">
            ${raw(ui.button('Yes, this feels like us', { variant: 'primary', act: 'confirm-vision' }))}
            ${raw(ui.button('Help us refine it', { variant: 'secondary', act: 'refine-feeling' }))}
          </div>
        </section>
      </div>`;
  };

  /* ======================================================== 3. PLACES == */
  /* A private viewing room, not a marketplace: at most five places, no star
     ratings, no ad labels, no filter wall (UI Plan 9.1). */

  screens.places = function () {
    const places = V.data.places.map((p) => livePlace(p.id));
    const shown = places.filter((p) => placeStatus(p) !== 'ruled-out');
    const ruledOut = places.filter((p) => placeStatus(p) === 'ruled-out');

    const cards = shown.map((p) => ui.placeCard(p, { primaryLabel: 'Look properly' })).join('');

    return html`
      <div class="vow-col vow-col--wide">
        ${raw(ui.pageHead('Places', `${V.capitalize(V.numberWord(shown.length))} places, chosen for the evening you described.`,
          'These are not search results. Each one was read against what you said matters, and each one has something wrong with it that you should know before you fall in love.'))}

        <div class="vow-stack vow-stack--4">${raw(cards)}</div>

        ${ruledOut.length ? raw(html`
          <section class="vow-section">
            ${raw(ui.sectionHead('Ruled out', 'Kept here in case you change your mind.'))}
            <div class="vow-stack vow-stack--4">${raw(ruledOut.map((p) => ui.placeCard(p)).join(''))}</div>
          </section>`) : ''}

        <section class="vow-section">
          <div class="vow-panel vow-stack vow-stack--3">
            <h2 class="vow-section-title">What you are not seeing</h2>
            <p class="vow-body" style="font-size:var(--vow-font-size-body-small)">
              I read 43 places in your range and set aside 38. Most were ruled out on capacity or on the curfew,
              and eleven never published a 2027 rate. None of this is hidden from you, it is just not worth your evening.
            </p>
            <div class="vow-row">
              ${raw(ui.button('Show me why each one was set aside', { variant: 'quiet', act: 'show-ruled-out' }))}
            </div>
          </div>
        </section>
      </div>`;
  };

  /* Place detail. Gallery, plain-language fit, then capability, budget,
     evidence, and a collapsible list of what is still unverified (9.1). */

  screens.place = function (id) {
    const place = livePlace(id);
    if (!place) return screens.places();

    const facts = V.trust.resolveAll(place.facts);
    const known = facts.filter((f) => f.state === 'confirmed');
    const unsure = facts.filter((f) => f.state !== 'confirmed');
    const fee = facts.find((f) => f.category === 'pricing' && typeof f.value === 'number');
    const remaining = fee ? V.data.budget.comfort - fee.value : null;

    const reasons = place.whyItFits.map((r) => html`<li class="vow-row" style="align-items:flex-start;flex-wrap:nowrap;gap:var(--vow-space-3)">
      <span style="flex:none;margin-top:3px;color:var(--vow-color-moss)">${raw(V.icon('check', { size: 17 }))}</span>
      <span>${r}</span>
    </li>`).join('');

    const tourCheck = V.delegation.evaluate('request-tour', V.state.delegation);
    const status = placeStatus(place);
    const isSaved = status === 'saved' || status === 'toured' || status === 'contacted';

    return html`
      <div class="vow-col vow-col--wide">
        <div class="vow-row" style="margin-bottom:var(--vow-space-5)">
          ${raw(ui.button('All places', { variant: 'quiet', act: 'go', value: '#/places' }))}
        </div>

        <div class="vow-media vow-media--wide">${raw(V.imagery.scene(place.scene))}</div>
        <p class="vow-meta" style="margin-top:var(--vow-space-3)">${V.imagery.credit}</p>

        <header class="vow-stack vow-stack--3" style="margin:var(--vow-space-6) 0 var(--vow-space-7)">
          <h1 class="vow-display vow-display--sm">${place.name}</h1>
          <p class="vow-lede">${place.location}. ${place.travel}.</p>
          <span class="vow-status">${status === 'saved' ? 'Saved' : status === 'contacted' ? 'Contacted, waiting on a reply' : 'Suggested'}</span>
        </header>

        <section class="vow-section vow-stack vow-stack--4">
          ${raw(ui.sectionHead('Why it fits'))}
          <ul class="vow-stack vow-stack--3">${raw(reasons)}</ul>
          ${raw(ui.reality(place.realityCheck))}
        </section>

        ${fee ? raw(html`
        <section class="vow-section">
          ${raw(ui.sectionHead('What it does to your budget'))}
          <div class="vow-panel vow-stack vow-stack--4">
            <div class="vow-row vow-row--between vow-row--baseline">
              <span class="vow-compare__amount">${V.fmtMoney(fee.value)}</span>
              <span class="vow-meta">site fee</span>
            </div>
            ${raw(ui.evidence(fee))}
            <hr class="vow-rule"/>
            <p style="font-size:var(--vow-font-size-body-small)">
              That leaves ${V.fmtMoney(remaining)} of your ${V.fmtMoney(V.data.budget.comfort)} comfort for everything else.
            </p>
            ${raw(ui.agentNote('This is not a total. It excludes the service charge, which we have not confirmed here yet.'))}
          </div>
        </section>`) : ''}

        <section class="vow-section">
          ${raw(ui.sectionHead('What we know', 'Verified against the place itself, with the date it was checked.'))}
          <div class="vow-stack vow-stack--5">${raw(known.map((f) => ui.factRow(f)).join(''))}</div>
        </section>

        <section class="vow-section">
          ${raw(ui.drawer('verify-' + place.id,
            `What we still need to verify (${unsure.length})`,
            html`<div class="vow-stack vow-stack--5" style="padding-top:var(--vow-space-3)">
              ${raw(unsure.map((f) => ui.factRow(f)).join(''))}
            </div>`,
            V.state.drawers['verify-' + place.id]))}
        </section>

        <section class="vow-section">
          <div class="vow-surface vow-stack vow-stack--4">
            <h2 class="vow-section-title">What would you like to do?</h2>
            <div class="vow-row vow-row--actions">
              ${raw(ui.button('Ask VowOS to request a tour', {
                variant: 'primary', act: 'request-tour', value: place.id,
              }))}
              ${raw(ui.button(isSaved ? 'Saved' : 'Save this place', {
                variant: 'secondary', act: 'save-place', value: place.id, disabled: isSaved,
              }))}
              ${raw(ui.button('Rule it out', { variant: 'quiet', act: 'rule-out', value: place.id }))}
            </div>
            <p class="vow-consequence">${tourCheck.reason}</p>
          </div>
        </section>
      </div>`;
  };

  V.screens = Object.assign(V.screens || {}, screens);
})(window.VowOS);
