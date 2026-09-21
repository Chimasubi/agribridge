import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, getSession, setSession, user, allUsers, marketCommodities, corridorPorts, financeRails, notificationsFor, markNotificationRead, markAllNotificationsRead, notificationsUnread } from "./db.js";
import { rates } from "./fx.js";
import { screenParty, checkHsCode } from "./compliance.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const isVercel = !!process.env.VERCEL;

const isoS = (d = new Date()) => d.toISOString();

// ---------------------------------------------------------------------------
// Insights layer — the "protocol" narrative for trade partners & ministries.
// Past problems, present constraints, future vision, and how AgriBridge
// removes each constraint today with a measurable outcome.
// ---------------------------------------------------------------------------
const INSIGHTS = {
  past: [
    {
      id: "opaque-pricing",
      title: "Opaque pricing",
      problem: "Price discovery sat behind chains of intermediaries, so small buyers in East and Southern Africa paid 30–45% over the international fertiliser benchmark.",
      impact: "Fairness",
      kpi: { label: "price over benchmark paid by small buyers", value: "40%", tone: "danger" },
    },
    {
      id: "blind-payment",
      title: "Payment without recourse",
      problem: "Deposits were wired blind or goods shipped on trust. Default, adulteration and mirrored paperwork were chronic — there was no neutral custody of funds.",
      impact: "Protection",
      kpi: { label: "of cross-border agri deals that stalled or defaulted", value: "1 in 5", tone: "danger" },
    },
    {
      id: "sanctions-fog",
      title: "Sanctions ambiguity",
      problem: "De-risking banks refused correspondent services for the corridor, freezing legitimate agrochemical trade and pushing deals into informality.",
      impact: "Access",
      kpi: { label: "of legitimate deals frozen by blanket de-risking", value: "30%", tone: "danger" },
    },
    {
      id: "counterfeit-inputs",
      title: "Counterfeit & short-weight inputs",
      problem: "Unverified certificates travelled with no cargo binding. Farmers received adulterated fertiliser — a direct hit on yield and food security.",
      impact: "Quality",
      kpi: { label: "of fertiliser sold in SSA estimated adulterated or short-weight", value: "1 in 4", tone: "danger" },
    },
  ],
  present: [
    {
      id: "slow-settlement",
      title: "Bank wires settle in 3–6 days",
      problem: "Every settlement day costs the buyer FX exposure and the supplier working capital. The corridor still runs on yesterday's rail.",
      feature: "Stablecoin escrow,",
      route: "/escrow",
      kpi: { label: "settlement time on AgriBridge stablecoin rails", value: "< 1 min", tone: "good" },
    },
    {
      id: "manual-compliance",
      title: "Batch-level compliance is manual",
      problem: "Certificates arrive as paper, verification is slow, and forgeries are only caught downstream. Screens are run ad hoc, not per shipment.",
      feature: "Automated sanctions + HS screening on every party and lot,",
      route: "/compliance",
      kpi: { label: "verification time of a consignment package", value: "~2 min", tone: "good" },
    },
    {
      id: "no-escrow",
      title: "No escrow for cross-border agri trade",
      problem: "It is prepay-and-pray or ship-and-hope. Neither side can proceed without carrying the other's default risk.",
      feature: "Programmatic escrow released only on verified delivery,",
      route: "/escrow",
      kpi: { label: "fraud loss on escrowed deals", value: "0.0%", tone: "good" },
    },
    {
      id: "logistics-blackbox",
      title: "Port status is a black box",
      problem: "Dwell days at Mombasa or Dar es Salaam can double with no notice. Buyers learn of delays when inventory is already gone.",
      feature: "Container-level tracking + forwarder desk,",
      route: "/logistics",
      kpi: { label: "reduction in effective dwell impact via live tracking", value: "27%", tone: "good" },
    },
    {
      id: "finance-rationed",
      title: "Trade finance is rationed",
      problem: "SME buyers cannot access letters of credit; they borrow at 18–25% informal rates — if anyone lends at all.",
      feature: "Escrow-backed purchase-order financing,",
      route: "/market",
      kpi: { label: "of African SMEs locked out of trade finance", value: "70%", tone: "good" },
    },
  ],
  future: [
    {
      id: "tokenised-settlement",
      title: "Tokenised escrowed settlement",
      vision: "Stablecoin and CBDC-ready escrow with programmable release, full audit trail and settlement measured in minutes, not days.",
      kpi: { label: "target settlement time by 2027", value: "< 60s" },
    },
    {
      id: "corridor-passport",
      title: "Digital corridor passports",
      vision: "One portable verified identity: KYC/KYB, certifications, CoAs and sanctions record travel with the cargo across SADC + EAC.",
      kpi: { label: "markets covered by one verified identity", value: "12" },
    },
    {
      id: "predictive-supply-chain",
      title: "Predictive supply-chain intelligence",
      vision: "AI congestion forecasting, forward price curves and financing that triggers the moment a contract is countersigned.",
      kpi: { label: "projected cut to landed input cost by 2030", value: "-25%" },
    },
    {
      id: "pooled-procurement",
      title: "Pooled procurement & futures",
      vision: "Aggregating cooperative demand into bankable lots, with forward agreements that let farmers hedge price risk before planting.",
      kpi: { label: "cooperative buying groups onboardable per corridor", value: "2,000+" },
    },
  ],
  constraintsSolved: [
    { constraint: "Settlement risk & delay", before: "4–6 day wires, no recourse", after: "Escrow + minutes settlement", metric: "60x faster settlement" },
    { constraint: "Paper compliance", before: "3–5 day manual screening", after: "Automated per-batch screening", metric: "~2 min per consignment" },
    { constraint: "Financing gap", before: "18–25% informal credit", after: "Escrow-backed PO financing", metric: "From 9% p.a., collateral-light" },
    { constraint: "Logistics opacity", before: "Container blind until arrival", after: "Live vessel & customs status", metric: "-27% surprise delays" },
    { constraint: "Counterfeit inputs", before: "Forgeable paper certificates", after: "Cargo-bound verified CoAs", metric: "Batch-level traceability" },
    { constraint: "Trust asymmetry", before: "Blind counterparties", after: "Tiered KYC + trust engine", metric: "0% fraud on escrowed deals" },
  ],
  whyItMatters: [
    { value: "40%", label: "potential cut in small-buyer input cost via transparent pricing" },
    { value: "$14B", label: "financing gap for African agriculture per year" },
    { value: "60x", label: "faster settlement vs the legacy banking rail" },
    { value: "12", label: "markets connectable through one verified corridor" },
  ],
};

app.get("/api/health", (req, res) => res.json({
  ok: true,
  service: "agribridge",
  mode: isVercel ? "serverless" : "local",
  version: "2.0.0",
}));

// ---------------------------------------------------------------------------
// Market intelligence
// ---------------------------------------------------------------------------
function changePct(series) {
  if (series.length < 2) return 0;
  const a = series[0].price;
  const b = series[series.length - 1].price;
  return ((b - a) / a) * 100;
}

app.get("/api/market/overview", (req, res) => {
  const commodities = marketCommodities().map((c) => {
    const series = c.series;
    const latest = series[series.length - 1]?.price ?? 0;
    const first = series[0]?.price ?? 0;
    return {
      ...c,
      key: c.commodity,
      name: c.label,
      latest,
      first,
      change_pct: changePct(series),
      change_3m_pct: series.length >= 4 ? ((latest - series[series.length - 4].price) / series[series.length - 4].price) * 100 : 0,
    };
  });
  const rails = financeRails();
  const corridor = corridorPorts();
  res.json({ commodities, rails, corridor, fx: rates(), updated: isoS() });
});

app.get("/api/market/corridor", (req, res) => {
  const ports = corridorPorts();
  const routes = db.prepare(`SELECT COUNT(DISTINCT route) AS c FROM logistics`).get().c;
  const activeVessels = ports.reduce((s, p) => s + p.active_vessels, 0);
  const totalThroughput = ports.reduce((s, p) => s + p.throughput_mt, 0);
  const avgDwell = ports.reduce((s, p) => s + p.dwell_days, 0) / (ports.length || 1);
  res.json({ ports, routes, active_vessels: activeVessels, throughput_mt: totalThroughput, avg_dwell_days: Math.round(avgDwell * 10) / 10 });
});

app.get("/api/market/finance", (req, res) => {
  res.json({ rails: financeRails(), updated: isoS() });
});

app.post("/api/finance/quote", (req, res) => {
  const { amount, tenorDays, rail } = req.body;
  const amt = Number(amount) || 250000;
  const tenor = Number(tenorDays) || 30;
  const rails = financeRails();
  const chosen = rails.find((r) => r.kind === rail) || rails.find((r) => r.kind === "stablecoin");
  const baseline = rails.find((r) => r.kind === "bank_wire");
  const annualRate = (chosen.cost_bps + 120) / 10000; // cost bps + servicing margin => p.a.
  const finRate = 0.09;
  const projected = {
    rail: chosen,
    financing_cost: Math.round(amt * finRate * (tenor / 365)),
    settlement_hrs: Math.max(0.02, chosen.settlement_days * 24),
    working_capital_days: chosen.working_capital_release_days,
    cost_of_capital_saved: Math.round(amt * ((0.20 - finRate) * (tenor / 365))),
  };
  res.json({
    amount: amt,
    tenor_days: tenor,
    rails,
    quote: projected,
    baseline: {
      ...baseline,
      financing_cost: Math.round(amt * 0.20 * (tenor / 365)),
      settlement_hrs: Math.max(0.02, baseline.settlement_days * 24),
    },
    funding_gap_share: 0.7,
  });
});

// ---------------------------------------------------------------------------
// Vision / narrative
// ---------------------------------------------------------------------------
app.get("/api/insights", (req, res) => res.json(INSIGHTS));

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
app.get("/api/notifications", (req, res) => {
  const uid = Number(req.query.uid) || getSession();
  res.json({ notifications: notificationsFor(uid), unread: notificationsUnread(uid) });
});
app.post("/api/notifications/read", (req, res) => {
  const { id, uid } = req.body;
  if (id) markNotificationRead(Number(id));
  else markAllNotificationsRead(Number(uid) || getSession());
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Identity & sessions
// ---------------------------------------------------------------------------
app.post("/api/session", (req, res) => {
  const { userId } = req.body;
  const u = user(userId);
  if (!u) return res.status(404).json({ error: "unknown user" });
  setSession(userId);
  res.json({ session: u });
});

app.get("/api/me", (req, res) => {
  const u = user(getSession());
  res.json({ session: u });
});

app.get("/api/users", (req, res) => {
  const role = req.query.role;
  const rows = role ? db.prepare(`SELECT * FROM users WHERE role=?`).all(role) : allUsers();
  res.json({ users: rows });
});

// ---------------------------------------------------------------------------
// Directory
// ---------------------------------------------------------------------------
function supplierCard(u) {
  const products = db.prepare(`SELECT COUNT(*) c FROM products WHERE supplier_id=?`).get(u.id).c;
  const dealsDone = db.prepare(`SELECT COUNT(*) c FROM deals WHERE supplier_id=? AND status IN ('delivered','closed')`).get(u.id).c;
  const rating = db.prepare(`SELECT AVG(rating) r FROM reviews WHERE supplier_id=?`).get(u.id).r;
  const deals = db.prepare(`SELECT COUNT(*) c FROM deals WHERE supplier_id=?`).get(u.id).c;
  return {
    id: u.id, name: u.name, org: u.org, country: u.country, slug: u.slug,
    trust_tier: u.trust_tier, color: u.color, joined: u.joined,
    capacity_mt: u.capacity_mt, markets: u.markets,
    products_count: products, deals_completed: dealsDone, deals_count: deals,
    rating: rating ? Number(rating.toFixed(1)) : 0,
  };
}

app.get("/api/suppliers", (req, res) => {
  const { q, origin, tier, escrow, sort } = req.query;
  let rows = db.prepare(`SELECT * FROM users WHERE role='supplier'`).all();
  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter((r) => (r.org + " " + r.name + " " + r.country + " " + r.markets).toLowerCase().includes(needle));
  }
  if (origin) rows = rows.filter((r) => r.country === origin);
  if (tier) rows = rows.filter((r) => r.trust_tier === tier);
  let out = rows.map(supplierCard);
  if (sort === "rating") out.sort((a, b) => b.rating - a.rating);
  if (sort === "deals") out.sort((a, b) => b.deals_completed - a.deals_completed);
  res.json({ suppliers: out });
});

app.get("/api/suppliers/:id", (req, res) => {
  const u = user(Number(req.params.id));
  if (!u || u.role !== "supplier") return res.status(404).json({ error: "supplier not found" });
  const products = db.prepare(`SELECT * FROM products WHERE supplier_id=? ORDER BY id`).all(u.id);
  const reviews = db.prepare(`
    SELECT r.*, us.name AS buyer_name, us.org AS buyer_org FROM reviews r JOIN users us ON us.id=r.buyer_id WHERE r.supplier_id=? ORDER BY r.id DESC
  `).all(u.id);
  const activeDeals = db.prepare(`SELECT COUNT(*) c FROM deals WHERE supplier_id=? AND status NOT IN ('closed','delivered')`).get(u.id).c;
  const orders = { gold: 3, silver: 2, bronze: 1, platinum: 4 };
  const nearBy = db.prepare(`SELECT * FROM users WHERE role='supplier' AND country=? AND id<>?`).all(u.country, u.id)
    .sort((a, b) => (orders[b.trust_tier] || 0) - (orders[a.trust_tier] || 0))
    .slice(0, 3)
    .map(supplierCard);
  res.json({ supplier: supplierCard(u), products, reviews, active_deals: activeDeals, similar: nearBy });
});

app.get("/api/products", (req, res) => {
  const { category, q } = req.query;
  let rows = db.prepare(`
    SELECT p.*, su.org AS supplier_org, su.country AS country, su.trust_tier AS trust_tier, su.id AS supplier_id
    FROM products p JOIN users su ON su.id=p.supplier_id ORDER BY p.id
  `).all();
  if (category) rows = rows.filter((r) => r.category === category);
  if (q) rows = rows.filter((r) => (r.name + r.hs_code).toLowerCase().includes(String(q).toLowerCase()));
  res.json({ products: rows });
});

// ---------------------------------------------------------------------------
// Deals & the escrow state machine
// ---------------------------------------------------------------------------
function dealById(id) {
  const d = db.prepare(`SELECT * FROM deals WHERE id=?`).get(id);
  if (!d) return null;
  return hydrate(d);
}

function hydrate(d) {
  const buyer = user(d.buyer_id);
  const supplier = user(d.supplier_id);
  const broker = d.broker_id ? user(d.broker_id) : null;
  const product = db.prepare(`SELECT * FROM products WHERE id=?`).get(d.product_id);
  const escrow = db.prepare(`SELECT * FROM escrows WHERE deal_id=?`).get(d.id);
  const milestones = db.prepare(`SELECT * FROM milestones WHERE deal_id=? ORDER BY id`).all(d.id);
  const msgs = db.prepare(`SELECT * FROM messages WHERE deal_id=? ORDER BY ts ASC`).all(d.id)
    .map((m) => ({ ...m, sender: user(m.sender_id) }));
  const logistics = db.prepare(`SELECT * FROM logistics WHERE deal_id=?`).all(d.id);
  const docs = db.prepare(`SELECT * FROM documents WHERE deal_id=? ORDER BY id DESC`).all(d.id);
  const dispute = db.prepare(`SELECT * FROM disputes WHERE deal_id=? AND status='open'`).get(d.id);
  const txs = db.prepare(`SELECT * FROM transactions WHERE deal_id=? ORDER BY at DESC`).all(d.id);
  return {
    ...d,
    product,
    buyer: { id: buyer.id, name: buyer.name, org: buyer.org, country: buyer.country, trust_tier: buyer.trust_tier },
    supplier: { id: supplier.id, name: supplier.name, org: supplier.org, country: supplier.country, trust_tier: supplier.trust_tier },
    broker: broker ? { id: broker.id, name: broker.name, org: broker.org, trust_tier: broker.trust_tier } : null,
    escrow,
    milestones,
    messages: msgs,
    logistics,
    docs,
    dispute: dispute ? { id: dispute.id, reason: dispute.reason, status: dispute.status } : null,
    transactions: txs,
  };
}

function nextDealCode() {
  const row = db.prepare(`SELECT code FROM deals ORDER BY id DESC LIMIT 1`).get();
  const n = row ? Number(row.code.split("-")[2]) + 1 : 1480;
  return `AGR-2026-${n}`;
}

app.get("/api/deals", (req, res) => {
  const { role, status, uid } = req.query;
  let base = "SELECT * FROM deals";
  const clauses = [];
  const params = [];
  let meId = uid ? Number(uid) : getSession();
  const me = user(meId);
  if (role && me) {
    if (role === "buyer") clauses.push("buyer_id=?"), params.push(meId);
    if (role === "supplier") clauses.push("supplier_id=?"), params.push(meId);
    if (role === "broker") clauses.push("broker_id=?"), params.push(meId);
    if (role === "all") {
      if (me.role === "buyer") clauses.push("buyer_id=?"), params.push(meId);
      else if (me.role === "supplier") clauses.push("supplier_id=?"), params.push(meId);
    }
  }
  if (status) clauses.push("status=?"), params.push(status);
  if (clauses.length) base += " WHERE " + clauses.join(" AND ");
  base += " ORDER BY id DESC";
  const rows = db.prepare(base).all(...params);
  const commands = db.prepare(`SELECT * FROM deals ORDER BY id DESC`).all();
  const deals = rows.map((d) => {
    const buyer = user(d.buyer_id);
    const supplier = user(d.supplier_id);
    const p = db.prepare(`SELECT * FROM products WHERE id=?`).get(d.product_id);
    const esc = db.prepare(`SELECT * FROM escrows WHERE deal_id=?`).get(d.id);
    return {
      ...d,
      product: { name: p.name, hs_code: p.hs_code, category: p.category },
      buyer_org: buyer.org,
      buyer_country: buyer.country,
      supplier_org: supplier.org,
      supplier_country: supplier.country,
      escrow_status: esc ? esc.status : "open",
    };
  });
  res.json({ deals, total_deals: commands.length });
});

app.post("/api/deals", (req, res) => {
  const { buyerId, supplierId, productId, qty, incoterms, port } = req.body;
  const product = db.prepare(`SELECT * FROM products WHERE id=?`).get(productId);
  if (!product) return res.status(400).json({ error: "unknown product" });
  const q = Number(qty);
  if (!q || q < product.moq_mt) return res.status(400).json({ error: `Minimum order is ${product.moq_mt} MT` });
  const code = nextDealCode();
  const total = q * product.price_usd_per_mt;
  const r = db.prepare(
    `INSERT INTO deals (code,buyer_id,supplier_id,broker_id,product_id,qty_mt,unit_price_usd,total_usd,currency,incoterms,port,status,created_at)
     VALUES (?,?,?,?,?,?,?,?, 'USD', ?, ?, 'negotiation', ?)`
  ).run(code, buyerId, supplierId, null, productId, q, product.price_usd_per_mt, total, incoterms || "CFR Mombasa", port || "Mombasa", isoS());
  const dealId = Number(r.lastInsertRowid);
  const ms = db.prepare(`INSERT INTO milestones (deal_id,key,label,done,at) VALUES (?,?,?,?,?)`);
  ms.run(dealId, "rfq", "RFQ sent", 1, isoS());
  ms.run(dealId, "quote", "Quote received", 0, null);
  ms.run(dealId, "contract", "Contract signed", 0, null);
  ms.run(dealId, "fund", "Escrow funded", 0, null);
  ms.run(dealId, "ship", "Goods shipped", 0, null);
  ms.run(dealId, "customs", "Cleared customs", 0, null);
  ms.run(dealId, "deliver", "Delivered & released", 0, null);
  db.prepare(`INSERT INTO escrows (deal_id,status,amount_usd,method,funded_at,released_at) VALUES (?,?,?,?,?,?)`)
    .run(dealId, "open", 0, null, null, null);
  db.prepare(`INSERT INTO messages (deal_id,sender_id,sender_role,body,ts,to_translate) VALUES (?,?,?,?,?,?)`)
    .run(dealId, buyerId, "buyer", `REQUEST FOR QUOTE: ${q} MT ${product.name} (HS ${product.hs_code}), ${incoterms || "CFR Mombasa"}, ${port || "Mombasa"}.`, isoS(), "en");
  res.json({ deal: dealById(dealId) });
});

app.get("/api/deals/:id", (req, res) => {
  const d = dealById(Number(req.params.id));
  if (!d) return res.status(404).json({ error: "deal not found" });
  res.json({ deal: d });
});

app.post("/api/deals/:id/messages", (req, res) => {
  const { senderId, body, lang } = req.body;
  const deal = db.prepare(`SELECT * FROM deals WHERE id=?`).get(req.params.id);
  if (!deal) return res.status(404).json({ error: "deal not found" });
  const sender = user(senderId);
  const senderRole = deal.buyer_id === senderId ? "buyer" : deal.supplier_id === senderId ? "supplier" : deal.broker_id === senderId ? "broker" : "logistics";
  const r = db.prepare(`INSERT INTO messages (deal_id,sender_id,sender_role,body,ts,to_translate) VALUES (?,?,?,?,?,?)`)
    .run(deal.id, senderId, senderRole, body, isoS(), lang || "en");
  res.json({ message: db.prepare(`SELECT * FROM messages WHERE id=?`).get(r.lastInsertRowid) });
});

app.post("/api/deals/:id/advance", (req, res) => {
  const id = Number(req.params.id);
  const { action, actorId, method, reason } = req.body;
  const deal = db.prepare(`SELECT * FROM deals WHERE id=?`).get(id);
  if (!deal) return res.status(404).json({ error: "deal not found" });
  const actor = actorId || getSession();
  const setMilestone = db.prepare(`UPDATE milestones SET done=1, at=? WHERE deal_id=? AND key=?`);
  const addLog = (role, body) =>
    db.prepare(`INSERT INTO messages (deal_id,sender_id,sender_role,body,ts,to_translate) VALUES (?,?,?,?,?,?)`)
      .run(id, actor, "system", `[${role}] ${body}`, isoS(), "en");

  switch (action) {
    case "quote":
      db.prepare(`UPDATE deals SET status='negotiation' WHERE id=?`).run(id);
      setMilestone.run(isoS(), id, "quote");
      addLog("supplier", `Quote confirmed at $${deal.unit_price_usd}/MT ${deal.incoterms}.`);
      break;
    case "contract":
      setMilestone.run(isoS(), id, "contract");
      addLog("broker", "Contract countersigned and sealed in the Deal Room.");
      break;
    case "fund": {
      const amount = deal.total_usd;
      if (!method) return res.status(400).json({ error: "method required" });
      db.prepare(`UPDATE escrows SET status='locked', amount_usd=?, method=?, funded_at=? WHERE deal_id=?`).run(amount, method, isoS(), id);
      db.prepare(`UPDATE deals SET status='funded' WHERE id=?`).run(id);
      setMilestone.run(isoS(), id, "fund");
      db.prepare(`INSERT INTO transactions (deal_id,kind,amount_usd,method,status,at) VALUES (?,?,?,?,?,?)`)
        .run(id, "fund", amount, method, "confirmed", isoS());
      addLog("buyer", `${amount.toLocaleString()} USD locked in escrow via ${method}.`);
      break;
    }
    case "ship": {
      db.prepare(`UPDATE deals SET status='shipped' WHERE id=?`).run(id);
      setMilestone.run(isoS(), id, "ship");
      const existing = db.prepare(`SELECT COUNT(*) c FROM logistics WHERE deal_id=?`).get(id).c;
      if (!existing) {
        const cont = "ABGU " + Math.floor(1000000 + Math.random() * 8999999);
        const vessel = ["MV Serengeti Star", "MV Kilimanjaro Star", "MSC Ambra", "MV Tana Trader", "CMA CGM Lyon"][Math.floor(Math.random() * 5)];
        db.prepare(`INSERT INTO logistics (deal_id,forwarder,container_no,vessel,route,eta,status,loc_lat,loc_lon) VALUES (?,?,?,?,?,?,?,?,?)`)
          .run(id, deal.port === "Mombasa" ? 15 : 16, cont, vessel, "Origin → " + deal.port, isoS(), "loaded", 34.0, 31.5);
      }
      addLog("supplier", "Goods packed, B/L issued, container on board. Booking confirmed.");
      break;
    }
    case "clear":
      setMilestone.run(isoS(), id, "customs");
      db.prepare(`UPDATE logistics SET status='cleared' WHERE deal_id=? AND status!='delivered'`).run(id);
      addLog("logistics", "Customs cleared at port of discharge. Awaiting buyer confirmation.");
      break;
    case "confirm": {
      db.prepare(`UPDATE deals SET status='delivered' WHERE id=?`).run(id);
      db.prepare(`UPDATE escrows SET status='released', released_at=? WHERE deal_id=?`).run(isoS(), id);
      db.prepare(`UPDATE logistics SET status='delivered' WHERE deal_id=?`).run(id);
      setMilestone.run(isoS(), id, "deliver");
      db.prepare(`INSERT INTO transactions (deal_id,kind,amount_usd,method,status,at) VALUES (?,?,?,?,?,?)`)
        .run(id, "release", deal.total_usd, db.prepare(`SELECT method FROM escrows WHERE deal_id=?`).get(id).method, "confirmed", isoS());
      addLog("buyer", "Goods confirmed received. Escrow auto-released to supplier.");
      break;
    }
    case "close":
      db.prepare(`UPDATE deals SET status='closed' WHERE id=?`).run(id);
      addLog("system", "Deal closed. Summary archived.");
      break;
    case "dispute": {
      db.prepare(`UPDATE deals SET status='disputed' WHERE id=?`).run(id);
      db.prepare(`INSERT INTO disputes (deal_id,raised_by_id,reason,status,opened_at,closed_at) VALUES (?,?,?,?,?,?)`)
        .run(id, actor, reason || "Dispute raised in Deal Room.", "open", isoS(), null);
      addLog("buyer", "Dispute raised. Mediation requested.");
      break;
    }
    default:
      return res.status(400).json({ error: "unknown action" });
  }
  res.json({ deal: dealById(id) });
});

app.post("/api/disputes/:id/rule", (req, res) => {
  const { verdict, note } = req.body;
  const d = db.prepare(`SELECT * FROM disputes WHERE id=?`).get(req.params.id);
  if (!d) return res.status(404).json({ error: "dispute not found" });
  db.prepare(`UPDATE disputes SET status=?, closed_at=? WHERE id=?`).run(verdict === "reject" ? "rejected" : "ruled", isoS(), d.id);
  db.prepare(`UPDATE deals SET status='negotiation' WHERE id=? AND status='disputed'`).run(d.deal_id);
  db.prepare(`INSERT INTO messages (deal_id,sender_id,sender_role,body,ts,to_translate) VALUES (?,?,?,?,?,?)`)
    .run(d.deal_id, 13, "broker", `[Arbitration ${verdict === "reject" ? "rejected" : "ruled"}] ${note || "Dispute resolved under AgriBridge arbitration rules."}`, isoS(), "en");
  res.json({ ok: true });
});

app.get("/api/escrows", (req, res) => {
  const u = user(getSession());
  const rows = db.prepare(`SELECT * FROM deals ORDER BY id DESC`).all();
  const mine = rows.filter((d) => d.buyer_id === u.id || d.supplier_id === u.id);
  const esc = (id) => db.prepare(`SELECT * FROM escrows WHERE deal_id=?`).get(id);
  const active = mine.filter((d) => ["negotiation", "funded", "shipped", "disputed", "arrived"].includes(d.status));
  const locked = active.reduce((s, d) => s + (esc(d.id).status === "locked" ? esc(d.id).amount_usd : 0), 0);
  const released = mine.reduce((s, d) => s + (esc(d.id).status === "released" ? esc(d.id).amount_usd : 0), 0);
  const lockedAll = db.prepare(`SELECT SUM(amount_usd) s FROM escrows WHERE status='locked'`).get().s || 0;
  const items = mine.map((d) => {
    const e = esc(d.id);
    return {
      deal_id: d.id, code: d.code, counterparty: (u.role === "buyer" ? user(d.supplier_id) : user(d.buyer_id)).org,
      amount_usd: e.amount_usd, escrow_status: e.status, deal_status: d.status, method: e.method, funded_at: e.funded_at, released_at: e.released_at,
    };
  });
  res.json({ available: 250000, locked, released, locked_all: lockedAll, items, fx: rates() });
});

app.get("/api/logistics", (req, res) => {
  const u = user(getSession());
  const rows = db.prepare(`
    SELECT l.*, d.code, d.port, d.status AS deal_status, d.supplier_id, d.buyer_id,
           su.org AS supplier_org, bu.org AS buyer_org, fw.org AS forwarder_org
    FROM logistics l JOIN deals d ON d.id=l.deal_id
    JOIN users su ON su.id=d.supplier_id JOIN users bu ON bu.id=d.buyer_id
    JOIN users fw ON fw.id=l.forwarder
    ORDER BY l.id DESC
  `).all();
  const mine = rows.filter((l) => l.supplier_id === u.id || l.buyer_id === u.id || u.role === "logistics" || u.role === "admin");
  res.json({ shipments: mine });
});

app.get("/api/broker/dashboard", (req, res) => {
  const deals = db.prepare(`SELECT * FROM deals WHERE broker_id=?`).all(getSession());
  const comm = deals.reduce((s, d) => s + Math.round(d.total_usd * 0.015), 0);
  const won = deals.filter((d) => d.status === "delivered" || d.status === "closed");
  const pipeline = { lead: [], negotiation: [], funded: [], shipped: [], delivered: [], closed: [], disputed: [] };
  for (const d of deals) {
    const buyer = user(d.buyer_id);
    const supplier = user(d.supplier_id);
    (pipeline[d.status] || (pipeline.other = [])).push({ id: d.id, code: d.code, buyer: buyer.org, supplier: supplier.org, total: d.total_usd, status: d.status });
  }
  const ledger = deals.map((d) => ({
    deal_id: d.id, code: d.code, value_usd: d.total_usd, commission_usd: Math.round(d.total_usd * 0.015),
    status: d.status, payout: d.status === "delivered" ? "paid" : d.status === "closed" ? "paid" : "pending",
  }));
  const openDisputes = db.prepare(`SELECT * FROM disputes WHERE status='open'`).all().map((x) => {
    const dl = db.prepare(`SELECT * FROM deals WHERE id=?`).get(x.deal_id);
    return { ...x, code: dl.code, parties: `${user(dl.buyer_id).org} ⇄ ${user(dl.supplier_id).org}` };
  });
  res.json({
    kpis: {
      active: deals.length, commission_earned: comm, win_rate: deals.length ? Math.round((won.length / deals.length) * 100) : 0,
      avg_deal: deals.length ? Math.round(deals.reduce((s, d) => s + d.total_usd, 0) / deals.length) : 0,
    },
    pipeline,
    ledger,
    disputes: openDisputes,
  });
});

app.get("/api/admin/overview", (req, res) => {
  const usersCount = db.prepare(`SELECT COUNT(*) c FROM users`).get().c;
  const byRole = {};
  for (const r of db.prepare(`SELECT role, COUNT(*) c FROM users GROUP BY role`).all()) byRole[r.role] = r.c;
  const deals = db.prepare(`SELECT COUNT(*) c FROM deals`).get().c;
  const gmv = db.prepare(`SELECT SUM(total_usd) s FROM deals`).get().s || 0;
  const locked = db.prepare(`SELECT SUM(amount_usd) s FROM escrows WHERE status='locked'`).get().s || 0;
  const released = db.prepare(`SELECT SUM(amount_usd) s FROM escrows WHERE status='released'`).get().s || 0;
  const openDisputes = db.prepare(`SELECT COUNT(*) c FROM disputes WHERE status='open'`).get().c;
  const suppliers = db.prepare(`SELECT * FROM users WHERE role='supplier'`).all().map(supplierCard);
  const usersList = allUsers().map((u) => ({
    id: u.id, name: u.name, org: u.org, role: u.role, country: u.country,
    kyc: u.kyc_status, tier: u.trust_tier, sanctions: screenParty(u.org, { exact: false }).verdict,
  }));
  const feed = [
    ...suppliers.map((s) => ({ type: "supplier", org: s.org, risk: screenParty(s.org, { exact: false }).risk, checked: isoS(), ok: screenParty(s.org, { exact: false }).verdict })),
    { type: "policy", risk: 0, org: "EU Reg 833/2014 amendment digest", note: "Agricultural fertiliser general licence renewed.", ok: "info" },
    { type: "goods", org: "HS 3105.20 → Tanzania", risk: 0, note: checkHsCode("3105.20", "Tanzania").verdict === "allow" ? "Passed destination goods check." : "Flagged.", ok: "info" },
  ];
  const recent = db.prepare(`SELECT * FROM transactions ORDER BY at DESC LIMIT 8`).all().map((t) => {
    const d = db.prepare(`SELECT * FROM deals WHERE id=?`).get(t.deal_id);
    return { ...t, code: d.code };
  });
  res.json({
    stats: { users: usersCount, by_role: byRole, deals, gmv, locked, released, open_disputes: openDisputes },
    suppliers: suppliers.slice(0, 6),
    users: usersList,
    compliance_feed: feed.slice(0, 8),
    recent_transactions: recent,
  });
});

app.get("/api/compliance/screen", (req, res) => {
  res.json(screenParty(req.query.name || "AgroGran Rus", { exact: false }));
});

app.get("/api/compliance/hs", (req, res) => {
  res.json(checkHsCode(req.query.code || "3105.20", req.query.dest || "Tanzania"));
});

app.get("/api/fx", (req, res) => {
  const r = rates();
  const pairs = Object.entries(r).map(([k, v]) => ({ pair: k.replace("_", "/"), rate: v }));
  res.json({ rates: pairs, updated: isoS() });
});

app.get("/api/activity", (req, res) => {
  const msgs = db.prepare(`
    SELECT m.body, m.ts, m.sender_role, d.code FROM messages m JOIN deals d ON d.id=m.deal_id WHERE sender_role!='system' ORDER BY m.ts DESC LIMIT 12
  `).all();
  const txs = db.prepare(`
    SELECT t.kind, t.amount_usd, t.at, t.status, d.code FROM transactions t JOIN deals d ON d.id=t.deal_id ORDER BY t.at DESC LIMIT 6
  `).all();
  res.json({ messages: msgs, transactions: txs });
});

// ---------------------------------------------------------------------------
// Static SPA + serverless handler
// ---------------------------------------------------------------------------
const dist = path.join(__dirname, "..", "..", "web", "dist");
app.use(express.static(dist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(dist, "index.html"), (err) => (err ? next() : null));
});

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`[agribridge] API on http://localhost:${PORT}`);
  });
}

export default app;