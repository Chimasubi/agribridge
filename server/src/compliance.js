const SANCTIONED = [
  { name: "Global Trade Partners FZE", type: "entity", lists: ["OFAC SDN"], risk: 100 },
  { name: "Viktor Selim", type: "individual", lists: ["EU Consolidated", "UK OFSI"], risk: 100 },
  { name: "Volkhov Technoimport", type: "entity", lists: ["OFAC SDN", "EU Consolidated"], risk: 100 },
  { name: "Asia Bank for Trade", type: "entity", lists: ["OFAC SSI"], risk: 80 },
  { name: "Northern Sea Logistics OOO", type: "entity", lists: ["UK OFSI"], risk: 90 },
  { name: "Stepan Grachev", type: "individual", lists: ["UN Security Council"], risk: 100 },
  { name: "Dubai Metals Intermediary", type: "entity", lists: ["EU Consolidated"], risk: 100 },
  { name: "Tamir Borzev", type: "individual", lists: ["OFAC SDN", "UN"], risk: 100 },
];

const DUPLICATE_LIKE = ["agrogran", "uralchem", "nordagrar", "mosfert", "greenfield agros", "kilimo sasa"];

function tokenize(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s\-']/gi, " ").split(/\s+/).filter(Boolean);
}

export function screenParty(name, { exact = true } = {}) {
  const tokens = tokenize(name);
  const bigrams = new Set();
  for (const t of tokens) {
    for (let i = 0; i < t.length - 1; i++) bigrams.add(t.slice(i, i + 2));
  }
  const results = [];
  for (const s of SANCTIONED) {
    const stok = tokenize(s.name);
    const sset = new Set(stok);
    const overlap = stok.filter((t) => tokens.includes(t)).length;
    const score = exact ? (overlap / stok.length) * 100 : (overlap / stok.length) * 70;
    results.push({ entry: s, score: Math.round(score) });
  }
  const sorted = results.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  const top = sorted[0];
  if (!top) {
    const like = DUPLICATE_LIKE.map((d) => tokenize(d)).filter((d) => d.some((t) => tokens.includes(t)) && !exact).length;
    return {
      name,
      verdict: "clear",
      risk: 0,
      matched: null,
      note: like > 0 ? "No exact match. Soft duplicate flagged — verify corporate group." : "No match against mock EU/US/UK/UN lists.",
    };
  }
  const verdict = top.score >= 60 ? "block" : top.score >= 25 ? "review" : "clear";
  const notes = {
    block: "Automatic block: exact match on a sanctions list.",
    review: "Similar name found. Manual review required before onboarding.",
    clear: "Low similarity — no action needed.",
  };
  return {
    name,
    verdict,
    risk: top.score >= 60 ? 100 : top.score >= 25 ? 55 : 10,
    matched: { name: top.entry.name, score: top.score, lists: top.entry.lists },
    note: notes[verdict],
  };
}

const BLOCKED_DESTINATIONS = ["Iran", "North Korea", "Syria", "Sudan", "Venezuela"];
const BLOCKED_HS_PREFIXES = ["9305", "9306", "8710", "2811.12", "2920.11", "2903.24", "2834.29", "9301", "9302", "9303", "9304"];
const DUAL_USE_RANGES = [
  { from: 9301, to: 9307, label: "Weapons & ammunition (strengthened dual-use)" },
  { from: 8710, to: 8710, label: "Military tanks/armoured vehicles" },
  { from: 2811, to: 2811.99, label: "Inorganic chemicals — some salts dual-use" },
  { from: 2920, to: 2920.99, label: "Esters of phosphoric acids (precursors)" },
];

const AGRO_HS = {
  "3102": "Nitrogenous fertilizers",
  "3103": "Phosphate fertilizers",
  "3104": "Potassic fertilizers",
  "3105": "Mineral/chemical fertilizer blends",
  "3808": "Herbicides / insecticides / fungicides",
  "1005": "Maize (corn) — seed for sowing",
  "8432": "Agricultural machinery (soil prep/planting)",
  "8710": "Military vehicles",
  "9306": "Ammunition",
};

export function checkHsCode(code, destination) {
  const clean = String(code).trim();
  const prefix = clean.split(".")[0].padEnd(4, "0");
  const exactPrefixMatch = BLOCKED_HS_PREFIXES.some((p) => clean.startsWith(p));
  const rangeHit = DUAL_USE_RANGES.find(
    (r) => Number(prefix) >= r.from && Number(prefix) <= r.to
  );
  const destBlocked = BLOCKED_DESTINATIONS.includes(destination);
  const cat = AGRO_HS[prefix.slice(0, 4)] || AGRO_HS[prefix.slice(0, 2)] || AGRO_HS[prefix.slice(0, 3)] || null;
  const blocked = exactPrefixMatch || Boolean(rangeHit) || destBlocked;
  const reasons = [];
  if (exactPrefixMatch) reasons.push(`HS prefix on restriction list (${clean}).`);
  if (rangeHit) reasons.push(`${rangeHit.label} — dual-use screening triggered.`);
  if (destBlocked) reasons.push(`Destination ${destination} is a sanctioned market.`);
  return {
    hs: clean,
    destination,
    category: cat || "Not classified as agricultural",
    blocked,
    verdict: blocked ? "block" : "allow",
    reasons: blocked ? reasons : ["Clear for agricultural trade under general licenses for agrochemicals/fertilizers."],
  };
}

export function screeningsForCompany(org) {
  const s = screenParty(org, { exact: false });
  return s.verdict !== "block" ? { verdict: "clear", risk: s.risk } : s;
}