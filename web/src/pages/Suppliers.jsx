import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Star, BadgeCheck, Building2, ArrowUpRight } from "lucide-react";
import { api } from "../api.js";
import { Empty, Av, Badge } from "../components/ui.jsx";
import { Flag } from "../components/country.jsx";

const TIERS = [
  { value: "", label: "Any trust tier" },
  { value: "platinum", label: "Platinum verified" },
  { value: "gold", label: "Gold verified" },
  { value: "silver", label: "Silver verified" },
  { value: "bronze", label: "Bronze verified" },
];

export function Suppliers() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [origin, setOrigin] = useState("");
  const [tier, setTier] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = (query) => {
    setLoading(true);
    const s = new URLSearchParams();
    if (query || q) s.set("q", query || q);
    if (origin) s.set("origin", origin);
    if (tier) s.set("tier", tier);
    if (tier === "gold" || tier === "platinum") s.set("sort", "rating");
    api.get(`/suppliers?${s.toString()}`)
      .then((r) => {
        setSuppliers(r.suppliers);
        const all = r.suppliers.map((x) => x.country);
        setOrigins((prev) => (prev.length ? prev : [...new Set(all)]));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, tier]);

  return (
    <div>
      <section className="hero" style={{ padding: "26px 0 20px" }}>
        <div className="hero-eyebrow"><Building2 size={13} /> Verified directory</div>
        <h1 style={{ fontSize: 30 }}>Only KYC-approved parties <em>reach the desk</em>.</h1>
        <p className="lede">Tiered verification, sanctions screening and escrow-first dealing. Every supplier below can be paid by escrow release only.</p>
      </section>

      <section className="panel mb" style={{ padding: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <form className="search" style={{ flex: 2, minWidth: 260 }} onSubmit={(e) => { e.preventDefault(); load(e.currentTarget.query.value); }}>
            <Search size={15} />
            <input name="query" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Company, country, product…" />
            <button className="btn btn-primary btn-sm" type="submit">Search</button>
          </form>
          <select className="input" value={origin} onChange={(e) => setOrigin(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
            <option value="">All origins</option>
            {origins.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="input" value={tier} onChange={(e) => setTier(e.target.value)} style={{ width: "auto", minWidth: 180 }}>
            {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <span className="badge" style={{ fontSize  : 12, alignSelf: "center" }}><SlidersHorizontal size={12} /> {suppliers.length} results</span>
        </div>
      </section>

      {loading ? (
        <div className="loading"><span className="spin" /></div>
      ) : suppliers.length === 0 ? (
        <Empty icon={<Building2 size={22} />} title="No suppliers match" body="Adjust the search or trust-tier filters to widen the net." />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))" }}>
          {suppliers.map((s) => (
            <article key={s.id} className="panel" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }} onClick={() => navigate(`/suppliers/${s.id}`)}>
              <div className="row" style={{ gap: 12 }}>
                <Av user={{ name: s.org }} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.org}</div>
                  <div className="row" style={{ gap: 6 }}>
                    <Flag iso={s.country} />
                    <span className="muted small">{s.country}</span>
                  </div>
                </div>
                <Badge tone={s.trust_tier === "gold" || s.trust_tier === "platinum" ? "amber" : s.trust_tier === "bronze" ? "warn" : "info"}>
                  <BadgeCheck size={11} /> {s.trust_tier}
                </Badge>
              </div>
              <div className="row" style={{ gap: 14, flexWrap: "wrap", fontSize: 12.5, color: "var(--muted)" }}>
                <span className="row" style={{ gap: 4 }}><Star size={12} fill="var(--gold)" color="var(--gold)" /> {s.rating || "—"}</span>
                <span>{s.products_count} products</span>
                <span>{s.deals_completed} completed</span>
                <span className="mono">EST {new Date(s.joined).getFullYear()}</span>
              </div>
              {s.deals_completed >= 1 && (
                <Badge tone="good"><BadgeCheck size={11} /> Recurring escrow partner</Badge>
              )}
              {s.capacity_mt > 0 && (
                <div className="faint" style={{ fontSize: 11.5 }}>Capacity {s.capacity_mt.toLocaleString()} MT · {s.markets || "regional"}</div>
              )}
              <span className="btn btn-primary btn-sm" style={{ marginTop: "auto", width: "fit-content" }}>
                Open profile <ArrowUpRight size={13} />
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}