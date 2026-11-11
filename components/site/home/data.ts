// Copy and data for the Home page, lifted verbatim from PropAlpha-Home.dc.html (renderVals).
// Do not add numbers or claims that are not in the design file / brief section 7.

export const HERO_PROMPT = 'Show me the tower view for Arina East Residences';

// The design duplicates the list once so translateX(-50%) loops seamlessly.
const MARQUEE_ITEMS = [
  'AI Socrates', 'Tower views', 'Transaction tables', 'Flyer Maker', 'Income Valuation', 'Buyer calculator', 'Executive Condo',
  'Market Updates', 'Industrial Rents', 'Maps', 'CEA Forms 1–8', 'Tenancy tools', 'Inbox', 'Partner API',
];
export const MARQUEE = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

export type Prompt = { q: string; kind: string; src: string };
export const PROMPTS: Prompt[] = [
  { q: 'Show me the tower view for Arina East Residences', kind: 'Tower view', src: 'iPhone 02' },
  { q: 'Table of the top 5 new launch projects in D15 by units sold, with average psf', kind: 'Table', src: 'iPhone 03' },
  { q: "How's the resale PSF trending in D15?", kind: 'Chart', src: 'iPhone 07' },
  { q: 'What are industrial rents like in Ubi for a 2,000 sqft unit?', kind: 'Rent quartiles', src: 'iPhone 06' },
];

export const ANSWER_POINTS = [
  { n: '01', t: 'Tables you can copy or save as an image', d: 'Paste into a message or drop into a deck.' },
  { n: '02', t: 'Tap a unit in the tower view', d: "Its transaction history, IRR and the seller's calculator, one tap away." },
  { n: '03', t: 'Share a conversation as a branded PDF', d: 'Your name, CEA number and contact on every page.' },
  { n: '04', t: 'Speak your question, hear the answer', d: 'Voice in and read-aloud, for when you are on the move.' },
];

export const FLYER_POINTS = [
  'Pick an estate, street or condo. Live URA REALIS figures fill in.',
  'AI writes the headline, summary and taglines. All editable.',
  'Six designed themes, social sizes and a PropAlpha app flyer.',
  'Your name, CEA number, portrait, photos, WhatsApp QR and join code.',
  'Export as A4 fold-to-A5 PDF or image.',
];

export const TOOLS = [
  { n: '01', t: 'Income Valuation', d: 'Direct capitalisation, DCF, IRR, equity multiple, sensitivity tables and a PDF report.' },
  { n: '02', t: 'Buyer Calculator', d: 'Resale, New Launch and Executive Condo. BSD, ABSD, CPF, TDSR and progressive payments.' },
  { n: '03', t: 'Executive Condo loan cap', d: 'Income ceiling $16,000, or $18,000 for land sold from Sep 2026. Loan cap is the lower of TDSR 55% and MSR 30%.' },
  { n: '04', t: 'CEA Forms 1 to 8', d: 'All eight prescribed forms, with PDF export.' },
  { n: '05', t: 'Tenancy tools', d: 'Letter of Intent, Tenancy Agreement and room inventory with photos.' },
  { n: '06', t: 'Inbox and client chat', d: 'Push notifications, photo sharing and WhatsApp hand-off. Campaigns and broadcasts.' },
];

export const MARKET = [
  { t: 'Rental Yield', d: 'Monthly rental data by district.' },
  { t: 'Primary Sales', d: 'Developer sales by project and district.' },
  { t: 'Resale Market', d: '1 month to 2 years, monthly view.' },
  { t: 'Best Buy', d: 'Ranked by psf discount to district average.' },
  { t: 'Industrial Rents', d: 'URA J-SPACE quartiles by district, size band and level.' },
  { t: 'New Launch at a Glance', d: 'Which projects are moving, and where.' },
  { t: 'AI Valuation', d: "A report that carries the client's agent." },
];

export const MAP_TAGS = ['Deal Radar', 'District Portrait', 'Nearby', 'Same Street', 'Private · HDB · Landed'];

// propfolio.com.sg went live on 10 Nov 2026, so the design's "Integrating" line is replaced.
export const PROPFOLIO_LINE = 'AI project comparison enriched with PropAlpha market intelligence';
export const CLIENTS_LEFT = [
  { t: 'PropAlpha app', d: 'iPhone, iPad and Android' },
  { t: 'PropAlpha on the web', d: 'Same account, same data' },
];
export const CLIENTS_RIGHT = [
  { t: 'berllynnetta.com', d: 'Live market data by PropAlpha' },
  { t: 'propfolio.com.sg', d: PROPFOLIO_LINE },
];

export const PLATFORM_COLUMNS: { t: string; d: string; tag: 'live' | 'coming' }[] = [
  { t: 'The data and calculators as an API', d: 'Transactions, psf trends, tower grids, rental yields, valuations, buyer and EC calculations and flyer data packs, all served from one backend. Partners call it with a key issued by Luminaire Proptech.', tag: 'live' },
  { t: 'Socrates AI, embeddable', d: 'The same trained assistant that answers in the app, answering on your website in your colours, then handing the visitor back to you through your join code.', tag: 'coming' },
  { t: 'One account, everywhere', d: 'The mobile app, this web app and partner sites use the same account and the same live URA-based data.', tag: 'live' },
];

export const AGENCY_POINTS = [
  'Consistent flyers and reports across every agent.',
  'Tech Tools activated for the team by Luminaire Proptech.',
  "Join codes hand clients back to their agent. AI Valuation reports show that agent's WhatsApp and call buttons.",
];

export const TRUST = [
  { t: 'Answers from our own database', d: "Socrates answers from PropAlpha's Singapore transaction database, and says when a figure is only a snapshot." },
  { t: 'AI disclosure in the app', d: 'Every conversation carries it. Check important figures before relying on them.' },
  { t: 'Sign in with Singpass', d: 'With a PDPA consent flow. Email, Apple and Google too.' },
  { t: 'Dark and light themes', d: 'Built for iPhone and iPad.' },
  { t: 'Updates arrive automatically', d: 'Improvements land between releases.' },
  { t: 'Not advice', d: 'Information for illustration only. Not financial, investment, valuation or legal advice.' },
];

export const STEPS = [
  { n: '1', t: 'Download', d: 'App Store or Google Play.' },
  { n: '2', t: 'Sign in', d: 'Email, Apple, Google or Singpass.' },
  { n: '3', t: 'Ask Socrates or open Tech Tools', d: 'Market data and search are free for everyone.' },
  { n: '4', t: 'Agents: activate', d: 'Contact Luminaire Proptech to switch on Flyer Maker and the other agent tools.' },
];

// Links
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=sg.propalpha.app';
/** The App Store listing URL is not known yet; the badge sends people to /download until it is. */
export const APP_STORE_URL = '/download';
export const CONTACT_MAILTO = 'mailto:contact@luminaireproptech.com.sg';
export const BERLLYNNETTA_URL = 'https://www.berllynnetta.com/pavilion-park';
export const PROPFOLIO_URL = 'https://www.propfolio.com.sg';

// Join code section: how an agent's code links clients to them and what it lets the agent do.
export const JOIN_FLOW = [
  'Share the code: on a flyer QR, in a message, or read out at a viewing.',
  'The client downloads PropAlpha and enters it at sign-up, or later in their profile.',
  'They are linked to you. Broadcasts reach them; their reports and enquiries carry your contact buttons.',
];

export const JOIN_POINTS = [
  { n: '01', t: 'New listings and new launches', d: 'Broadcast a title, a message and a photo to every linked client from the app. It arrives as a push notification, so a new listing, a launch preview or a price change reaches them the moment you send it.' },
  { n: '02', t: 'Campaign codes', d: 'Create a separate code for each campaign, with an expiry date and a cap on uses. A campaign code can grant a joining client a free AI valuation or the buyer calculator, which gives them a reason to join.' },
  { n: '03', t: 'Stay in touch', d: 'Linked clients write to you in the Inbox, with photos and a WhatsApp hand-off when a chat turns into a conversation. You see unread counts and reply from your phone.' },
  { n: '04', t: 'Enquiries come back to you', d: 'When a linked client runs an AI Valuation, the report shows your WhatsApp and call buttons, not a generic contact. The same code is printed on every flyer you make.' },
];
