/* VowOS prototype — shell, routing, state, and interaction behavior.
 *
 * Interaction rules implemented here come from UI Plan 11.4: approvals show
 * exact recipients before sending, evidence expands in place, rejection asks
 * for an optional one-tap reason, and nothing implies a booking that has only
 * been proposed.
 */
(function (V) {
  'use strict';

  const html = V.html;
  const raw = V.raw;
  const ui = V.ui;

  /* ------------------------------------------------------------- state */

  V.state = {
    route: { name: 'today', param: null },
    drawers: {},
    placeStatus: {},
    palette: 'late-orchard',
    delegation: {
      level: 'standing',
      scopes: ['follow-up-once', 'propose-tour-times', 'request-missing-facts'],
    },
    tourDate: null,
    tourSelection: null,
    tourStatus: {},
    tourConfirmedFor: null,
    compareFocus: 'a',
    siteSection: 's1',
    dialog: null,
    toast: null,
    announcement: '',
  };

  let toastTimer = null;

  function toast(message, announce) {
    V.state.toast = message;
    if (announce !== false) V.state.announcement = message;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      V.state.toast = null;
      render();
    }, 6000);
    render();
  }

  /* ---------------------------------------------------------- navigation */

  const NAV = [
    { id: 'today', label: 'Today', href: '#/today', icon: 'today', question: 'What deserves our attention right now?' },
    { id: 'vision', label: 'Vision', href: '#/vision', icon: 'vision', question: 'What are we actually creating?' },
    { id: 'places', label: 'Places', href: '#/places', icon: 'places', question: 'Where could this happen?' },
    { id: 'plan', label: 'Plan', href: '#/plan', icon: 'plan', question: 'Is the wedding feasible and moving?' },
    { id: 'guests', label: 'Guests', href: '#/guests', icon: 'guests', question: 'What will our people need from us?' },
    { id: 'more', label: 'More', href: '#/more', icon: 'more', question: 'Where are the details?' },
  ];

  /* Mobile keeps four workspaces plus an overflow, per UI Plan 7.1. */
  const TABS = ['today', 'vision', 'places', 'plan', 'more'];

  function parseRoute() {
    const hash = (window.location.hash || '#/today').replace(/^#\/?/, '');
    const [name, param] = hash.split('/');
    return { name: name || 'today', param: param || null };
  }

  function activeWorkspace(route) {
    if (route.name === 'tour') return 'places';
    if (route.name === 'studio') return 'guests';
    if (route.name === 'system') return 'more';
    return route.name;
  }

  /* ------------------------------------------------------------ screens */

  V.screens = V.screens || {};

  V.screens.more = function () {
    const items = [
      { label: 'Tours', note: 'Times proposed, held, and confirmed.', href: '#/tour' },
      { label: 'Website studio', note: 'What your guests will see.', href: '#/studio' },
      { label: 'Documents and commitments', note: 'Proposals, rates, and the one contract you have signed.', href: '#/plan' },
      { label: 'Preferences and privacy', note: 'What VowOS may do on its own, and what stays between you.', href: '#/vision' },
      { label: 'Design system', note: 'The system this product is built from, as built.', href: '#/system' },
    ];
    const rows = items.map((i) => html`<li>
      <a class="vow-timeline__row" href="${i.href}" style="text-decoration:none;grid-template-columns:minmax(0,1fr) auto;align-items:center">
        <span>
          <span style="font-weight:600">${i.label}</span>
          <span class="vow-meta" style="display:block;margin-top:4px">${i.note}</span>
        </span>
        ${raw(V.icon('chevron', { size: 17 }))}
      </a>
    </li>`).join('');

    return html`<div class="vow-col">
      ${raw(ui.pageHead('More', 'The details.', 'Nothing here needs you today. It is kept out of the way on purpose.'))}
      <ul class="vow-timeline">${raw(rows)}</ul>
    </div>`;
  };

  /* ------------------------------------------------------------ dialogs */

  const DIALOGS = {
    /* Approval shows exact recipients and a final send summary before anything
       leaves the product (11.4). */
    approveTour: function (payload) {
      const place = V.byId(V.data.places, payload.placeId);
      const window_ = payload.window;
      return {
        title: 'Before this goes to ' + place.name,
        body: html`
          ${raw(ui.receipt('This is exactly what gets sent', [
            ['To', `${place.name}, events inbox`],
            ['From', 'VowOS, on behalf of Maya and Alex'],
            ['Asking for', `${V.fmtDate(window_.date, 'weekday')} at ${V.fmtTime(window_.time)}`],
            ['Also asking', 'Whether the service charge is included in the site fee'],
          ]))}
          <p class="vow-consequence" style="margin-top:var(--vow-space-4)">
            This is a request, not a booking. ${place.name} has to answer before anything is held.
          </p>`,
        primary: { label: 'Send the request', act: 'confirm-tour-time' },
      };
    },

    commit: function () {
      const d = V.data;
      return {
        title: 'Committing to a place',
        body: html`
          <p class="vow-body" style="font-size:var(--vow-font-size-body-small)">
            You have not both chosen the same place yet, so there is nothing for me to send.
            When you agree, this is what committing will mean.
          </p>
          ${raw(ui.receipt('What committing does', [
            ['Money', 'A deposit, which is the first non-refundable thing in your plan'],
            ['Your date', 'Saturday, June 12, 2027 stops being available to anyone else'],
            ['The other place', 'I write to them and withdraw, so nobody is left waiting'],
            ['Your plan', 'Travel, save the dates, and the guest website all unblock'],
          ]))}
          ${raw(ui.agentNote('Money and anything you cannot take back always come back to you both. This is not something I will ever do on a standing approval.'))}`,
        primary: null,
        secondaryLabel: 'Understood',
      };
    },

    ruleOut: function (payload) {
      const place = V.byId(V.data.places, payload.placeId);
      const reasons = ['Too expensive', 'Wrong room', 'Too far', 'Just not it'];
      return {
        title: `Ruling out ${place.name}`,
        body: html`
          <p class="vow-body" style="font-size:var(--vow-font-size-body-small)">
            One tap if you want to tell me why. It makes the next suggestions better.
            Skipping is fine and I will not ask again.
          </p>
          <div class="vow-row" style="margin-top:var(--vow-space-5)">
            ${raw(reasons.map((r) => ui.button(r, { variant: 'secondary', act: 'confirm-rule-out', value: payload.placeId + '|' + r })).join(''))}
          </div>`,
        primary: null,
        secondaryLabel: 'Rule it out without saying why',
        secondaryAct: 'confirm-rule-out',
        secondaryValue: payload.placeId + '|',
      };
    },

    publish: function () {
      return {
        title: 'Publishing to your guest website',
        body: html`
          ${raw(ui.receipt('What changes', [
            ['Page', 'mayaandalex.wedding'],
            ['Visible to', 'Anyone with the link'],
            ['Changing', 'The welcome chapter and the questions chapter'],
            ['Not changing', 'Travel, which is still waiting on the place'],
            ['Guests notified', 'Nobody. That is a separate thing you would ask for.'],
          ]))}`,
        primary: { label: 'Publish', act: 'confirm-publish' },
      };
    },

    addressRequest: function () {
      return {
        title: 'A message to eighteen households',
        body: html`
          <div class="vow-panel vow-stack vow-stack--3">
            <p class="vow-label">Draft</p>
            <p style="font-size:var(--vow-font-size-body-small)">
              Hello. Maya and Alex are getting married next June and would like to send you something in the post.
              Would you mind replying with your address? That is all we need for now.
            </p>
          </div>
          <p class="vow-consequence" style="margin-top:var(--vow-space-4)">
            Nothing has been sent. You will see all eighteen names, and you can take any of them out,
            before this goes anywhere.
          </p>`,
        primary: { label: 'Show me the eighteen names', act: 'close-dialog' },
      };
    },

    tourBrief: function () {
      return {
        title: 'Tour brief, The Orchard House',
        body: html`
          <p class="vow-body" style="font-size:var(--vow-font-size-body-small)">
            Four questions, built from what we still have not verified. I will send this to you both
            on Monday, the day before you go.
          </p>
          <ul class="vow-stack vow-stack--3" style="margin-top:var(--vow-space-5)">
            ${raw([
              'Is the 22 percent service charge real, and is it on the site fee or the food?',
              'Can we bring in outside catering, and what does that change?',
              'How long does the barn take to set up if it rains, and who does it?',
              'Is 1 a.m. the music curfew or the everyone-out curfew?',
            ].map((q) => `<li class="vow-row" style="align-items:flex-start;flex-wrap:nowrap;gap:var(--vow-space-3)">
              <span class="vow-quiet" style="flex:none;margin-top:3px">${V.icon('unknown', { size: 15 })}</span>
              <span style="font-size:var(--vow-font-size-body-small)">${V.esc(q)}</span></li>`).join(''))}
          </ul>`,
        primary: null,
        secondaryLabel: 'Close',
      };
    },

    note: function () {
      return {
        title: 'A note for each other',
        body: html`
          <div class="vow-field">
            <label class="vow-field__label" for="vow-note">What do you want to say?</label>
            <textarea class="vow-input" id="vow-note" placeholder="I want to see the barn before we decide anything."></textarea>
            <p class="vow-field__help">This goes to Alex and stays between you both. VowOS does not use it to change what it recommends.</p>
          </div>`,
        primary: { label: 'Leave the note', act: 'confirm-note' },
      };
    },

    needsApproval: function (payload) {
      return {
        title: 'This one needs you',
        body: html`
          <p class="vow-body" style="font-size:var(--vow-font-size-body-small)">${payload.reason}</p>
          ${raw(ui.agentNote('You can change what I am allowed to do in Vision, under what VowOS may do on its own. Money and anything you cannot take back will still always come back to you.'))}`,
        primary: { label: 'Approve just this one', act: payload.confirmAct || 'close-dialog', value: payload.value },
      };
    },
  };

  function openDialog(kind, payload) {
    V.state.dialog = { kind, payload: payload || {} };
    render();
  }

  function closeDialog() {
    V.state.dialog = null;
    render();
  }

  function renderDialog() {
    const d = V.state.dialog;
    if (!d) return '';
    const spec = DIALOGS[d.kind](d.payload);
    return html`<div class="vow-scrim" data-act="close-dialog">
      <div class="vow-dialog vow-stack vow-stack--5" role="dialog" aria-modal="true"
           aria-label="${spec.title}" data-stop="true" tabindex="-1">
        <h2 class="vow-title" style="font-size:23px">${spec.title}</h2>
        <div>${raw(spec.body)}</div>
        <div class="vow-row vow-row--actions">
          ${raw(spec.primary ? ui.button(spec.primary.label, {
            variant: 'primary', act: spec.primary.act, value: spec.primary.value || (d.payload && d.payload.value) || '',
          }) : '')}
          ${raw(ui.button(spec.secondaryLabel || 'Not now', {
            variant: spec.primary ? 'quiet' : 'secondary',
            act: spec.secondaryAct || 'close-dialog',
            value: spec.secondaryValue || '',
          }))}
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------- render */

  function renderRail(route) {
    const active = activeWorkspace(route);
    const items = NAV.map((n) => html`<a class="vow-nav__item" href="${n.href}"
        ${raw(n.id === active ? 'aria-current="page"' : '')}>
      ${raw(V.icon(n.icon))}${n.label}
    </a>`).join('');

    return html`<nav class="vow-rail" aria-label="Workspaces">
      <div class="vow-brand">
        <div class="vow-brand__mark">VowOS</div>
        <div class="vow-brand__event">${V.data.couple.title}<br/>${V.fmtDate(V.data.wedding.date, 'long')}</div>
      </div>
      <div class="vow-nav">${raw(items)}</div>
      <div class="vow-rail__foot">
        <a class="vow-nav__item" href="#/today" style="padding-left:0">
          ${raw(V.icon('clock'))}VowOS is working on ${raw(V.numberWord(V.data.agentWork.filter((w) => w.tone === 'waiting').length))} things
        </a>
      </div>
    </nav>`;
  }

  function renderTabs(route) {
    const active = activeWorkspace(route);
    const items = TABS.map((id) => {
      const n = V.byId(NAV, id);
      return html`<a class="vow-tabbar__item" href="${n.href}"
        ${raw(n.id === active ? 'aria-current="page"' : '')}>
        ${raw(V.icon(n.icon))}${n.label}
      </a>`;
    }).join('');
    return html`<nav class="vow-tabbar" aria-label="Workspaces">${raw(items)}</nav>`;
  }

  function renderScreen(route) {
    switch (route.name) {
      case 'places': return route.param ? V.screens.place(route.param) : V.screens.places();
      case 'vision': return V.screens.vision();
      case 'decide': return V.screens.decide();
      case 'tour': return V.screens.tour();
      case 'plan': return V.screens.plan();
      case 'guests': return V.screens.guests();
      case 'studio': return V.screens.studio();
      case 'system': return V.screens.system();
      case 'more': return V.screens.more();
      case 'today':
      default: return V.screens.today();
    }
  }

  function render() {
    const route = V.state.route;
    /* Keyboard focus survives a re-render, which is what makes the keyboard
       path in UI Plan 13 real rather than aspirational. */
    const activeEl = document.activeElement;
    const focusKey = activeEl && activeEl.dataset && activeEl.dataset.act
      ? activeEl.dataset.act + '|' + (activeEl.dataset.value || '')
      : null;
    const scroll = window.scrollY;

    const root = document.getElementById('app');
    root.innerHTML = html`
      <a class="vow-skip" href="#vow-main">Skip to the main content</a>
      <div class="vow-shell">
        ${raw(renderRail(route))}
        <div>
          <div class="vow-mobilehead">
            <span class="vow-brand__mark" style="font-size:19px">VowOS</span>
            <span class="vow-meta">${V.data.couple.title}, ${V.fmtDate(V.data.wedding.date, 'long')}</span>
          </div>
          <main class="vow-canvas" id="vow-main" tabindex="-1">${raw(renderScreen(route))}</main>
        </div>
      </div>
      ${raw(renderTabs(route))}
      ${raw(renderDialog())}
      ${V.state.toast ? raw(html`<div class="vow-toast">${V.state.toast}</div>`) : ''}
      <div class="vow-sr" role="status" aria-live="polite">${V.state.announcement}</div>`;

    if (V.state.dialog) {
      const dialog = root.querySelector('.vow-dialog');
      if (dialog) dialog.focus();
    } else if (focusKey) {
      const restored = root.querySelector(
        `[data-act="${focusKey.split('|')[0]}"]${focusKey.split('|')[1] ? `[data-value="${focusKey.split('|')[1]}"]` : ''}`
      );
      if (restored) restored.focus({ preventScroll: true });
      window.scrollTo({ top: scroll, behavior: 'instant' in window ? 'instant' : 'auto' });
    }
  }

  V.render = render;

  /* ------------------------------------------------------------ actions */

  const ACTIONS = {
    noop: function () {},

    go: function (value) {
      window.location.hash = value;
    },

    'toggle-drawer': function (value) {
      V.state.drawers[value] = !V.state.drawers[value];
      render();
    },

    'defer-decision': function () {
      toast('Nothing moves until you say so. I will bring this back on Monday, August 17.');
    },

    'choose-palette': function (value) {
      V.state.palette = value;
      const p = V.byId(V.data.vision.palettes, value);
      toast(`${p.name} is now your direction. Your guest website follows it.`);
    },

    'set-delegation': function (value) {
      V.state.delegation.level = value;
      toast(`Changed. ${V.delegation.levelById(value).summary}`);
    },

    'toggle-scope': function (value) {
      const list = V.state.delegation.scopes;
      const at = list.indexOf(value);
      if (at === -1) list.push(value); else list.splice(at, 1);
      const scope = V.byId(V.delegation.SCOPES, value);
      toast(at === -1
        ? `On. VowOS will now do this without asking: ${scope.label.toLowerCase()}.`
        : `Off. VowOS will ask you first from now on.`);
    },

    'confirm-vision': function () {
      toast('Confirmed. I will look for places against this, and tell you when something does not fit.');
    },

    'refine-feeling': function () {
      toast('Tell me what is off and I will rewrite it. Nothing else changes until you are happy with this.');
    },

    'answer-question': function () {
      toast('Answered. That is one less thing we have to guess at.');
    },

    'skip-question': function () {
      toast('Skipped. I will stop asking, and I will say we have not confirmed it rather than guess.');
    },

    /* Narrow screens compare one place at a time. Switching focus never
       changes either option's state, only which one is on screen (11.4). */
    'pick-compare': function (value) {
      V.state.compareFocus = value;
      render();
    },

    'open-place': function (value) {
      window.location.hash = '#/places/' + value;
    },

    'save-place': function (value) {
      V.state.placeStatus[value] = 'saved';
      const place = V.byId(V.data.places, value);
      toast(`${place.name} is saved. It is in your places, nothing has been sent to them.`);
    },

    'rule-out': function (value) {
      openDialog('ruleOut', { placeId: value });
    },

    'confirm-rule-out': function (value) {
      const [id, reason] = value.split('|');
      V.state.placeStatus[id] = 'ruled-out';
      const place = V.byId(V.data.places, id);
      closeDialog();
      toast(reason
        ? `${place.name} is out. I will stop suggesting places that are ${reason.toLowerCase()}.`
        : `${place.name} is out. It stays in your list in case you change your mind.`);
    },

    'show-ruled-out': function () {
      toast('All 38 are there with the reason each one was set aside. Nothing is hidden, it is just not in your way.');
    },

    /* Delegation-aware. A request for a tour time is covered by a standing
       approval; without that approval it becomes an explicit ask. */
    'request-tour': function (value) {
      const result = V.delegation.evaluate('request-tour', V.state.delegation);
      const place = V.byId(V.data.places, value);
      if (!result.allowed) {
        openDialog('needsApproval', { reason: result.reason, confirmAct: 'go', value: '#/tour' });
        return;
      }
      window.location.hash = '#/tour';
      setTimeout(() => toast(`${result.reason} Choose a time and I will ask ${place.name} for it.`), 60);
    },

    'pick-tour-date': function (value) {
      V.state.tourDate = value;
      V.state.tourSelection = null;
      render();
    },

    'pick-tour-time': function (value) {
      V.state.tourSelection = value;
      render();
    },

    'ask-tour-time': function (value) {
      const tour = V.byId(V.data.tours, value);
      const window_ = tour.windows.find((w) => w.id === V.state.tourSelection);
      if (!window_) return;
      openDialog('approveTour', { placeId: tour.placeId, window: window_, value });
    },

    'confirm-tour-time': function (value) {
      const tour = V.byId(V.data.tours, value) || V.data.tours[1];
      const window_ = tour.windows.find((w) => w.id === V.state.tourSelection);
      const place = V.byId(V.data.places, tour.placeId);
      closeDialog();
      /* fmtTime already ends in a period ("5:30 p.m."), so the sentence
         continues without adding a second one. */
      toast(`Asked. ${place.name} has your request for ${V.fmtDate(window_.date, 'weekday')} at ${V.fmtTime(window_.time)} Nothing is booked until they answer, and I will tell you when they do.`);
    },

    'no-times-work': function () {
      toast('Understood. I will ask them what else they have, rather than making you guess.');
    },

    'add-calendar': function () {
      toast('Added to both your calendars, with the travel time from Rhinecliff built in.');
    },

    'tour-brief': function () {
      openDialog('tourBrief', {});
    },

    'extend-hold': function () {
      const result = V.delegation.evaluate('ask-question', V.state.delegation);
      if (!result.allowed) {
        openDialog('needsApproval', { reason: result.reason });
        return;
      }
      toast('Asked. The Orchard House has a request to hold June 12 past Friday. I will tell you either way by Thursday.');
    },

    'leave-note': function () {
      openDialog('note', {});
    },

    'confirm-note': function () {
      closeDialog();
      toast('Left for Alex. It is between you both, and it does not change what I recommend.');
    },

    'open-commit': function () {
      openDialog('commit', {});
    },

    'draft-address-request': function () {
      openDialog('addressRequest', {});
    },

    'show-households': function () {
      toast('Eighteen households, with what is missing from each. None of them have been contacted.');
    },

    'pick-section': function (value) {
      V.state.siteSection = value;
      render();
    },

    'publish-site': function () {
      const result = V.delegation.evaluate('publish-website', V.state.delegation);
      if (!result.allowed) {
        openDialog('publish', {});
        return;
      }
      openDialog('publish', {});
    },

    'confirm-publish': function () {
      V.data.website.published = true;
      closeDialog();
      toast('Published. Two chapters changed. Nobody was notified.');
    },

    'view-as-guest': function () {
      toast('This is what a guest sees. Nothing about your budget, your places, or your notes is on that page.');
    },

    'close-dialog': function () {
      closeDialog();
    },
  };

  /* ------------------------------------------------------------- events */

  function onClick(event) {
    const trigger = event.target.closest('[data-act]');
    if (!trigger) return;

    /* Clicking the dialog body must not close the dialog behind it. */
    if (trigger.classList.contains('vow-scrim') && event.target.closest('[data-stop]')) return;

    const act = trigger.dataset.act;
    const handler = ACTIONS[act];
    if (!handler) return;

    event.preventDefault();
    handler(trigger.dataset.value || '');
  }

  function onKeydown(event) {
    if (event.key === 'Escape' && V.state.dialog) {
      event.preventDefault();
      closeDialog();
    }
  }

  function onHashChange() {
    V.state.route = parseRoute();
    V.state.dialog = null;
    render();
    const main = document.getElementById('vow-main');
    if (main) {
      window.scrollTo({ top: 0 });
      main.focus({ preventScroll: true });
    }
  }

  function start() {
    V.state.route = parseRoute();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('hashchange', onHashChange);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window.VowOS);
