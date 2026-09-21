import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

// Vercel functions have an ephemeral, read-only filesystem — use an in-memory
// database that re-seeds per warm invocation so the demo is always populated.
const isServerless = !!process.env.VERCEL;

if (!isServerless) mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(isServerless ? ":memory:" : path.join(dataDir, "agribridge.db"));

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  org TEXT NOT NULL,
  email TEXT,
  country TEXT NOT NULL,
  slug TEXT NOT NULL,
  kyc_status TEXT DEFAULT 'verified',
  trust_tier TEXT DEFAULT 'gold',
  sanctions TEXT DEFAULT 'clear',
  color TEXT DEFAULT '#0B6E4F',
  capacity_mt INTEGER DEFAULT 0,
  markets TEXT DEFAULT '',
  joined TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  hs_code TEXT NOT NULL,
  category TEXT NOT NULL,
  moq_mt INTEGER NOT NULL,
  price_usd_per_mt INTEGER NOT NULL,
  origin TEXT NOT NULL,
  certifications TEXT NOT NULL,
  in_stock_mt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES users(id),
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  supplier_id INTEGER NOT NULL REFERENCES users(id),
  broker_id INTEGER REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty_mt INTEGER NOT NULL,
  unit_price_usd INTEGER NOT NULL,
  total_usd INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  incoterms TEXT NOT NULL,
  port TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS escrows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  status TEXT NOT NULL,
  amount_usd INTEGER NOT NULL,
  method TEXT,
  funded_at TEXT,
  released_at TEXT
);

CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  ts TEXT NOT NULL,
  to_translate TEXT DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS logistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  forwarder TEXT NOT NULL,
  container_no TEXT NOT NULL,
  vessel TEXT NOT NULL,
  route TEXT NOT NULL,
  eta TEXT NOT NULL,
  status TEXT NOT NULL,
  loc_lat REAL NOT NULL,
  loc_lon REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  verified INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  raised_by_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  kind TEXT NOT NULL,
  amount_usd INTEGER NOT NULL,
  method TEXT,
  status TEXT NOT NULL,
  at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS market_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commodity TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  t INTEGER NOT NULL,
  price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS corridor_ports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  port TEXT NOT NULL,
  country TEXT NOT NULL,
  throughput_mt INTEGER NOT NULL,
  dwell_days REAL NOT NULL,
  congestion INTEGER NOT NULL,
  cost_per_ctr INTEGER NOT NULL,
  active_vessels INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS trade_finance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  settlement_days REAL NOT NULL,
  cost_bps INTEGER NOT NULL,
  working_capital_release_days INTEGER NOT NULL,
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  ts TEXT NOT NULL,
  read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS jackpot (id INTEGER PRIMARY KEY, val TEXT NOT NULL);
`);

const bump = db.prepare(
  `INSERT INTO jackpot (id,val) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET val=excluded.val`
);

const alreadySeeded = db.prepare(`SELECT COUNT(*) AS c FROM users`).get().c > 0;

function now(offsetDays = 0, hhmm = "10:00") {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

if (!alreadySeeded) {

const u = (role, name, org, country, slug, email, trust, color, capacity, markets) => ({
  role, name, org, country, slug, email, trust, color, capacity, markets,
});

const USERS = [
  u("buyer", "Amara Kwamboka", "Greenfield Agros Ltd", "Kenya", "greenfield-agros", "amara@greenfield.co.ke", "gold", "#0B6E4F", 0, ""),
  u("buyer", "Juma Mwinyi", "Kilimo Sasa Ltd", "Tanzania", "kilimo-sasa", "juma@kilimosasa.tz", "gold", "#0B6E4F", 0, ""),
  u("buyer", "Grace Banda", "Banda Farmers Cooperative", "Malawi", "banda-coop", "grace@bandacoop.mw", "silver", "#0B6E4F", 0, ""),
  u("buyer", "Patrick Mugisha", "Rwanda Agro Supply", "Rwanda", "rwanda-agro", "patrick@rwandaagro.rw", "gold", "#0B6E4F", 0, ""),
  u("buyer", "Naledi Phiri", "Valley Distributors", "Zambia", "valley-distributors", "naledi@valley.zm", "silver", "#0B6E4F", 0, ""),
  u("buyer", "Sarah Atim", "Northern Growers Co-op", "Uganda", "northern-growers", "sarah@northerngrowers.ug", "bronze", "#0B6E4F", 0, ""),
  u("supplier", "Dmitri Volkov", "AgroGran Rus", "Russia", "agrogran-rus", "d.volkov@agrogran.ru", "gold", "#D97706", 240000, "KE, TZ, MW, ZM, RW, UG"),
  u("supplier", "Elena Sokolova", "UralChem Agro", "Russia", "uralchem-agro", "e.sokolova@uralchem.ru", "gold", "#7C3AED", 310000, "KE, TZ, ZM, RW"),
  u("supplier", "Franz Weber", "NordAgrar GmbH", "Germany", "nordagrar", "weber@nordagrar.de", "gold", "#1D4ED8", 180000, "MW, ZM, RW"),
  u("supplier", "Oleg Petrov", "Moscow Fertilisers JSC", "Russia", "moscow-fertilisers", "o.petrov@mosfert.ru", "silver", "#DC2626", 140000, "KE, UG"),
  u("supplier", "Hans Dekker", "AgroTrade NL B.V.", "Netherlands", "agrotrade-nl", "hans@agrotrade.nl", "gold", "#2563EB", 95000, "KE, TZ, MW, UG"),
  u("supplier", "Igor Malyukov", "BlackSea CropScience", "Russia", "blacksea-cropscience", "i.malyukov@bcs.ru", "silver", "#0284C7", 60000, "TZ, KE"),
  u("broker", "Peter Ochieng", "Ochieng Trade Advisory", "Kenya", "ochieng-trade", "peter@ochiengtrade.co.ke", "gold", "#F2A900", 0, ""),
  u("broker", "Aisha Hassan", "Hassan Brokerage & Co.", "Tanzania", "hassan-brokerage", "aisha@hassanbrokerage.tz", "silver", "#F2A900", 0, ""),
  u("logistics", "Sarah Mwangi", "Sawa Freight & Clearing", "Kenya", "sawa-freight", "ops@sawafreight.co.ke", "gold", "#0891B2", 0, ""),
  u("logistics", "David Temu", "Dar Cargo Solutions", "Tanzania", "dar-cargo", "control@darcargo.tz", "gold", "#0891B2", 0, ""),
  u("admin", "System Admin", "AgriBridge Ops", "Tanzania", "agribridge-ops", "ops@agribridge.africa", "gold", "#1F2937", 0, ""),
];

for (const [i, x] of USERS.entries()) {
  db.prepare(
    `INSERT INTO users (role,name,org,country,slug,email,kyc_status,trust_tier,sanctions,color,capacity_mt,markets,joined)
     VALUES (?,?,?,?,?,?, 'verified', ?, 'clear', ?, ?, ?, ?)`
  ).run(x.role, x.name, x.org, x.country, x.slug, x.email, x.trust, x.color, x.capacity, x.markets, now(-90 - i * 12));
}

const PRODUCTS = [
  [7, "NPK 20-10-10+6S Compound Fertiliser", "3105.20", "Fertilizer", 250, 520, "Russia", "GOST 324.3-13, CoA, Phytosanitary", 4200],
  [7, "Granular Urea 46% N", "3102.10", "Fertilizer", 500, 345, "Russia", "GOST 2081-2010, CoA", 8000],
  [8, "Granular Urea 46% N", "3102.10", "Fertilizer", 500, 360, "Russia", "GOST 2081-2010, CoA", 6500],
  [8, "Ammonium Sulphate 21% N", "3102.21", "Fertilizer", 250, 190, "Russia", "CoA, MSDS", 5000],
  [8, "Potassium Chloride (MOP) 60%", "3104.20", "Fertilizer", 500, 285, "Russia", "GOST 4568-95, CoA", 3500],
  [9, "DAP 18-46-0", "3105.30", "Fertilizer", 500, 610, "Germany", "EU CE CoA, Phytosanitary", 2200],
  [9, "Blended NPK 25-5-5+Zn", "3105.20", "Fertilizer", 250, 490, "Germany", "EU CE CoA", 1800],
  [10, "Calcium Ammonium Nitrate 27% N", "3102.60", "Fertilizer", 500, 310, "Russia", "GOST 26460-85, CoA", 4700],
  [10, "Maize Seeds (hybrid, coated)", "1005.10", "Seeds", 50, 1450, "Russia", "Phytosanitary, ISTA cert", 900],
  [11, "Glyphosate 48% SL Herbicide", "3808.93", "Agro-Chemicals", 25, 165, "Netherlands", "EU REACH, MSDS", 2400],
  [11, "Chlorpyrifos 48% EC Insecticide", "3808.91", "Agro-Chemicals", 25, 280, "Netherlands", "EU REACH, MSDS", 1200],
  [12, "2,4-D Amine Salt 60% SL", "3808.93", "Agro-Chemicals", 25, 95, "Russia", "CoA, MSDS", 3000],
  [12, "High-Clearance Crop Sprayer", "8432.40", "Machinery", 5, 32000, "Russia", "EAC Conformity", 40],
];

for (const [i, p] of PRODUCTS.entries()) {
  db.prepare(
    `INSERT INTO products (supplier_id,name,hs_code,category,moq_mt,price_usd_per_mt,origin,certifications,in_stock_mt)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8]);
}

const REVIEWS = [
  [7, 4, 5, "Delivered 500 MT NPK on schedule. Documents were clean, CoA matched every batch certificate."],
  [7, 2, 4, "Reliable supplier but response time during Moscow working hours only. Quality was excellent."],
  [8, 4, 5, "Urea granule size was consistent, no caking. ARRIG arbitration clause gave us confidence."],
  [8, 1, 4, "Second order in a row. Pricing is competitive versus Gulf suppliers."],
  [9, 3, 5, "DAP arrived via Beira with clean phytosanitary paperwork. Broker support was first-class."],
  [9, 5, 4, "NordAgrar met EU origin requirements our buyer insisted on. Slight premium but worth it."],
  [10, 3, 4, "CAN delivered to Mombasa. Maize seeds germinated at 96% in our trials."],
  [11, 1, 5, "Glyphosate drummed and palletized neatly. Escrow release was instant after port confirmation."],
  [12, 2, 3, "Sprayer works but spare parts took longer than promised."],
];

for (const [i, r] of REVIEWS.entries()) {
  db.prepare(
    `INSERT INTO reviews (supplier_id,buyer_id,rating,text) VALUES (?,?,?,?)`
  ).run(r[0], r[1], r[2], r[3]);
}

const dealStmt = db.prepare(
  `INSERT INTO deals (code,buyer_id,supplier_id,broker_id,product_id,qty_mt,unit_price_usd,total_usd,currency,incoterms,port,status,created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
);
const escStmt = db.prepare(
  `INSERT INTO escrows (deal_id,status,amount_usd,method,funded_at,released_at) VALUES (?,?,?,?,?,?)`
);
const msStmt = db.prepare(
  `INSERT INTO milestones (deal_id,key,label,done,at) VALUES (?,?,?,?,?)`
);
const logStmt = db.prepare(
  `INSERT INTO logistics (deal_id,forwarder,container_no,vessel,route,eta,status,loc_lat,loc_lon) VALUES (?,?,?,?,?,?,?,?,?)`
);
const docStmt = db.prepare(
  `INSERT INTO documents (deal_id,name,kind,uploaded_at,verified) VALUES (?,?,?,?,?)`
);
const txStmt = db.prepare(
  `INSERT INTO transactions (deal_id,kind,amount_usd,method,status,at) VALUES (?,?,?,?,?,?)`
);
const msgStmt = db.prepare(
  `INSERT INTO messages (deal_id,sender_id,sender_role,body,ts,to_translate) VALUES (?,?,?,?,?,?)`
);

function milestones(dealId, keys) {
  msStmt.run(dealId, "rfq", "RFQ sent", keys.rfq ? 1 : 0, keys.rfq ? now(-30) : null);
  msStmt.run(dealId, "quote", "Quote received", keys.quote ? 1 : 0, keys.quote ? now(-25) : null);
  msStmt.run(dealId, "contract", "Contract signed", keys.contract ? 1 : 0, keys.contract ? now(-20) : null);
  msStmt.run(dealId, "fund", "Escrow funded", keys.fund ? 1 : 0, keys.fund ? now(-16) : null);
  msStmt.run(dealId, "ship", "Goods shipped", keys.ship ? 1 : 0, keys.ship ? now(-10) : null);
  msStmt.run(dealId, "customs", "Cleared customs", keys.customs ? 1 : 0, keys.customs ? now(-3) : null);
  msStmt.run(dealId, "deliver", "Delivered & released", keys.deliver ? 1 : 0, keys.deliver ? now(-1) : null);
}

const DEALS = [
  {
    code: "AGR-2026-0147", buyer: 1, supplier: 7, broker: 13, product: 1, qty: 500, price: 520,
    incoterms: "CFR Mombasa", port: "Mombasa", status: "negotiation", days: 8,
    esc: { status: "open", method: null },
    ms: { rfq: true, quote: true },
    msgs: [
      [7, "supplier", "Good morning Amara. Confirming we can hold 500 MT NPK 20-10-10 available at $520/MT CFR Mombasa."],
      [1, "buyer", "Received. Can you confirm Russian certificate of origin is included in that price?"],
      [7, "supplier", "Yes — certificates of origin and CoA included, Fumigation at origin also covered."],
      [13, "broker", "Broker note: allow 5 days at Mombasa for KEPHIS documentation. Adding demo milestones."],
    ],
  },
  {
    code: "AGR-2026-0148", buyer: 2, supplier: 8, broker: 14, product: 3, qty: 1000, price: 360,
    incoterms: "CFR Dar es Salaam", port: "Dar es Salaam", status: "funded", days: 40,
    esc: { status: "locked", method: "Stablecoin (USDT)" },
    ms: { rfq: true, quote: true, contract: true, fund: true },
    logistics: {
      forwarder: 16, container: "TRLU 7823451", vessel: "MV Kilimanjaro Star", route: "Novorossiysk → Dar es Salaam",
      etaDays: 24, lat: 10.5, lon: 51.0, status: "loaded",
    },
    msgs: [
      [2, "buyer", "REQUEST FOR QUOTE: 1,000 MT Urea 46% for Dar es Salaam delivery, Q2 window."],
      [8, "supplier", "Quoted $360/MT CFR Dar. Payment via escrow with stablecoin rails locks the price for 45 days."],
      [14, "broker", "Both parties verified. Confirming terms — recommended release on port weight certificates."],
      [8, "supplier", "Contract countersigned. Awaiting funds in AgriBridge escrow."],
    ],
  },
  {
    code: "AGR-2026-0149", buyer: 3, supplier: 9, broker: 13, product: 6, qty: 300, price: 610,
    incoterms: "CIF Beira", port: "Beira", status: "shipped", days: 12,
    esc: { status: "locked", method: "Bank wire" },
    ms: { rfq: true, quote: true, contract: true, fund: true, ship: true },
    logistics: {
      forwarder: 15, container: "MSKU 9103422", vessel: "MSC Ambra", route: "Hamburg → Beira",
      etaDays: 7, lat: -24.9, lon: 42.3, status: "in_transit",
    },
    msgs: [
      [3, "buyer", "We represent 1,200 smallholder farmers. Need DAP with EU origin certificates for Malawi."],
      [9, "supplier", "Happy to support. EU input subsidy programmes require EU origin — we can supply that."],
      [3, "buyer", "Funds transferred to escrow today. Please proceed with booking."],
      [15, "logistics", "Container MSKU9103422 loaded on MSC Ambra at Hamburg. Attaching B/L pack."],
    ],
  },
  {
    code: "AGR-2026-0150", buyer: 4, supplier: 10, broker: 13, product: 8, qty: 400, price: 310,
    incoterms: "CFR Mombasa", port: "Mombasa", status: "delivered", days: 5,
    esc: { status: "released", method: "Bank wire", funded: now(-45), released: now(-2) },
    ms: { rfq: true, quote: true, contract: true, fund: true, ship: true, customs: true, deliver: true },
    logistics: {
      forwarder: 15, container: "HMMU 5512098", vessel: "MV Tana Trader", route: "Novorossiysk → Mombasa",
      etaDays: -2, lat: -4.1, lon: 39.7, status: "delivered",
    },
    msgs: [
      [4, "buyer", "Need CAN 27% for our coffee cooperative network this season. 400 MT."],
      [10, "supplier", "Confirmed $310/MT. Routing via Mombasa with Sawa Freight as clearing agent."],
      [4, "buyer", "Escrow released — received at KCC store. Cheers to the first fully digital deal!"],
    ],
  },
  {
    code: "AGR-2026-0151", buyer: 6, supplier: 11, broker: 13, product: 10, qty: 50, price: 165,
    incoterms: "FOB Rotterdam", port: "Mombasa", status: "disputed", days: 6,
    esc: { status: "locked", method: "Stablecoin (USDC)" },
    ms: { rfq: true, quote: true, contract: true, fund: true, ship: true },
    logistics: {
      forwarder: 16, container: "CMAU 0187766", vessel: "CMA CGM Lyon", route: "Rotterdam → Mombasa",
      etaDays: 5, lat: 21.3, lon: -17.0, status: "in_transit",
    },
    msgs: [
      [6, "buyer", "MSDS says the Glyphosate is 48% — but batch CoA shows 45.8%. Flagging discrepancy."],
      [11, "supplier", "Within ISO tolerance (±2%). Offering a $0.40/MT credit to resolve quickly."],
      [6, "buyer", "Not acceptable. Raising a dispute and requesting broker mediation."],
    ],
  },
  {
    code: "AGR-2026-0152", buyer: 5, supplier: 11, product: 11, qty: 100, price: 280,
    incoterms: "CFR Dar es Salaam", port: "Dar es Salaam", status: "draft", days: 1,
    esc: { status: "open", method: null },
    ms: { rfq: true },
    msgs: [
      [5, "buyer", "RFQ: Chlorpyrifos 48% EC, 100 MT, delivery Dar es Salaam within 60 days."],
    ],
  },
];

for (const d of DEALS) {
  const created = now(-d.days);
  const r = dealStmt.run(d.code, d.buyer, d.supplier, d.broker ?? null, d.product, d.qty, d.price, d.qty * d.price, "USD", d.incoterms, d.port, d.status, created);
  const dealId = r.lastInsertRowid;
  milestones(dealId, d.ms);

  if (d.esc.status === "locked") {
    escStmt.run(dealId, "locked", d.qty * d.price, d.esc.method, now(-15), null);
    txStmt.run(dealId, "fund", d.qty * d.price, d.esc.method, "confirmed", now(-15));
  } else if (d.esc.status === "released") {
    escStmt.run(dealId, "released", d.qty * d.price, d.esc.method, d.esc.funded, d.esc.released);
    txStmt.run(dealId, "fund", d.qty * d.price, d.esc.method, "confirmed", d.esc.funded);
    txStmt.run(dealId, "release", d.qty * d.price, d.esc.method, "confirmed", d.esc.released);
  } else {
    escStmt.run(dealId, "open", 0, null, null, null);
  }

  if (d.logistics) {
    const l = d.logistics;
    logStmt.run(dealId, l.forwarder, l.container, l.vessel, l.route, now(l.etaDays), l.status, l.lat, l.lon);
  }

  const docs = [
    ["Certificate of Analysis", "CoA", "verified"],
    ["Material Safety Data Sheet", "MSDS", "verified"],
    ["Commercial Invoice", "Invoice", d.esc.status === "open" ? "draft" : "verified"],
  ];
  if (d.ms.ship) {
    docs.push(["Bill of Lading", "B/L", "verified"], ["Packing List", "Packing List", "verified"], ["Certificate of Origin", "Origin", "verified"]);
  }
  for (const [i, dc] of docs.entries()) {
    docStmt.run(dealId, dc[0], dc[1], now(-d.days + i), dc[2] === "verified" ? 1 : 0);
  }

  for (const [i, m] of d.msgs.entries()) {
    msgStmt.run(dealId, m[0], m[1], m[2], now(-d.days + i, "09:" + String(10 + i * 5)), m[1] === "buyer" ? "sw" : "en");
  }
}

const dispute = db.prepare(
  `INSERT INTO disputes (deal_id,raised_by_id,reason,status,opened_at,closed_at) VALUES (?,?,?,?,?,?)`
);
const dealIdByCode = db.prepare(`SELECT id FROM deals WHERE code=?`);
dispute.run(dealIdByCode.get("AGR-2026-0151").id, 6, "Certificate of Analysis discrepancy: assay 45.8% vs labelled 48%. Buyer requests mediation and credit.", "open", now(-4), null);
dispute.run(dealIdByCode.get("AGR-2026-0150").id, 4, "2 bags damaged at discharge — resolved with $180 credit.", "closed", now(-20), now(-18));

}

// ---------------------------------------------------------------------------
// Deterministic (seeded) pseudo-random generator so every boot produces the
// same market series — predictable and demo-safe.
// ---------------------------------------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function series(seed, start, drift, vol) {
  const rand = mulberry32(seed);
  let v = start;
  const points = [];
  for (let t = -23; t <= 0; t++) {
    const wave = Math.sin(t / 2.1 + seed) * vol * 0.45;
    const noise = (rand() - 0.5) * vol;
    v = Math.max(10, v + drift + wave + noise);
    points.push({ t, price: Math.round(v * 10) / 10 });
  }
  return points;
}

const COMMODITIES = [
  { commodity: "urea", label: "Granular Urea 46% N", unit: "USD / MT", category: "Fertilizer", seed: 3, start: 298, drift: 2.1, vol: 9 },
  { commodity: "npk", label: "NPK 20-10-10 + 6S", unit: "USD / MT", category: "Fertilizer", seed: 7, start: 505, drift: 0.7, vol: 8 },
  { commodity: "dap", label: "DAP 18-46-0", unit: "USD / MT", category: "Fertilizer", seed: 11, start: 640, drift: -1.3, vol: 10 },
  { commodity: "mop", label: "Potash MOP 60%", unit: "USD / MT", category: "Fertilizer", seed: 13, start: 265, drift: 0.9, vol: 6 },
  { commodity: "can", label: "CAN 27% N", unit: "USD / MT", category: "Fertilizer", seed: 17, start: 296, drift: 0.6, vol: 7 },
  { commodity: "glyphosate", label: "Glyphosate 48% SL", unit: "USD / MT", category: "Agro-Chemicals", seed: 19, start: 182, drift: -0.7, vol: 6 },
  { commodity: "freight", label: "Corridor freight (container)", unit: "USD / container", category: "Logistics", seed: 23, start: 2100, drift: 90, vol: 90 },
];

const insMarket = db.prepare(`INSERT INTO market_series (commodity,label,unit,category,t,price) VALUES (?,?,?,?,?,?)`);
const marketCount = db.prepare(`SELECT COUNT(*) AS c FROM market_series`).get().c;
if (marketCount === 0) {
  for (const c of COMMODITIES) {
    for (const p of series(c.seed, c.start, c.drift, c.vol)) {
      insMarket.run(c.commodity, c.label, c.unit, c.category, p.t, p.price);
    }
  }
}

const insPort = db.prepare(
  `INSERT INTO corridor_ports (port,country,throughput_mt,dwell_days,congestion,cost_per_ctr,active_vessels) VALUES (?,?,?,?,?,?,?)`
);
const portCount = db.prepare(`SELECT COUNT(*) AS c FROM corridor_ports`).get().c;
const PORTS = [
  { port: "Mombasa", country: "Kenya", throughput_mt: 34200, dwell_days: 4.5, congestion: 38, cost_per_ctr: 920, active_vessels: 14 },
  { port: "Dar es Salaam", country: "Tanzania", throughput_mt: 29800, dwell_days: 5.2, congestion: 46, cost_per_ctr: 850, active_vessels: 11 },
  { port: "Beira", country: "Mozambique", throughput_mt: 17300, dwell_days: 4.1, congestion: 29, cost_per_ctr: 780, active_vessels: 7 },
  { port: "Novorossiysk", country: "Russia", throughput_mt: 52100, dwell_days: 2.6, congestion: 22, cost_per_ctr: 640, active_vessels: 19 },
  { port: "Rotterdam", country: "Netherlands", throughput_mt: 44800, dwell_days: 1.9, congestion: 18, cost_per_ctr: 720, active_vessels: 23 },
];
if (portCount === 0) {
  for (const p of PORTS) insPort.run(p.port, p.country, p.throughput_mt, p.dwell_days, p.congestion, p.cost_per_ctr, p.active_vessels);
}

const insFin = db.prepare(
  `INSERT INTO trade_finance (kind,label,settlement_days,cost_bps,working_capital_release_days,notes) VALUES (?,?,?,?,?,?)`
);
const finCount = db.prepare(`SELECT COUNT(*) AS c FROM trade_finance`).get().c;
const FINANCE_RAILS = [
  ["bank_wire", "Bank wire (SWIFT)", 4.2, 115, 35, "Legacy default: FX haircut + correspondent fees."],
  ["stablecoin", "Stablecoin escrow (USDT/USDC)", 0.02, 18, 0, "Minutes not days. Programmable release on verified delivery."],
  ["mobile_money", "Mobile money", 0.1, 45, 2, "Widens participation; capped at $5k per tranche."],
  ["letter_of_credit", "Letter of credit (LC)", 8.0, 190, 45, "Bank-guaranteed, doc-heavy, best for very large lots."],
  ["supplier_credit", "Supplier credit (deferred)", 0, 0, 30, "Escrow-backed deferred payment unlocks working capital."],
  ["trade_finance", "AgriBridge trade finance", 0.5, 240, 0, "Purchase-order financing at 9% p.a. vs 16–25% informal."],
];
if (finCount === 0) {
  for (const f of FINANCE_RAILS) insFin.run(f[0], f[1], f[2], f[3], f[4], f[5]);
}

const insNotif = db.prepare(
  `INSERT INTO notifications (user_id,kind,title,body,ts,read) VALUES (?,?,?,?,?,?)`
);
const notifCount = db.prepare(`SELECT COUNT(*) AS c FROM notifications`).get().c;
if (notifCount === 0) {
  const n = [
    [1, "deal", "Quote awaiting your decision", "AgroGran Rus confirmed NPK 20-10-10 at $520/MT — fund the escrow to lock the contract.", 1],
    [1, "escrow", "Escrow funds secured", "Your deal 0147 escrow wallet is ready. Funds release only on verified delivery.", 0],
    [1, "compliance", "Goods screening passed", "HS 3105.20 → Kenya cleared under general licence. Batch certificates attached.", 1],
    [14, "deal", "New funded deal on your desk", "AGR-2026-0148 is funded — Yanga, proceed to booking. Commission projected.", 0],
    [7, "compliance", "Re-screen scheduled", "Scheduled re-screen of AgroGran Rus in 21 days per policy. No flags today.", 0],
  ];
  for (const [uid, kind, title, body, read] of n) {
    insNotif.run(uid, kind, title, body, now(-(1 + Math.floor(Math.random() * 4)), "09:3" + (uid % 9)), read);
  }
}

if (!db.prepare(`SELECT val FROM jackpot WHERE id=1`).get()) {
  bump.run(JSON.stringify({ sessionUser: 14 }));
}

export function getSession() {
  return JSON.parse(db.prepare(`SELECT val FROM jackpot WHERE id=1`).get().val).sessionUser;
}
export function setSession(id) {
  bump.run(JSON.stringify({ sessionUser: id }));
}
export function user(id) {
  return db.prepare(`SELECT * FROM users WHERE id=?`).get(id);
}
export function allUsers() {
  return db.prepare(`SELECT * FROM users ORDER BY id`).all();
}

export function marketSeries(commodity) {
  return db.prepare(`SELECT t, price FROM market_series WHERE commodity=? ORDER BY t ASC`).all(commodity);
}
export function marketCommodities() {
  const rows = db.prepare(`SELECT DISTINCT commodity, label, unit, category FROM market_series ORDER BY id`).all();
  return rows.map((c) => ({ ...c, series: marketSeries(c.commodity) }));
}
export function corridorPorts() {
  return db.prepare(`SELECT * FROM corridor_ports ORDER BY throughput_mt DESC`).all();
}
export function financeRails() {
  return db.prepare(`SELECT * FROM trade_finance ORDER BY settlement_days ASC`).all();
}
export function notificationsFor(userId) {
  return db.prepare(`SELECT * FROM notifications WHERE user_id=? ORDER BY ts DESC LIMIT 12`).all(userId);
}
export function markNotificationRead(id) {
  db.prepare(`UPDATE notifications SET read=1 WHERE id=?`).run(id);
}
export function markAllNotificationsRead(userId) {
  db.prepare(`UPDATE notifications SET read=1 WHERE user_id=?`).run(userId);
}
export const notificationsUnread = (userId) =>
  db.prepare(`SELECT COUNT(*) AS c FROM notifications WHERE user_id=? AND read=0`).get(userId).c;