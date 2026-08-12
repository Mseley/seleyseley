/* VowOS prototype — the fictional wedding.
 *
 * UI Plan section 17 requires realistic copy and a consistent couple and venue
 * set, not lorem ipsum or placeholder dashboard data, because a calm interface
 * is easy to fake with empty content and hard to earn with real content.
 *
 * Every fact carries a trust state and, where relevant, a source and a date.
 * Facts are deliberately uneven: some confirmed, one stale, one wrong and
 * corrected, several genuinely unknown. That unevenness is the point.
 */
(function (V) {
  'use strict';

  const couple = {
    title: 'Maya and Alex',
    partners: [
      { id: 'maya', name: 'Maya', initials: 'M', slot: 'a' },
      { id: 'alex', name: 'Alex', initials: 'A', slot: 'b' },
    ],
  };

  const wedding = {
    date: '2027-06-12',
    dateFlexible: 'Saturday is fixed. Sunday, June 13 is open to discussion.',
    region: 'Hudson Valley, New York',
    guests: 110,
    guestRange: '105 to 118',
    budgetComfort: 85000,
    origin: 'Rhinecliff station',
  };

  /* ---------------------------------------------------------- the places */

  const places = [
    {
      id: 'orchard-house',
      name: 'The Orchard House',
      location: 'Rhinebeck, New York',
      travel: '18 minutes from Rhinecliff station',
      scene: 'orchard',
      status: 'saved',
      whyItFits: [
        'The dinner is served at one long table under the trees, which is the closest thing we have found to the evening you described.',
        'Music can run until 1 a.m., which is the latest curfew of anywhere in your range.',
      ],
      realityCheck: 'It is the most expensive place on your list, and two sources disagree about the service charge by about 6,300 dollars.',
      facts: [
        { id: 'oh-fee', label: 'Site fee', value: 34200, state: 'confirmed', source: 'The Orchard House', asOf: '2026-08-04', category: 'pricing' },
        { id: 'oh-cap', label: 'Seated capacity', value: '140 seated', state: 'confirmed', source: 'The Orchard House', asOf: '2026-08-04', category: 'capability' },
        { id: 'oh-curfew', label: 'Music curfew', value: '1:00 a.m.', state: 'confirmed', source: 'The Orchard House', asOf: '2026-08-04', category: 'policy' },
        { id: 'oh-date', label: 'Your date', value: 'Saturday, June 12, 2027 is open', state: 'confirmed', source: 'The Orchard House', asOf: '2026-07-20', category: 'availability' },
        { id: 'oh-rain', label: 'Rain plan', value: 'The restored barn seats all 140', state: 'confirmed', source: 'The Orchard House', asOf: '2026-08-04', category: 'capability' },
        { id: 'oh-access', label: 'Accessibility', value: 'Step-free ceremony lawn, one accessible restroom', state: 'confirmed', source: 'The Orchard House', asOf: '2026-08-04', category: 'capability' },
        /* A contested claim. Two live sources, neither of them the place
           itself, describing the same thing and disagreeing by an amount that
           changes the decision. The product presents the disagreement rather
           than resolving it. */
        {
          id: 'oh-service', label: 'Service charge', value: '22 percent on top of food and drink',
          state: 'reported', source: 'a Hudson Valley venue directory', asOf: '2026-08-03', category: 'pricing',
          claim: 'oh-service-charge', subject: 'the service charge at The Orchard House',
          spread: 6292,
          resolvedBy: 'The Orchard House confirming it in writing. I asked on August 9.',
        },
        {
          id: 'oh-service-brochure', label: 'Service charge', value: 'Included in the site fee',
          state: 'reported', source: 'their own 2026 wedding brochure', asOf: '2026-08-04', category: 'pricing',
          claim: 'oh-service-charge',
        },
        { id: 'oh-catering', label: 'Outside catering', value: null, state: 'unknown', category: 'policy', pending: 'I asked on August 9 and expect an answer this week.' },
      ],
      hold: { until: '2026-08-14T17:00', what: 'Saturday, June 12, 2027' },
    },
    {
      id: 'maison-98',
      name: 'Maison 98',
      location: 'Hudson, New York',
      travel: '9 minutes on foot from Hudson station',
      scene: 'arch',
      status: 'saved',
      whyItFits: [
        'A former warehouse with twelve-foot arched windows, so the room is still full of light at 7 p.m. in June.',
        'It keeps about 7,400 dollars more of your budget available for food and music.',
      ],
      realityCheck: 'If it rains, the ceremony moves inside and the room seats 96. You are planning for 110.',
      facts: [
        { id: 'm98-fee', label: 'Site fee', value: 26800, state: 'confirmed', source: 'the proposal Maison 98 sent', asOf: '2026-08-07', category: 'pricing' },
        { id: 'm98-cap', label: 'Seated capacity', value: '120 seated', state: 'confirmed', source: 'the proposal Maison 98 sent', asOf: '2026-08-07', category: 'capability' },
        { id: 'm98-curfew', label: 'Music curfew', value: '11:00 p.m.', state: 'confirmed', source: 'the proposal Maison 98 sent', asOf: '2026-08-07', category: 'policy' },
        { id: 'm98-date', label: 'Your date', value: 'Saturday, June 12, 2027 is open', state: 'confirmed', source: 'Maison 98', asOf: '2026-08-07', category: 'availability' },
        { id: 'm98-rain', label: 'Rain plan', value: 'Ceremony moves indoors and the room seats 96', state: 'confirmed', source: 'the proposal Maison 98 sent', asOf: '2026-08-07', category: 'capability' },
        { id: 'm98-access', label: 'Accessibility', value: 'Step-free throughout, elevator to the mezzanine', state: 'confirmed', source: 'the proposal Maison 98 sent', asOf: '2026-08-07', category: 'capability' },
        /* The superseded fact. It stays in the record because the history is
           what makes the correction checkable. `actedOn` is what turns a quiet
           update into something the couple is owed an explanation for. */
        {
          id: 'm98-service-directory', label: 'Service charge', value: '18 percent',
          state: 'reported', source: 'a venue directory', asOf: '2026-08-06', category: 'pricing',
          subject: 'the service charge at Maison 98',
          actedOn: 'in the budget comparison I put in front of you',
        },
        {
          id: 'm98-service', label: 'Service charge', value: 5900, state: 'inferred',
          basis: 'three comparable places in Hudson', asOf: '2026-08-07', category: 'pricing',
          supersedes: 'm98-service-directory',
          supersededBecause: 'their proposal arrived on August 7 and does not state a service charge at all',
          remedy: 'taken that figure out of your comparison and asked Maison 98 to confirm the real one',
          bound: 'Nothing was sent to anyone and no money was committed on it.',
        },
        { id: 'm98-noise', label: 'Street noise after 10 p.m.', value: 'Two reviews mention traffic noise near the loading door', state: 'reported', source: 'guest reviews from 2025', category: 'capability' },
      ],
      hold: null,
    },
    {
      id: 'fielding-barn',
      name: 'Fielding Barn',
      location: 'Germantown, New York',
      travel: '24 minutes from Rhinecliff station',
      scene: 'barn',
      status: 'contacted',
      whyItFits: [
        'The barn is one room, so the dinner and the dancing do not have to be separated.',
        'It is the only place on your list that includes tables, chairs, and linen in the site fee.',
      ],
      realityCheck: 'They have not replied since August 6. I follow up on Thursday, August 13.',
      facts: [
        { id: 'fb-fee', label: 'Site fee', value: 22500, state: 'reported', source: 'their 2026 rate sheet', category: 'pricing' },
        { id: 'fb-cap', label: 'Seated capacity', value: '130 seated', state: 'reported', source: 'their website', category: 'capability' },
        { id: 'fb-date', label: 'Your date', value: null, state: 'unknown', category: 'availability', pending: 'I asked on August 6 and have not heard back.' },
        { id: 'fb-curfew', label: 'Music curfew', value: null, state: 'unknown', category: 'policy', pending: 'This is on the list for the follow-up.' },
      ],
      hold: null,
    },
    {
      id: 'rosendale-rooms',
      name: 'The Rosendale Rooms',
      location: 'Kingston, New York',
      travel: '31 minutes from Rhinecliff station',
      scene: 'rooms',
      status: 'suggested',
      whyItFits: [
        'Three connected rooms rather than one hall, which suits a dinner that spreads out as the evening goes.',
        'Twenty-two rooms upstairs, so your families could stay where the dinner is.',
      ],
      realityCheck: 'The largest room seats 88, so 110 guests would eat across two rooms.',
      facts: [
        { id: 'rr-fee', label: 'Site fee', value: 24000, state: 'reported', source: 'their published 2027 rates', category: 'pricing' },
        { id: 'rr-cap', label: 'Largest room', value: '88 seated', state: 'confirmed', source: 'The Rosendale Rooms', asOf: '2026-08-09', category: 'capability' },
        { id: 'rr-rooms', label: 'Guest rooms', value: '22 rooms on site', state: 'confirmed', source: 'The Rosendale Rooms', asOf: '2026-08-09', category: 'capability' },
        { id: 'rr-date', label: 'Your date', value: 'Saturday, June 12, 2027 is open', state: 'confirmed', source: 'The Rosendale Rooms', asOf: '2026-08-09', category: 'availability' },
      ],
      hold: null,
    },
    {
      id: 'ashgrove-farm',
      name: 'Ashgrove Farm',
      location: 'Millbrook, New York',
      travel: '38 minutes from Rhinecliff station',
      scene: 'farm',
      status: 'contacted',
      whyItFits: [
        'The dinner field looks west, so the light you described lands right at the start of dinner.',
        'They cap events at 120, so your wedding would be the only thing happening there that weekend.',
      ],
      realityCheck: 'It is the furthest from the station, and there is no rain plan for more than 60 people.',
      facts: [
        { id: 'af-fee', label: 'Site fee', value: null, state: 'unknown', category: 'pricing', pending: 'Their 2027 rates are not published. I asked on August 8.' },
        { id: 'af-cap', label: 'Event cap', value: '120 guests', state: 'reported', source: 'their website', category: 'capability' },
        { id: 'af-rain', label: 'Rain plan', value: 'Covered pavilion seats 60', state: 'reported', source: 'their website', category: 'capability' },
      ],
      hold: null,
    },
  ];

  /* ------------------------------------------------------------- vision */

  const vision = {
    feeling:
      'A long dinner party in a room that already feels like evening. You want people eating for hours, one loud toast, and no part of the day that feels like a performance.',
    priorities: [
      'One long seated dinner, not a buffet',
      'A room that holds 110 without feeling like a hall',
      'Music late enough that it matters',
      'Somewhere our families can walk back to where they are sleeping',
      'Good light in the early evening',
    ],
    avoiding: [
      'Anything that reads as a ballroom',
      'A receiving line',
      'A ceremony longer than twenty minutes',
      'Rented uplighting',
    ],
    practical: [
      { label: 'Date', value: 'Saturday, June 12, 2027', certainty: 'fixed' },
      { label: 'Where', value: 'Hudson Valley, New York', certainty: 'fixed' },
      { label: 'Guests', value: '110, somewhere between 105 and 118', certainty: 'flexible' },
      { label: 'Budget comfort', value: '$85,000', certainty: 'flexible' },
    ],
    questions: [
      'Is Saturday fixed, or would the Sunday work if it opened up a better room?',
      'Do you want the ceremony and the dinner in the same room?',
      'Besides you both, who is walking in the ceremony?',
    ],
    palettes: [
      {
        id: 'late-orchard',
        name: 'Late orchard',
        note: 'Warm and low, closest to the evening light you described.',
        colors: ['#DAB5A6', '#345A4A', '#D6B56F', '#F5F1EA'],
        accepted: true,
      },
      {
        id: 'hudson-stone',
        name: 'Hudson stone',
        note: 'Cooler and quieter. Better if the dinner moves indoors.',
        colors: ['#C9CFC6', '#4A5A63', '#B9A88C', '#F1EEE8'],
        accepted: false,
      },
      {
        id: 'long-table',
        name: 'Long table',
        note: 'The most saturated of the three. Reads as autumn more than June.',
        colors: ['#E4C7B4', '#7C4A38', '#CBBFA6', '#F7F2E9'],
        accepted: false,
      },
    ],
  };

  /* ------------------------------------------------------- agent activity */

  const agentWork = [
    {
      id: 'w1', icon: 'check', tone: 'done',
      text: 'I sent the five inquiries you approved on August 8. Three places have replied.',
    },
    {
      id: 'w2', icon: 'clock', tone: 'waiting',
      text: 'Fielding Barn and Ashgrove Farm have not answered. I follow up on Thursday, August 13.',
    },
    {
      id: 'w3', icon: 'clock', tone: 'waiting',
      text: 'I asked The Orchard House whether you can bring in outside catering. I expect an answer this week.',
    },
  ];

  /* Corrections are no longer written here. Masterplan 4.5 is generated from
     the fact history by V.trust.corrections(): see the superseded service
     charge on Maison 98. Nothing in this file states an apology, because an
     apology nobody can trace to a transition is just copy. */

  const thisWeek = [
    { date: '2026-08-12', text: 'Your tour brief for The Orchard House is ready for you both.' },
    { date: '2026-08-13', text: 'I follow up with Fielding Barn and Ashgrove Farm.' },
    { date: '2026-08-14', text: 'The Orchard House hold on June 12 ends at 5 p.m.', risk: true },
    { date: '2026-08-18', text: 'Tour at The Orchard House, 5:30 p.m. Confirmed.' },
  ];

  const recent = [
    { date: '2026-08-08', text: 'Five inquiries sent to the places you saved.' },
    { date: '2026-08-05', text: 'You both confirmed the vision readback.' },
    { date: '2026-08-02', text: 'Budget comfort set at $85,000.' },
  ];

  /* ----------------------------------------------------------- decision */

  const decision = {
    id: 'where',
    title: 'Where you are getting married',
    recommendation:
      'If the late music matters more than the money, The Orchard House. If the money matters more, Maison 98. Both fit the evening you described, so this is not a question I should answer for you.',
    deadline: '2026-08-14T17:00',
    deadlineNote: 'The Orchard House is holding Saturday, June 12 until Friday at 5 p.m. Letting the hold go does not rule the place out, it just means the date opens to other couples.',
    options: ['orchard-house', 'maison-98'],
    positions: [
      { partner: 'maya', prefers: 'orchard-house', note: 'The long table under the trees is the thing I keep coming back to. I would rather find the money elsewhere.' },
      { partner: 'alex', prefers: 'maison-98', note: 'I do not want to spend 7,400 dollars on a curfew. But I want to see the barn before I argue about it.' },
    ],
    openQuestion: 'You are not agreeing yet, and nothing needs to move until you do. The tour on Tuesday answers Alex\'s question. I can also ask The Orchard House to extend the hold past Friday.',
  };

  /* --------------------------------------------------------------- tour */

  const tours = [
    {
      id: 't-orchard', placeId: 'orchard-house', status: 'confirmed',
      confirmedFor: '2026-08-18T17:30',
      reason: 'To see the barn, which is the rain plan for all 140 guests.',
    },
    {
      id: 't-maison', placeId: 'maison-98', status: 'proposing',
      reason: 'To see the room at the hour your dinner would start.',
      windows: [
        { id: 'w1', date: '2026-08-20', time: '2026-08-20T17:00', note: 'Same light as your dinner' },
        { id: 'w2', date: '2026-08-20', time: '2026-08-20T18:30', note: 'Later, closer to sunset' },
        { id: 'w3', date: '2026-08-22', time: '2026-08-22T11:00', note: 'Morning, room will be empty' },
        { id: 'w4', date: '2026-08-22', time: '2026-08-22T16:00', note: 'A setup is running until 3 p.m.' },
      ],
    },
  ];

  /* --------------------------------------------------------------- plan */

  const budget = {
    comfort: 85000,
    committed: [
      { label: 'Photographer retainer', amount: 6800, state: 'confirmed', source: 'the signed agreement', asOf: '2026-07-28', category: 'contract' },
    ],
    projected: [
      { label: 'Food and drink', amount: 28600, state: 'inferred', basis: '110 guests at Hudson Valley rates', category: 'pricing' },
      { label: 'Photography, remaining', amount: 4200, state: 'confirmed', source: 'the signed agreement', asOf: '2026-07-28', category: 'contract' },
      { label: 'Flowers and the room', amount: 7400, state: 'inferred', basis: 'what you said you wanted on the tables', category: 'pricing' },
      { label: 'Music', amount: 5000, state: 'inferred', basis: 'a four-piece band and a DJ after midnight', category: 'pricing' },
    ],
    /* Committed 6,800 plus projected 45,200 is 52,000. With The Orchard House
       that reaches 86,200, which is 1,200 over the stated comfort, and with
       Maison 98 it reaches 78,800. The 7,400 difference between the two site
       fees is the figure quoted on the Planning Pulse and in the place card. */
    scenarios: [
      { placeId: 'orchard-house', siteFee: 34200, note: 'This is the one that puts you over, and only just. The service charge we have not confirmed could make it worse.' },
      { placeId: 'maison-98', siteFee: 26800, note: 'This leaves room for the service charge neither place has confirmed.' },
    ],
  };

  const timeline = [
    { date: '2026-08-12', text: 'Tour brief for The Orchard House goes to you both.', state: 'next' },
    { date: '2026-08-14', text: 'The Orchard House hold on June 12 ends at 5 p.m.', state: 'risk' },
    { date: '2026-08-18', text: 'Tour at The Orchard House, 5:30 p.m.', state: 'confirmed' },
    { date: '2026-08-20', text: 'Tour at Maison 98. Waiting on them to confirm a time.', state: 'proposed' },
    { date: '2026-09-01', text: 'Decide where you are getting married.', state: 'next' },
    { date: '2026-09-15', text: 'I bring you a photographer shortlist. You have one already, so this is a second opinion only.', state: 'later' },
    { date: '2026-10-03', text: 'Save the dates go out. This needs the place decided first.', state: 'blocked', blockedBy: 'Where you are getting married' },
  ];

  const documents = [
    { id: 'd1', name: 'Maison 98 proposal', kind: 'Proposal', date: '2026-08-07', source: 'Maison 98' },
    { id: 'd2', name: 'The Orchard House rate sheet, 2027', kind: 'Rates', date: '2026-08-04', source: 'The Orchard House' },
    { id: 'd3', name: 'Photographer agreement, signed', kind: 'Contract', date: '2026-07-28', source: 'you both' },
  ];

  /* ------------------------------------------------------------- guests */

  const guests = {
    expected: 110,
    households: 62,
    clusters: [
      { id: 'g1', label: 'Ready', count: 38, note: 'Name, address, and any meal detail we need.' },
      { id: 'g2', label: 'Address missing', count: 18, note: 'Save the dates cannot go out to these households.' },
      { id: 'g3', label: 'Travelling', count: 41, note: 'Coming from outside the Hudson Valley. Twelve have asked about rooms.' },
      { id: 'g4', label: 'Needs a detail from you', count: 6, note: 'Accessibility or meal information we should not guess at.' },
    ],
    note: 'Nobody has been invited yet. These are the households you have listed so far.',
  };

  const website = {
    published: false,
    sections: [
      { id: 's1', name: 'Welcome', ready: true },
      { id: 's2', name: 'The day', ready: true },
      { id: 's3', name: 'Travel and where to stay', ready: false, blocked: 'This needs the place decided.' },
      { id: 's4', name: 'Questions people ask', ready: true },
    ],
  };

  V.data = {
    couple, wedding, places, vision, agentWork, thisWeek, recent,
    decision, tours, budget, timeline, documents, guests, website,
    /* Every fact in the product, flattened, so the trust model can reason
       across places rather than one place at a time. */
    allFacts: function () {
      return places.reduce((all, place) => all.concat(place.facts), []);
    },
  };
})(window.VowOS);
