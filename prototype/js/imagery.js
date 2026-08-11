/* VowOS prototype — generative place compositions.
 *
 * UI Plan section 14 permits three kinds of image: rights-cleared venue
 * photography, couple-supplied visuals used in scope, or "abstract editorial
 * composition that does not pretend to be their wedding". A prototype has no
 * licensed venue photography, and generic stock couples are explicitly banned,
 * so every image here is the third kind: a drawn composition, labelled as one.
 *
 * This is not a placeholder standing in for photography. It is the honest
 * option, and it demonstrates the imagery rule rather than violating it.
 */
(function (V) {
  'use strict';

  let uid = 0;
  const nextId = () => `vow-g${++uid}`;

  function frame(inner, defs, label) {
    const grain = nextId();
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${V.esc(label)}">
      <defs>${defs}
        <filter id="${grain}" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>
          <feColorMatrix type="saturate" values="0" in="n"/>
        </filter>
      </defs>
      ${inner}
      <rect width="400" height="300" filter="url(#${grain})" opacity="0.05" style="mix-blend-mode:multiply"/>
    </svg>`;
  }

  const linear = (id, from, to, vertical) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient>`;

  const radial = (id, color, opacity) =>
    `<radialGradient id="${id}">
      <stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>`;

  /* ------------------------------------------------------------- scenes */

  /* An orchard on a slope, low sun. */
  function orchard() {
    const sky = nextId(); const sun = nextId();
    const defs = linear(sky, '#F7ECD8', '#FDF8EF', true) + radial(sun, '#D6B56F', 0.42);

    const tree = (x, y, rx, ry, fill) =>
      `<rect x="${x - 2}" y="${y - 4}" width="4" height="14" fill="#7A6650"/>
       <ellipse cx="${x}" cy="${y - ry + 2}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;

    const rowBack = [40, 96, 152, 208, 264, 320, 376]
      .map((x) => tree(x, 202, 15, 19, '#7E9578')).join('');
    const rowFront = [16, 88, 160, 232, 304, 376]
      .map((x) => tree(x, 250, 21, 26, '#68805F')).join('');

    return frame(`
      <rect width="400" height="300" fill="url(#${sky})"/>
      <circle cx="300" cy="72" r="96" fill="url(#${sun})"/>
      <path d="M0 172C60 156 118 166 180 156S300 144 400 158V300H0Z" fill="#CBD1BC"/>
      <g>
        <rect x="46" y="158" width="72" height="34" fill="#EFE6D6"/>
        <path d="M36 160L82 132L128 160Z" fill="#B58C72"/>
        <rect x="70" y="170" width="12" height="22" fill="#C6B49C"/>
        <rect x="94" y="168" width="10" height="10" fill="#C6B49C"/>
      </g>
      <path d="M0 192C80 182 160 194 250 186S360 180 400 188V300H0Z" fill="#B7C2A4"/>
      ${rowBack}
      <path d="M0 228Q200 214 400 232V300H0Z" fill="#A3B08D"/>
      ${rowFront}
      <path d="M0 276Q200 264 400 280V300H0Z" fill="#94A37E"/>
    `, defs, 'Illustrative composition: an orchard on a slope at low sun');
  }

  /* A tall-windowed room, daylight pooling on the floor. */
  function arch() {
    const glass = nextId(); const wall = nextId();
    const defs = linear(glass, '#FDF6E6', '#E9DCC2', true) + linear(wall, '#EDE4D5', '#E3D8C6', true);

    const window_ = (cx) => `
      <path d="M${cx - 34} 216V96a34 34 0 0168 0v120Z" fill="url(#${glass})" stroke="#7C7263" stroke-width="2"/>
      <path d="M${cx} 62v154M${cx - 34} 140h68" stroke="#7C7263" stroke-width="1.6" fill="none"/>`;

    const pool = (cx) =>
      `<path d="M${cx - 34} 216h68l30 62h-128Z" fill="#F8EED8" opacity="0.85"/>`;

    return frame(`
      <rect width="400" height="300" fill="url(#${wall})"/>
      <rect y="216" width="400" height="84" fill="#D3C4AE"/>
      ${[100, 200, 300].map(pool).join('')}
      ${[100, 200, 300].map(window_).join('')}
      <rect y="212" width="400" height="5" fill="#BEAF98"/>
      <g>
        <rect x="150" y="238" width="100" height="5" rx="2.5" fill="#7A6A56"/>
        <rect x="160" y="243" width="5" height="28" fill="#7A6A56"/>
        <rect x="235" y="243" width="5" height="28" fill="#7A6A56"/>
      </g>
      <rect x="30" y="246" width="26" height="30" rx="4" fill="#8C7B63"/>
      <ellipse cx="43" cy="238" rx="19" ry="15" fill="#6E8570"/>
    `, defs, 'Illustrative composition: a tall-windowed room with daylight on the floor');
  }

  /* A barn against an open field. */
  function barn() {
    const sky = nextId();
    const defs = linear(sky, '#E4EDF0', '#FBF7F0', true);

    return frame(`
      <rect width="400" height="300" fill="url(#${sky})"/>
      <path d="M0 176q26-16 52-4t54-2 52 6 56-10 58 4 68-2v122H0Z" fill="#63795F"/>
      <path d="M0 190C90 180 150 192 240 184s120-6 160 2V300H0Z" fill="#C3CCA9"/>
      <g>
        <path d="M104 134L200 86l96 48Z" fill="#8E4635"/>
        <rect x="122" y="132" width="156" height="66" fill="#B0674F"/>
        <rect x="182" y="150" width="36" height="48" fill="#6E4033"/>
        <path d="M182 150h36M200 150v48" stroke="#8E4635" stroke-width="2"/>
        <rect x="140" y="146" width="18" height="16" fill="#E7DCC7"/>
        <rect x="242" y="146" width="18" height="16" fill="#E7DCC7"/>
        <path d="M188 108l12-8 12 8v14h-24Z" fill="#E7DCC7"/>
      </g>
      <path d="M0 228q200-14 400 6V300H0Z" fill="#AFBB95"/>
      <g stroke="#9A8B72" stroke-width="2.4" fill="none">
        <path d="M0 224h400M0 236h400"/>
        <path d="M40 214v34M120 216v32M200 218v32M280 216v32M360 214v34"/>
      </g>
      <path d="M0 268q200-10 400 8V300H0Z" fill="#9DAA83"/>
    `, defs, 'Illustrative composition: a barn against an open field');
  }

  /* An interior with a long table and window light. */
  function rooms() {
    const light = nextId(); const wall = nextId();
    const defs = linear(light, '#FDF7E8', '#EFE1C4', true) + linear(wall, '#F1E9DC', '#E6DCCB', true);

    return frame(`
      <rect width="400" height="300" fill="url(#${wall})"/>
      <rect x="236" y="38" width="118" height="160" rx="4" fill="url(#${light})" stroke="#8A7F6E" stroke-width="2.4"/>
      <path d="M295 38v160M236 118h118" stroke="#8A7F6E" stroke-width="1.6"/>
      <path d="M236 198h118l52 84H150Z" fill="#F8EFD9" opacity="0.8"/>
      <rect y="206" width="400" height="94" fill="#C9B79F"/>
      <path d="M0 232h400M0 262h400" stroke="#BBA88E" stroke-width="1.6"/>
      <rect y="200" width="400" height="7" fill="#B09C81"/>
      <g>
        <ellipse cx="150" cy="228" rx="96" ry="17" fill="#8E7B63"/>
        <rect x="60" y="228" width="180" height="8" fill="#7C6A53"/>
        <rect x="78" y="236" width="6" height="30" fill="#7C6A53"/>
        <rect x="216" y="236" width="6" height="30" fill="#7C6A53"/>
      </g>
      <g fill="#6F6252">
        <rect x="42" y="204" width="24" height="4" rx="2"/><rect x="52" y="208" width="4" height="22"/>
        <rect x="236" y="204" width="24" height="4" rx="2"/><rect x="246" y="208" width="4" height="22"/>
      </g>
      <g>
        <path d="M150 0v46" stroke="#8A7F6E" stroke-width="1.6"/>
        <path d="M128 46h44l-10 20h-24Z" fill="#D6B56F"/>
      </g>
    `, defs, 'Illustrative composition: an interior with a long table and window light');
  }

  /* Open farmland in bands. */
  function farm() {
    const sky = nextId();
    const defs = linear(sky, '#EDF2F1', '#FCFAF4', true);

    return frame(`
      <rect width="400" height="300" fill="url(#${sky})"/>
      <path d="M0 168q60-12 132-6t128-8 140 2v144H0Z" fill="#5C7255"/>
      <path d="M0 182q100-14 200 0t200 4v114H0Z" fill="#C8D0AE"/>
      <path d="M0 206q110 12 200-4t200 6v92H0Z" fill="#B3BF96"/>
      <path d="M0 238q120-18 200 2t200-6v66H0Z" fill="#C4CDA6"/>
      <path d="M0 266q130 14 200-6t200 8v32H0Z" fill="#A5B387"/>
      <g fill="#4E6449">
        <ellipse cx="336" cy="160" rx="30" ry="24"/>
        <ellipse cx="366" cy="166" rx="22" ry="18"/>
        <ellipse cx="308" cy="168" rx="20" ry="16"/>
      </g>
      <g>
        <rect x="44" y="146" width="46" height="24" fill="#E4D9C6"/>
        <path d="M38 148L67 130L96 148Z" fill="#A9917A"/>
      </g>
      <path d="M0 190h400" stroke="#8FA07A" stroke-width="1.4" opacity="0.6"/>
    `, defs, 'Illustrative composition: open farmland in bands');
  }

  /* A courtyard under a pergola. */
  function courtyard() {
    const wall = nextId();
    const defs = linear(wall, '#F0E7D8', '#E5DAC7', true);

    const beams = [];
    for (let x = -40; x < 420; x += 44) {
      beams.push(`<path d="M${x} 0l30 118h-16L${x - 16} 0Z" fill="#1D1C1A" opacity="0.07"/>`);
    }

    return frame(`
      <rect width="400" height="300" fill="url(#${wall})"/>
      ${beams.join('')}
      <rect y="206" width="400" height="94" fill="#D8CBB8"/>
      <path d="M0 206h400" stroke="#C0B199" stroke-width="2.4"/>
      <path d="M60 206l40 94M160 206l40 94M260 206l40 94M360 206l40 94" stroke="#1D1C1A" stroke-width="16" opacity="0.05"/>
      <g>
        <rect x="28" y="214" width="52" height="46" rx="6" fill="#A9917A"/>
        <ellipse cx="54" cy="204" rx="34" ry="26" fill="#6E8570"/>
        <ellipse cx="32" cy="212" rx="18" ry="14" fill="#7E9578"/>
      </g>
      <g>
        <rect x="318" y="222" width="44" height="38" rx="6" fill="#A9917A"/>
        <ellipse cx="340" cy="214" rx="28" ry="22" fill="#68805F"/>
      </g>
      <rect x="150" y="150" width="100" height="56" rx="4" fill="#E9DFCC" stroke="#B9A98F" stroke-width="2"/>
      <path d="M200 150v56M150 178h100" stroke="#B9A98F" stroke-width="1.6"/>
    `, defs, 'Illustrative composition: a courtyard under a pergola');
  }

  /* An abstract wash built from an accepted palette. */
  function paletteScene(colors) {
    const sky = nextId();
    const list = colors && colors.length ? colors : ['#DAB5A6', '#345A4A', '#D6B56F', '#F5F1EA'];
    const defs = linear(sky, list[3] || '#F5F1EA', '#FCFBF8', true);
    return frame(`
      <rect width="400" height="300" fill="url(#${sky})"/>
      <path d="M0 300V150a200 150 0 01400 0v150Z" fill="${list[0]}" opacity="0.85"/>
      <circle cx="286" cy="104" r="58" fill="${list[2]}" opacity="0.75"/>
      <path d="M0 300V214a130 86 0 01260 0v86Z" fill="${list[1]}" opacity="0.9"/>
      <rect x="42" y="188" width="76" height="112" rx="38" fill="${list[3] || '#F5F1EA'}" opacity="0.55"/>
    `, defs, 'Abstract composition generated from the accepted palette');
  }

  /* Empty states: minimal paper and architecture, never a stock couple. */
  function abstract() {
    const wash = nextId();
    const defs = linear(wash, '#F5F1EA', '#FCFBF8', true);
    return frame(`
      <rect width="400" height="300" fill="url(#${wash})"/>
      <path d="M120 300V126a80 80 0 01160 0v174Z" fill="#E7E1D6"/>
      <path d="M162 300V140a38 38 0 0176 0v160Z" fill="#F5F1EA"/>
      <path d="M0 262h400" stroke="#E7E1D6" stroke-width="2"/>
    `, defs, 'Abstract editorial composition');
  }

  const SCENES = { orchard, arch, barn, rooms, farm, courtyard };

  V.imagery = {
    scene: function (name, colors) {
      if (name === 'palette') return paletteScene(colors);
      const fn = SCENES[name];
      return fn ? fn() : abstract();
    },
    palette: paletteScene,
    abstract: abstract,
    /* Every composition carries this line wherever it could be mistaken for a
       photograph of the real place. */
    credit: 'Illustrative composition, not a photograph of the place.',
  };
})(window.VowOS);
