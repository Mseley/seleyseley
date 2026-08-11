/* VowOS prototype — utilities, formatting, and the icon set.
 *
 * Plain scripts on a single global namespace rather than ES modules, so the
 * prototype runs from file:// with no build step and bundles by concatenation.
 */
window.VowOS = window.VowOS || {};

(function (V) {
  'use strict';

  /* The prototype is deterministic: every relative date, countdown, and
     staleness calculation resolves against this fixed present. */
  V.NOW = new Date(2026, 7, 11, 18, 30, 0);

  /* ------------------------------------------------------------- strings */

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  V.esc = function (value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
  };

  /* Tagged template that escapes interpolations by default. Pass V.raw(x) to
     opt out for already-trusted markup. */
  V.html = function (strings, ...values) {
    return strings.reduce((out, str, i) => {
      if (i === 0) return str;
      const value = values[i - 1];
      let rendered;
      if (value && value.__raw) rendered = value.value;
      else if (Array.isArray(value)) rendered = value.map((v) => (v && v.__raw ? v.value : V.esc(v))).join('');
      else if (value === null || value === undefined || value === false) rendered = '';
      else rendered = V.esc(value);
      return out + rendered + str;
    }, '');
  };

  V.raw = function (value) {
    return { __raw: true, value: value === null || value === undefined ? '' : String(value) };
  };

  /* --------------------------------------------------------------- dates */

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* Date-only strings are parsed as local, not UTC, so a date never renders as
     the previous day west of Greenwich. */
  V.parseDate = function (value) {
    if (value instanceof Date) return value;
    const [datePart, timePart] = String(value).split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    if (!timePart) return new Date(y, m - 1, d);
    const [hh, mm] = timePart.split(':').map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0);
  };

  V.fmtDate = function (value, style) {
    const d = V.parseDate(value);
    const month = MONTHS[d.getMonth()];
    switch (style) {
      case 'long':     return `${month} ${d.getDate()}, ${d.getFullYear()}`;
      case 'weekday':  return `${DAYS[d.getDay()]}, ${month} ${d.getDate()}`;
      case 'weekdayShort': return `${DAYS[d.getDay()].slice(0, 3)} ${month.slice(0, 3)} ${d.getDate()}`;
      case 'dayMonth': return `${month} ${d.getDate()}`;
      case 'short':    return `${month.slice(0, 3)} ${d.getDate()}`;
      default:         return `${month} ${d.getDate()}, ${d.getFullYear()}`;
    }
  };

  V.fmtTime = function (value) {
    const d = V.parseDate(value);
    let h = d.getHours();
    const m = d.getMinutes();
    const suffix = h >= 12 ? 'p.m.' : 'a.m.';
    h = h % 12 || 12;
    return m === 0 ? `${h} ${suffix}` : `${h}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  V.daysBetween = function (from, to) {
    const a = V.parseDate(from);
    const b = V.parseDate(to);
    const startA = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const startB = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((startB - startA) / 86400000);
  };

  /* Dates in agent language, per UI Plan 11.3: real dates, not vague time
     words. "Today" and "yesterday" are the only relative terms allowed. */
  V.relativeDate = function (value) {
    const delta = V.daysBetween(V.NOW, value);
    if (delta === 0) return 'today';
    if (delta === -1) return 'yesterday';
    if (delta === 1) return 'tomorrow';
    return V.fmtDate(value, Math.abs(delta) > 300 ? 'long' : 'dayMonth');
  };

  /* --------------------------------------------------------------- money */

  V.fmtMoney = function (amount, opts) {
    const options = opts || {};
    const rounded = Math.round(Number(amount));
    const body = Math.abs(rounded).toLocaleString('en-US');
    const sign = rounded < 0 ? '-' : options.signed ? '+' : '';
    return `${sign}$${body}`;
  };

  /* --------------------------------------------------------------- icons */

  const P = (d, extra) =>
    `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"${extra || ''}/>`;
  const C = (cx, cy, r) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.6"/>`;
  const DOT = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r || 1.15}" fill="currentColor"/>`;

  const ICONS = {
    today:    P('M4 18.5h16') + P('M7.6 14.6a4.4 4.4 0 018.8 0') + P('M12 4v2.6') + P('M5.4 7.4l1.8 1.8') + P('M18.6 7.4l-1.8 1.8'),
    vision:   P('M12 3.6a8.4 8.4 0 000 16.8c1.5 0 2-1.1 1.4-2-.6-1 .1-2.1 1.3-2.1h1.6a4 4 0 003.7-4c0-4.8-3.7-8.7-8-8.7z') + DOT(8.6, 10.4, 1.15) + DOT(11.4, 7.9, 1.15) + DOT(15.2, 9.6, 1.15),
    places:   P('M12 21c0 0 6.6-6 6.6-10.8A6.6 6.6 0 0012 3.6a6.6 6.6 0 00-6.6 6.6C5.4 15 12 21 12 21z') + C(12, 10.1, 2.4),
    plan:     P('M5 6.4h14a1 1 0 011 1v11.2a1 1 0 01-1 1H5a1 1 0 01-1-1V7.4a1 1 0 011-1z') + P('M8 4v4') + P('M16 4v4') + P('M4 11h16') + DOT(8.6, 14.6) + DOT(12, 14.6) + DOT(8.6, 17.4),
    guests:   C(9.2, 8.6, 3.1) + P('M3.6 19.4a5.9 5.9 0 0111.2 0') + P('M16.2 6a3.1 3.1 0 010 5.6') + P('M17.6 14.4a5.9 5.9 0 012.8 5'),
    more:     DOT(6, 12, 1.5) + DOT(12, 12, 1.5) + DOT(18, 12, 1.5),
    system:   P('M4 8h10') + P('M18 8h2') + P('M4 16h4') + P('M12 16h8') + C(16, 8, 2.2) + C(10, 16, 2.2),

    check:    P('M4.6 12.6l4.8 4.8L19.4 7.2'),
    clock:    C(12, 12, 8.4) + P('M12 7.2v5.2l3.4 2'),
    doc:      P('M6.4 3.8h6.8l4.4 4.4v11.9a.5.5 0 01-.5.5H6.4a.5.5 0 01-.5-.5V4.3a.5.5 0 01.5-.5z') + P('M13.2 3.8v4.4h4.4'),
    approx:   C(12, 12, 8.4) + P('M8 13.2c1.1-2.2 2.5-2.2 4 0s2.9 2.2 4 0'),
    unknown:  C(12, 12, 8.4) + P('M9.6 9.5a2.5 2.5 0 014.9.7c0 1.7-2.4 2.1-2.4 3.7') + DOT(12, 16.4, 1.2),
    avoid:    C(12, 12, 8.4) + P('M8.4 12h7.2'),
    alert:    P('M12 4.4l8.6 14.5a.6.6 0 01-.5.9H3.9a.6.6 0 01-.5-.9L12 4.4z') + P('M12 10v3.8') + DOT(12, 16.8, 1.2),
    chevron:  P('M9.5 5.5l6.5 6.5-6.5 6.5'),
    arrow:    P('M4.5 12h14') + P('M12.8 6.2l5.8 5.8-5.8 5.8'),
    hold:     P('M8 6.5h2.4v11H8z') + P('M13.6 6.5H16v11h-2.4z'),
    send:     P('M20 4L3.8 10.6l6.3 2.6 2.6 6.3L20 4z') + P('M10.1 13.2L20 4'),
    person:   C(12, 8.4, 3.2) + P('M5.6 19.6a6.6 6.6 0 0112.8 0'),
    money:    C(12, 12, 8.4) + P('M12 7.6v8.8') + P('M14.4 9.8a2.6 2.6 0 00-2.4-1.3c-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2 2.7.8 2.7 2-1.1 2-2.7 2a2.7 2.7 0 01-2.5-1.4'),
    pin:      P('M12 21c0 0 6.6-6 6.6-10.8A6.6 6.6 0 0012 3.6a6.6 6.6 0 00-6.6 6.6C5.4 15 12 21 12 21z') + C(12, 10.1, 2.4),
    edit:     P('M16.4 4.6l3 3L9.8 17.2l-3.9.9.9-3.9 9.6-9.6z') + P('M14.6 6.4l3 3'),
  };

  V.icon = function (name, opts) {
    const options = opts || {};
    const body = ICONS[name];
    if (!body) return '';
    const cls = options.className ? ` class="${V.esc(options.className)}"` : '';
    const size = options.size ? ` width="${options.size}" height="${options.size}"` : '';
    /* Icons are always paired with text, so they are decorative to assistive
       technology. UI Plan 13: never state by icon alone. */
    return `<svg viewBox="0 0 24 24"${size}${cls} aria-hidden="true" focusable="false">${body}</svg>`;
  };

  /* --------------------------------------------------------------- misc */

  V.pluralize = function (count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural || singular + 's'}`;
  };

  /* Spelled-out small numbers read better in agent sentences than digits. */
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  V.numberWord = function (n) {
    return n >= 0 && n <= 10 ? WORDS[n] : String(n);
  };

  V.capitalize = function (text) {
    const s = String(text);
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  V.byId = function (list, id) {
    return list.find((item) => item.id === id) || null;
  };
})(window.VowOS);
