/* VowOS prototype — Decision Room, tour coordination, Plan, Guests,
 * Website Studio, and the living design system page.
 * Priority artifacts 4, 5, and 6 from UI Plan section 17.
 */
(function (V) {
  'use strict';

  const html = V.html;
  const raw = V.raw;
  const ui = V.ui;
  const screens = {};

  /* ================================================= 4. DECISION ROOM == */
  /* The most visual restraint in the product. Two choices side by side, one
     calm recommendation, evidence one layer deeper, and a named consequence on
     the action. When both partners must approve and disagree, the room holds
     the decision open and offers a next step instead of a tie-breaker (9.3). */

  screens.decide = function () {
    const d = V.data;
    const dec = d.decision;
    const options = dec.options.map((id) => V.byId(d.places, id));
    const [a, b] = options;

    const factOf = (place, id) => V.trust.resolve(place.facts.find((f) => f.id === id));
    /* Cells are tagged by column so that narrow screens can show one option at
       a time rather than stacking two unlabelled answers under one row label
       (UI Plan 9.3). */
    const slot = (i) => (i === 0 ? 'a' : 'b');
    const cell = (content, i) => `<div class="vow-compare__cell vow-compare__cell--${slot(i)}">${content}</div>`;
    const label = (text) => `<div class="vow-compare__label">${V.esc(text)}</div>`;
    const focus = V.state.compareFocus || 'a';

    const scenarios = d.budget.scenarios;
    const baseline = d.budget.committed.reduce((n, i) => n + i.amount, 0) +
      d.budget.projected.reduce((n, i) => n + i.amount, 0);

    const heads = options.map((p, i) => `<div class="vow-compare__cell vow-compare__cell--${slot(i)} vow-compare__head">
      <div class="vow-media" style="margin-bottom:var(--vow-space-4)">${V.imagery.scene(p.scene)}</div>
      <h2 class="vow-title" style="font-size:23px">${V.esc(p.name)}</h2>
      <p class="vow-meta">${V.esc(p.location)}. ${V.esc(p.travel)}.</p>
    </div>`).join('');

    const fitCells = options.map((p, i) => cell(html`
      <p>${p.whyItFits[0]}</p>
      ${raw(ui.reality(p.realityCheck))}`, i)).join('');

    const costCells = options.map((p, i) => {
      const s = scenarios.find((x) => x.placeId === p.id);
      const total = baseline + s.siteFee;
      const delta = d.budget.comfort - total;
      return cell(html`
        <p class="vow-compare__amount">${V.fmtMoney(s.siteFee)}</p>
        <p class="vow-meta">site fee</p>
        <p style="margin-top:var(--vow-space-3)">
          Everything you have planned so far comes to ${V.fmtMoney(total)}.
          ${delta >= 0
            ? raw(html`That is ${V.fmtMoney(delta)} inside your comfort.`)
            : raw(html`That is ${V.fmtMoney(Math.abs(delta))} over your comfort.`)}
        </p>
        ${raw(ui.evidence(factOf(p, p.id === 'orchard-house' ? 'oh-fee' : 'm98-fee')))}`, i);
    }).join('');

    const practicalCells = options.map((p, i) => {
      const ids = p.id === 'orchard-house'
        ? ['oh-cap', 'oh-curfew', 'oh-rain', 'oh-access']
        : ['m98-cap', 'm98-curfew', 'm98-rain', 'm98-access'];
      return cell(html`<div class="vow-stack vow-stack--3">
        ${raw(ids.map((id) => {
          const f = factOf(p, id);
          return html`<p style="font-size:var(--vow-font-size-body-small)">
            <span class="vow-quiet">${f.label}.</span> ${V.trust.displayValue(f)}
          </p>`;
        }).join(''))}
      </div>`, i);
    }).join('');

    const evidenceCells = options.map((p, i) => {
      const facts = V.trust.resolveAll(p.facts).filter((f) => !f.superseded);
      const gaps = facts.filter((f) => f.state !== 'confirmed');
      return cell(html`
        <p class="vow-meta">${V.capitalize(V.numberWord(facts.length - gaps.length))} of ${raw(V.numberWord(facts.length))} facts verified with the place itself.</p>
        ${raw(ui.drawer('ev-' + p.id, `${gaps.length} we are not sure about`,
          html`<div class="vow-stack vow-stack--4">${raw(gaps.map((f) => ui.factRow(f)).join(''))}</div>`,
          V.state.drawers['ev-' + p.id]))}`, i);
    }).join('');

    /* Persistent on narrow screens, hidden once both columns fit side by side. */
    const switcher = html`<div class="vow-compare-switch" role="group" aria-label="Which place are you looking at?">
      <span class="vow-label" style="width:100%">Looking at</span>
      ${raw(options.map((p, i) => ui.button(p.name, {
        variant: 'secondary', act: 'pick-compare', value: slot(i), pressed: slot(i) === focus,
      })).join(''))}
    </div>`;

    const positions = dec.positions.map((pos) => {
      const place = V.byId(d.places, pos.prefers);
      return html`<div class="vow-panel">
        ${raw(ui.partnerNote(pos.partner, html`
          <p style="margin-bottom:var(--vow-space-3)"><strong>${place.name}</strong></p>
          <p class="vow-quiet">${pos.note}</p>`, { suffix: 'prefers' }))}
      </div>`;
    }).join('');

    const holdCheck = V.delegation.evaluate('ask-question', V.state.delegation);

    return html`
      <div class="vow-col vow-col--wide">
        ${raw(ui.pageHead('Decision room', dec.title))}

        <section class="vow-surface vow-surface--airy vow-stack vow-stack--4">
          <p class="vow-label">What VowOS thinks</p>
          <p class="vow-body" style="font-size:19px">${dec.recommendation}</p>
          ${raw(ui.drawer('why-rec', 'How I got there',
            html`<div class="vow-stack vow-stack--3">
              <p style="font-size:var(--vow-font-size-body-small)">
                Both places clear everything on your confirmed priorities except one each.
                The Orchard House fails nothing outright but costs ${raw(V.fmtMoney(7400))} more.
                Maison 98 seats 96 if the ceremony has to move indoors, and you are planning for 110.
              </p>
              <p style="font-size:var(--vow-font-size-body-small)">
                I have not weighted your priorities against each other, because you have not told me how,
                and guessing at that is how I would get this wrong.
              </p>
            </div>`, V.state.drawers['why-rec']))}
        </section>

        <section class="vow-section">
          ${raw(switcher)}
          <div class="vow-compare" data-focus="${focus}">
            <div class="vow-compare__label vow-compare__head"></div>
            ${raw(heads)}
            ${raw(label('Fit'))}${raw(fitCells)}
            ${raw(label('Cost'))}${raw(costCells)}
            ${raw(label('Practicality'))}${raw(practicalCells)}
            ${raw(label('Evidence'))}${raw(evidenceCells)}
          </div>
          <p class="vow-meta" style="margin-top:var(--vow-space-4)">
            Neither total includes a service charge. We have not confirmed one at either place,
            so these are working figures, not quotes.
          </p>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Where you both are', 'Both positions, as you each described them. Nothing moves forward until you agree.'))}
          <div class="vow-positions">${raw(positions)}</div>
        </section>

        <section class="vow-section">
          <div class="vow-surface vow-stack vow-stack--5">
            <h2 class="vow-section-title">What happens next</h2>
            <p class="vow-body" style="font-size:var(--vow-font-size-body-small)">${dec.openQuestion}</p>
            <hr class="vow-rule"/>
            <div class="vow-row vow-row--actions">
              ${raw(ui.button('Ask them to extend the hold', { variant: 'primary', act: 'extend-hold' }))}
              ${raw(ui.button('Leave a note for each other', { variant: 'secondary', act: 'leave-note' }))}
              ${raw(ui.button('We have agreed on one', { variant: 'quiet', act: 'open-commit' }))}
            </div>
            <p class="vow-consequence">
              ${dec.deadlineNote} ${holdCheck.reason}
            </p>
          </div>
        </section>
      </div>`;
  };

  /* ==================================================== 5. TOUR VISIT == */
  /* A thoughtful calendar invitation. The interface never implies the system
     has booked something when it has only proposed a time (UI Plan 9.2). */

  screens.tour = function () {
    const d = V.data;
    const confirmed = d.tours.filter((t) => (V.state.tourStatus[t.id] || t.status) === 'confirmed');
    const proposing = d.tours.filter((t) => (V.state.tourStatus[t.id] || t.status) !== 'confirmed');

    const confirmedCards = confirmed.map((t) => {
      const place = V.byId(d.places, t.placeId);
      const when = t.confirmedFor || V.state.tourConfirmedFor;
      return html`<div class="vow-surface vow-stack vow-stack--4">
        <div class="vow-row vow-row--between">
          <h2 class="vow-section-title">${place.name}</h2>
          ${raw(ui.status('Confirmed by the place', { icon: 'check', tone: 'ready' }))}
        </div>
        <p style="font-family:var(--vow-font-display);font-size:27px">
          ${V.fmtDate(when, 'weekday')} at ${raw(V.fmtTime(when))}
        </p>
        <p class="vow-meta">${place.travel}. ${t.reason}</p>
        <div class="vow-row vow-row--actions">
          ${raw(ui.button('Add to our calendars', { variant: 'primary', act: 'add-calendar', value: t.id }))}
          ${raw(ui.button('See the tour brief', { variant: 'secondary', act: 'tour-brief', value: t.id }))}
        </div>
        ${raw(ui.agentNote('I will send you both a short list of questions the day before, built from what we still have not verified.'))}
      </div>`;
    }).join('');

    const requests = proposing.map((t) => {
      const place = V.byId(d.places, t.placeId);
      const dates = [];
      t.windows.forEach((w) => { if (dates.indexOf(w.date) === -1) dates.push(w.date); });
      const activeDate = V.state.tourDate || dates[0];
      const windows = t.windows.filter((w) => w.date === activeDate);

      const rail = dates.map((date) => html`<button type="button" class="vow-dateopt"
          data-act="pick-tour-date" data-value="${date}" aria-pressed="${date === activeDate}">
        <span class="vow-dateopt__day">${V.fmtDate(date, 'weekdayShort')}</span>
        <span class="vow-dateopt__note">${V.numberWord(t.windows.filter((w) => w.date === date).length)} times offered</span>
      </button>`).join('');

      const times = windows.map((w) => html`<button type="button" class="vow-timeopt"
          data-act="pick-tour-time" data-value="${w.id}" aria-pressed="${V.state.tourSelection === w.id}">
        <span class="vow-timeopt__time">${V.fmtTime(w.time)}</span>
        <span class="vow-timeopt__meta">${w.note}</span>
      </button>`).join('');

      const selected = t.windows.find((w) => w.id === V.state.tourSelection);

      return html`<div class="vow-stack vow-stack--5">
        <div class="vow-row vow-row--between">
          <h2 class="vow-section-title">${place.name}</h2>
          ${raw(ui.status('No time requested yet', { icon: 'clock' }))}
        </div>
        <p class="vow-lede">${t.reason} ${place.travel}.</p>
        <div class="vow-tour">
          <div class="vow-daterail">${raw(rail)}</div>
          <div class="vow-stack vow-stack--4">
            <div class="vow-times">${raw(times)}</div>
            <hr class="vow-rule"/>
            <div class="vow-row vow-row--actions">
              ${raw(ui.button('Ask for this time', {
                variant: 'primary', act: 'ask-tour-time', value: t.id, disabled: !selected,
              }))}
              ${raw(ui.button('None of these work', { variant: 'quiet', act: 'no-times-work' }))}
            </div>
            <p class="vow-consequence">
              ${selected
                ? raw(html`This sends ${raw(place.name)} a request for ${raw(V.fmtDate(selected.date, 'weekday'))} at ${raw(V.fmtTime(selected.time))} Nothing is booked until they answer.`)
                : 'Choose a time to see exactly what gets sent.'}
            </p>
          </div>
        </div>
      </div>`;
    }).join('');

    return html`
      <div class="vow-col vow-col--wide">
        ${raw(ui.pageHead('Tours', 'Seeing the places.',
          'A time is proposed, held, or confirmed. VowOS will always tell you which one it is.'))}
        <div class="vow-stack vow-stack--6">${raw(confirmedCards)}</div>
        <section class="vow-section">${raw(requests)}</section>
      </div>`;
  };

  /* ========================================================== 6. PLAN == */
  /* A gently structured timeline, not a project board. Budget health at the
     top, the next six to eight weeks by default (UI Plan 9.4). */

  screens.plan = function () {
    const d = V.data;
    const committed = d.budget.committed.reduce((n, i) => n + i.amount, 0);
    const projected = d.budget.projected.reduce((n, i) => n + i.amount, 0);
    const unallocated = d.budget.comfort - committed - projected;

    const meter = ui.meter([
      { kind: 'committed', label: 'Committed', amount: committed, color: 'var(--vow-color-moss)' },
      { kind: 'projected', label: 'Planned, not committed', amount: projected, color: 'var(--vow-color-rose-clay)' },
      { kind: 'unknown', label: 'Not allocated yet', amount: unallocated, color: 'var(--vow-color-hairline-strong)' },
    ], d.budget.comfort);

    const scenarios = d.budget.scenarios.map((s) => {
      const place = V.byId(d.places, s.placeId);
      const total = committed + projected + s.siteFee;
      const delta = d.budget.comfort - total;
      return html`<div class="vow-receipt__line">
        <span class="vow-receipt__key">With ${place.name}</span>
        <span>
          <strong>${V.fmtMoney(total)}</strong><span class="vow-quiet">${delta >= 0
            ? raw(html`, ${V.fmtMoney(delta)} inside your comfort`)
            : raw(html`, ${V.fmtMoney(Math.abs(delta))} over your comfort`)}</span>
          <span class="vow-meta" style="display:block;margin-top:4px">${s.note}</span>
        </span>
      </div>`;
    }).join('');

    const lines = d.budget.projected.concat(d.budget.committed)
      .map((item) => ui.factRow(Object.assign({}, item, { label: item.label, value: item.amount }))).join('');

    const rows = d.timeline.map((item) => ui.timelineRow(item)).join('');

    const docs = d.documents.map((doc) => html`<li class="vow-receipt__line">
      <span class="vow-receipt__key">${doc.kind}</span>
      <span>${doc.name}
        <span class="vow-meta" style="display:block;margin-top:4px">From ${doc.source}, ${V.fmtDate(doc.date, 'long')}.</span>
      </span>
    </li>`).join('');

    return html`
      <div class="vow-col">
        ${raw(ui.pageHead('Plan', 'Where the wedding stands.',
          'The next eight weeks. Everything further out is there when you want it.'))}

        <section class="vow-surface vow-stack vow-stack--5">
          <div class="vow-row vow-row--between vow-row--baseline">
            <h2 class="vow-section-title">Budget</h2>
            <span class="vow-meta">${V.fmtMoney(d.budget.comfort)} comfort</span>
          </div>
          ${raw(meter)}
          <p class="vow-meta">The place is not in these figures yet. It will take most of what is unallocated.</p>
          <hr class="vow-rule"/>
          <div>${raw(scenarios)}</div>
          ${raw(ui.agentNote('Neither figure includes a service charge. Until one of them confirms it, I will not show you a total that looks final.'))}
          ${raw(ui.drawer('budget-lines', 'Every line',
            html`<div class="vow-stack vow-stack--5">${raw(lines)}</div>`,
            V.state.drawers['budget-lines']))}
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('What happens next'))}
          <div class="vow-timeline">${raw(rows)}</div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Documents and commitments'))}
          <ul>${raw(docs)}</ul>
        </section>
      </div>`;
  };

  /* ======================================================== 7. GUESTS == */
  /* People, not rows in a CRM. Household readiness first, individual records
     only when someone needs to act (UI Plan 9.5). */

  screens.guests = function () {
    const g = V.data.guests;
    const clusters = g.clusters.map((c) => html`<div class="vow-panel vow-stack vow-stack--2">
      <span class="vow-cluster__count">${c.count}</span>
      <span style="font-weight:600;font-size:var(--vow-font-size-body-small)">${c.label}</span>
      <span class="vow-meta">${c.note}</span>
    </div>`).join('');

    return html`
      <div class="vow-col">
        ${raw(ui.pageHead('Guests', `${g.households} households, about ${g.expected} people.`, g.note))}
        <div class="vow-cluster">${raw(clusters)}</div>

        <section class="vow-section">
          <div class="vow-surface vow-stack vow-stack--4">
            <h2 class="vow-section-title">One thing would move this along</h2>
            <p class="vow-body" style="font-size:var(--vow-font-size-body-small)">
              Eighteen households have no address. Save the dates cannot go out to them,
              and save the dates cannot go out at all until the place is decided.
              If you want, I can draft a short message asking those eighteen for an address.
            </p>
            <div class="vow-row vow-row--actions">
              ${raw(ui.button('Draft the message', { variant: 'primary', act: 'draft-address-request' }))}
              ${raw(ui.button('Show me the households', { variant: 'secondary', act: 'show-households' }))}
            </div>
            <p class="vow-consequence">Drafting does not send anything. You will see the exact message and the exact eighteen names first.</p>
          </div>
        </section>
      </div>`;
  };

  /* ================================================ 8. WEBSITE STUDIO == */
  /* Live preview in the centre, unobtrusive content rail. Sections are
     editorial chapters, and the layout baseline cannot be broken (9.5). */

  screens.studio = function () {
    const d = V.data;
    const palette = V.byId(d.vision.palettes, V.state.palette) || d.vision.palettes[0];
    const active = V.state.siteSection || 's1';

    const rail = d.website.sections.map((s) => html`<button type="button" class="vow-dateopt"
        data-act="pick-section" data-value="${s.id}" aria-pressed="${s.id === active}">
      <span class="vow-dateopt__day">${s.name}</span>
      <span class="vow-dateopt__note">${s.ready ? 'Ready' : s.blocked}</span>
    </button>`).join('');

    const previewStyle = `--vow-site-accent:${palette.colors[1]};--vow-site-canvas:${palette.colors[3]};--vow-site-accent-ink:${palette.colors[1]}`;

    const bodies = {
      s1: html`<p class="vow-site__eyebrow">You are invited</p>
        <h2 class="vow-site__title">${d.couple.title}</h2>
        <div class="vow-site__rule"></div>
        <p>${V.fmtDate(d.wedding.date, 'weekday')}, 2027. ${d.wedding.region}.</p>
        <p style="margin-top:var(--vow-space-4);max-width:44ch">
          We are having a long dinner and we would like you at it. Everything you need is on this page.
        </p>`,
      s2: html`<p class="vow-site__eyebrow">The day</p>
        <h2 class="vow-site__title">How it runs</h2>
        <div class="vow-site__rule"></div>
        <p style="max-width:46ch">The ceremony is short. Dinner is long and seated. There is no receiving line,
        so please just come and find us.</p>`,
      s3: html`<p class="vow-site__eyebrow">Travel</p>
        <h2 class="vow-site__title">Getting there</h2>
        <div class="vow-site__rule"></div>
        <p style="max-width:46ch">This section is waiting on where you are getting married.
        VowOS will fill in the station, the drive, and the rooms once you decide.</p>`,
      s4: html`<p class="vow-site__eyebrow">Questions</p>
        <h2 class="vow-site__title">Things people ask</h2>
        <div class="vow-site__rule"></div>
        <p style="max-width:46ch">Children are welcome. There is a vegetarian option.
        The dress code is whatever you would wear to a good dinner.</p>`,
    };

    const section = d.website.sections.find((s) => s.id === active);

    return html`
      <div class="vow-col vow-col--wide">
        ${raw(ui.pageHead('Website studio', 'What your people will see.',
          'The palette you accepted carries through. The layout does not bend far enough to break.'))}

        <div class="vow-studio">
          <div class="vow-stack vow-stack--5">
            <div class="vow-stack vow-stack--2">
              <p class="vow-label">Chapters</p>
              <div class="vow-daterail" style="flex-direction:column">${raw(rail)}</div>
            </div>
            <div class="vow-panel vow-stack vow-stack--3">
              <p class="vow-label">Palette</p>
              <span class="vow-swatches">${raw(palette.colors.map((c) => `<span class="vow-swatch" style="background:${c};height:34px"></span>`).join(''))}</span>
              <p class="vow-meta">${palette.name}, accepted in your vision.</p>
              ${raw(ui.button('Change it in Vision', { variant: 'quiet', act: 'go', value: '#/vision' }))}
            </div>
          </div>

          <div class="vow-stack vow-stack--4">
            <div class="vow-preview" style="${raw(previewStyle)}">
              <div class="vow-preview__chrome">
                ${raw(V.icon('doc', { size: 15 }))} mayaandalex.wedding
                <span style="margin-left:auto">${d.website.published ? 'Published' : 'Not published yet'}</span>
              </div>
              <div class="vow-site" style="background:var(--vow-site-canvas)">${raw(bodies[active])}</div>
            </div>

            ${section && !section.ready ? raw(html`
              <div class="vow-panel">${raw(ui.agentNote(section.blocked + ' I will write it the day you decide, and show it to you before anyone sees it.', 'action'))}</div>`) : ''}

            <div class="vow-row vow-row--actions">
              ${raw(ui.button('Publish this change', { variant: 'primary', act: 'publish-site' }))}
              ${raw(ui.button('View as a guest', { variant: 'secondary', act: 'view-as-guest' }))}
            </div>
            <p class="vow-consequence">
              Publishing makes this visible to anyone with the link. You will see exactly what changes first,
              and no guest is notified unless you ask for that separately.
            </p>
          </div>
        </div>
      </div>`;
  };

  /* ================================================= 9. DESIGN SYSTEM == */
  /* The component library and its usage rules, in the product rather than in a
     separate document engineers may not open (Masterplan section 9). Token
     values are read from the live stylesheet, so this page cannot drift from
     what the product actually renders. */

  screens.system = function () {
    const read = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const colorNames = ['porcelain', 'paper', 'ink', 'ash', 'moss', 'terracotta',
      'rose-clay', 'mist-blue', 'soft-gold', 'alert', 'hairline'];

    const swatches = colorNames.map((name) => {
      const value = read(`--vow-color-${name}`);
      return html`<div class="vow-spec__tile">
        <div class="vow-spec__chip" style="background:${raw(value)}"></div>
        <div class="vow-spec__meta">
          <div class="vow-spec__name">${name.replace(/-/g, ' ')}</div>
          <div class="vow-spec__val">${value}</div>
        </div>
      </div>`;
    }).join('');

    const spaces = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => {
      const value = read(`--vow-space-${n}`);
      return html`<div class="vow-row" style="gap:var(--vow-space-4)">
        <span class="vow-spec__val" style="width:64px">space-${n}</span>
        <span style="height:10px;width:${raw(value)};background:var(--vow-color-rose-clay);border-radius:3px"></span>
        <span class="vow-spec__val">${value}</span>
      </div>`;
    }).join('');

    const states = Object.keys(V.trust.STATES).map((key) => {
      const s = V.trust.STATES[key];
      const window = V.trust.FRESHNESS;
      return html`<tr>
        <td><strong>${s.name}</strong></td>
        <td>${s.definition}</td>
        <td>${raw(ui.evidence(sampleFact(key)))}</td>
      </tr>`;
    }).join('');

    const levels = V.delegation.LEVELS.map((l) => html`<tr>
      <td><strong>${l.name}</strong></td>
      <td>${l.detail}</td>
    </tr>`).join('');

    const actions = Object.keys(V.delegation.ACTIONS).map((id) => {
      const result = V.delegation.evaluate(id, V.state.delegation);
      return html`<tr>
        <td><strong>${V.delegation.ACTIONS[id].label}</strong></td>
        <td>${raw(ui.status(result.allowed ? 'Acts on its own' : 'Asks you first',
          { icon: result.allowed ? 'check' : 'hold', tone: result.allowed ? 'ready' : 'neutral' }))}</td>
        <td>${result.reason}</td>
      </tr>`;
    }).join('');

    return html`
      <div class="vow-col vow-col--wide">
        ${raw(ui.pageHead('Design system', 'The system, as built.',
          'Every value on this page is read from the live stylesheet, which is generated from tokens.json. If this page and the product ever disagree, the build is broken.'))}

        <section class="vow-section">
          ${raw(ui.sectionHead('Color', 'Rose clay, mist blue, and soft gold are fills only. Terracotta is a fill and a rule, never body text.'))}
          <div class="vow-spec">${raw(swatches)}</div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Spacing'))}
          <div class="vow-stack vow-stack--3">${raw(spaces)}</div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Buttons', 'One primary per visible decision area. A high-commitment action names its consequence beside it rather than taking a second color.'))}
          <div class="vow-row">
            ${raw(ui.button('Primary action', { variant: 'primary' }))}
            ${raw(ui.button('Secondary', { variant: 'secondary' }))}
            ${raw(ui.button('Quiet action', { variant: 'quiet' }))}
            ${raw(ui.button('Unavailable', { variant: 'primary', disabled: true }))}
          </div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Trust states', 'Every fact in the product resolves to exactly one of these four. A fact with no state renders as Unknown and reports itself to the console.'))}
          <div class="vow-scroll-x">
            <table class="vow-table">
              <thead><tr><th>State</th><th>Definition</th><th>How it reads</th></tr></thead>
              <tbody>${raw(states)}</tbody>
            </table>
          </div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('When a fact is replaced',
            'A fact the couple was shown, then replaced, produces a correction. It is assembled from the transition, never written by hand, so the product cannot quietly drop a claim it already made.'))}
          <div class="vow-stack vow-stack--5">
            ${raw(V.trust.corrections(V.data.allFacts()).map((c) => html`
              <div class="vow-panel vow-stack vow-stack--4">
                <div class="vow-compare" style="grid-template-columns:110px minmax(0,1fr) minmax(0,1fr)">
                  <div class="vow-compare__label vow-compare__head"></div>
                  <div class="vow-compare__cell vow-compare__head"><strong>What we said</strong></div>
                  <div class="vow-compare__cell vow-compare__head"><strong>What replaced it</strong></div>
                  <div class="vow-compare__label">State</div>
                  <div class="vow-compare__cell">${c.before.meta.name}</div>
                  <div class="vow-compare__cell">${c.after.meta.name}</div>
                  <div class="vow-compare__label">Value</div>
                  <div class="vow-compare__cell">${V.trust.displayValue(c.before)}</div>
                  <div class="vow-compare__cell">${V.trust.displayValue(c.after)}</div>
                </div>
                ${raw(ui.status(c.lessCertain ? 'Certainty went down, so the product says so' : 'Certainty held or improved',
                  { icon: c.lessCertain ? 'alert' : 'check', tone: c.lessCertain ? 'risk' : 'ready' }))}
                ${raw(ui.agentNote(c.body, 'correction'))}
              </div>`).join(''))}
          </div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Delegation levels'))}
          <div class="vow-scroll-x">
            <table class="vow-table">
              <thead><tr><th>Level</th><th>What it means</th></tr></thead>
              <tbody>${raw(levels)}</tbody>
            </table>
          </div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Every action VowOS can take',
            `Evaluated live against your current setting: ${V.delegation.levelById(V.state.delegation.level).name}.`))}
          <div class="vow-scroll-x">
            <table class="vow-table">
              <thead><tr><th>Action</th><th>Right now</th><th>Why</th></tr></thead>
              <tbody>${raw(actions)}</tbody>
            </table>
          </div>
        </section>

        <section class="vow-section">
          ${raw(ui.sectionHead('Agent notes and partner notes'))}
          <div class="vow-stack vow-stack--5">
            ${raw(ui.agentNote('I have sent the five venue inquiries you approved.'))}
            ${raw(ui.agentNote('This email was not sent. No venue received it.', 'correction'))}
            ${raw(ui.partnerNote('maya', 'Ready to review the two places.', { suffix: 'said' }))}
          </div>
        </section>
      </div>`;
  };

  function sampleFact(state) {
    const samples = {
      confirmed: { label: 'Capacity', value: '140 seated', state: 'confirmed', source: 'The Orchard House', asOf: '2026-08-04', category: 'capability' },
      reported: { label: 'Service charge', value: '22 percent', state: 'reported', source: 'a venue directory', category: 'pricing' },
      inferred: { label: 'Service charge', value: 5900, state: 'inferred', basis: 'three comparable Hudson venues', category: 'pricing' },
      unknown: { label: 'Outside catering', value: null, state: 'unknown', category: 'policy', pending: 'I asked on August 9.' },
    };
    return V.trust.resolve(samples[state]);
  }

  V.screens = Object.assign(V.screens || {}, screens);
})(window.VowOS);
