import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, ArrowRight, Globe2, ShieldCheck, Landmark, Ship, Building2, ArrowUpRight, ArrowDownRight,
  BadgeCheck, PackagePlus, Radar, Sparkles,
} from "lucide-react";
import { api, fmtUSD, fmtNum, timeAgo, STATUS_META } from "../api.js";
import { Panel, Stat, Badge, Av, StatusBadge } from "../components/ui.jsx";
import { Flag } from "../components/country.jsx";
import { Spark } from "../components/charts.jsx";
import { useSession } from "../store.jsx";

export function Home() {
  const { persona } = useSession();
  const navigate = useNavigate();
  const [ov, setOv] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get("/market/overview").then(setOv).catch(() => {});
    api.get("/suppliers").then((d) => setSuppliers(d.suppliers.slice(0, 5))).catch(() => {});
    api.get("/deals").then((d) => setDeals((d.deals || []).slice(0, 6))).catch(() => {});
    api.get("/activity").then((d) => setActivity(d.messages || [])).catch(() => {});
  }, []);

  const avgMove = ov?.commodities ? Math.round(ov.commodities.reduce((s, c) => s + c.change_pct, 0) / ov.commodities.length) : 0;
  const activeDeals = deals.filter((d) => !["closed", "delivered"].includes(d.status));

  return (
    <div>
      <section className="hero rise">
        <span className="prism a" />
        <span className="prism b" />
        <span className="glint" />
        <div className="hero-eyebrow eyebrow-motion">
          <span className="ping"><Sparkles size={13} /></span> The verified digital corridor for Africa ⇄ Eurasia agro trade
        </div>
        <h1>
          Trade agri<span style={{ color: "var(--primary)" }}>culture without risking</span> the cargo <em>or</em> the trust.
        </h1>
        <p className="lede">
          Escrowed payments, automated sanctions &amp; HS screening, live logistics and escrow-backed trade finance on a
          single rail — from Russian and EU fertiliser producers to East and Southern African buyers.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/market")}>
            Open the market <ArrowRight size={16} />
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate("/vision")}>
            Read the vision <Globe2 size={16} />
          </button>
        </div>
        {ov?.commodities?.length > 0 && (
          <div className="ticker mt2" aria-label="Live corridor commodity prices">
            <div className="ticker-track">
              {[...ov.commodities, ...ov.commodities].map((c, i) => (
                <span key={`${c.key}-${i}`} className="ticker-item">
                  <i>{c.label}</i> <b className="mono">${fmtNum(c.latest)}</b>
                  <span style={{ color: c.change_3m_pct >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {c.change_3m_pct >= 0 ? "▲" : "▼"} {Math.abs(c.change_3m_pct).toFixed(1)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-4 mt">
        <Stat label="Verified suppliers" value={fmtNum(suppliers.length) || "…"} hint="KYC/KYB on record" icon={<Building2 />} />
        <Stat label="Fertiliser price 12m" value={avgMove ? `${avgMove > 0 ? "+" : ""}${avgMove}%` : "…"} tone={avgMove > 0 ? "bad" : "good"} hint="index vs 12 months ago" />
        <Stat label="Active deals" value={fmtNum(activeDeals.length) || "…"} hint="across the corridor" />
        <Stat label="Fraud on escrowed deals" value="0.0%" hint="escrow + verification" />
      </section>

      <section className="grid grid-2 mt2" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Panel title="Corridor pulse" sub="Fertiliser & freight benchmark — live series" pad>
          <table className="table">
            <thead>
              <tr>
                <th>Instrument</th>
                <th className="num">Last</th>
                <th className="num">12m</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {ov?.commodities?.slice(0, 6).map((c) => {
                const up = c.change_3m_pct >= 0;
                return (
                  <tr key={c.key}>
                    <td>
                      <div className="row">
                        <span className="icon-tile" style={{ width: 28, height: 28, borderRadius: 8 }}>{c.key === "freight" ? <Ship size={13} /> : <Radar size={13} />}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div className="mono faint" style={{ fontSize: 10.5 }}>{c.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>USD {fmtNum(Math.round(c.latest))}</td>
                    <td className={`num price-move ${c.change_3m_pct >= 0 ? "" : ""}`} style={{ color: up ? "var(--danger)" : "var(--success)" }}>
                      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {Math.abs(c.change_3m_pct).toFixed(1)}%
                    </td>
                    <td><Spark data={c.series} w={88} h={26} color={up ? "var(--danger)" : "var(--success)"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="row between mt">
            <span className="faint">Updated {ov ? timeAgo(ov.updated) : ""} · deterministic demo series</span>
            <button className="btn btn-soft btn-sm" onClick={() => navigate("/market")}>Full market <ArrowRight size={13} /></button>
          </div>
        </Panel>

        <div className="stack">
          <Panel title="Corridor" sub="Ports & finance rails" pad={false}>
            <div className="panel-pad" style={{ paddingBottom: 6 }}>
              {ov?.corridor?.slice(0, 4).map((p) => (
                <div key={p.port} className="row" style={{ padding: "7px 0", justifyContent: "space-between" }}>
                  <div className="row">
                    <Ship size={15} className="faint" />
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.port}</div>
                      <div className="faint" style={{ fontSize: 11.5 }}>{dwell(p.dwell_days)} avg dwell</div>
                    </div>
                  </div>
                  <span className="badge">{fmtNum(p.throughput_mt)} MT</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="muted small">{ov?.rails?.length || "…"} funding rails live</span>
              <button className="btn btn-soft btn-sm" onClick={() => navigate("/market")}>Analytics <ArrowRight size={13} /></button>
            </div>
          </Panel>

          <Panel title="Trusted counterparties" sub="Top verified suppliers" pad={false}>
            <div style={{ padding: 6 }}>
              {suppliers.map((s) => (
                <button key={s.id} className="cmd-row" onClick={() => navigate(`/suppliers/${s.id}`)} style={{ textAlign: "left" }}>
                  <Av user={{ name: s.org }} size={30} />
                  <span style={{ fontWeight: 600 }}>{s.org}</span>
                  <span className="muted small">{s.products_count || 0} products</span>
                  <span className="cmd-desc">
                    <Badge tone={s.trust_tier === "gold" || s.trust_tier === "platinum" ? "amber" : "info"}>
                      <BadgeCheck size={11} /> {s.trust_tier}
                    </Badge>
                  </span>
                </button>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", padding: "12px 18px" }}>
              <button className="btn btn-soft btn-sm" onClick={() => navigate("/suppliers")}>Browse all suppliers <ArrowRight size={13} /></button>
            </div>
          </Panel>
        </div>
      </section>

      <section className="mt2">
        <Panel title="Recent deals" sub="Escrow-protected transactions in the corridor" pad={false}>
          <table className="table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Route</th>
                <th className="num">Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} onClick={() => navigate(`/deals/${d.id}`)} style={{ cursor: "pointer" }}>
                  <td>
                    <span className="mono" style={{ fontWeight: 600 }}>{d.code}</span>
                    <div className="faint" style={{ fontSize: 11 }}>{d.product?.name} · {fmtNum(d.qty_mt)} MT</div>
                  </td>
                  <td>
                    <div className="row">
                      <Flag iso={d.supplier_country} />
                      <span className="faint">{d.supplier_org}</span>
                      <ArrowRight size={12} className="faint" />
                      <Flag iso={d.buyer_country} />
                    </div>
                  </td>
                  <td className="num" style={{ fontWeight: 600, fontFamily: "var(--mono)" }}>{fmtUSD(d.total_usd)}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td className="num"><ArrowUpRight size={14} className="faint" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <section className="viz-band mt2">
        <div className="grid grid-2" style={{ alignItems: "center" }}>
          <div>
            <div className="hero-eyebrow"><ShieldCheck size={13} /> Why the protocol matters</div>
            <h2 style={{ margin: "10px 0", fontSize: 24 }}>Trade happened. Trust didn't survive the border.</h2>
            <p className="muted" style={{ maxWidth: 520 }}>
              Today buyers pay 30–45% over benchmark, financing costs run at 18–25%, and one in five deals stalls.
              AgriBridge converts each of those constraints into a measurable, escrow-backed outcome.
            </p>
            <div className="hero-actions" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={() => navigate("/vision")}>See the full narrative <Globe2 size={15} /></button>
            </div>
          </div>
          <div className="grid grid-2">
            <Stat label="Price gap vs benchmark" value="−40%" tone="good" hint="target for small buyers" />
            <Stat label="Settlement time" value="60x" hint="faster than bank wires" tone="good" />
            <Stat label="Deal default rate" value="1 in 5" tone="bad" hint="legacy corridor" />
            <Stat label="Fraud on escrow" value="0.0%" tone="good" hint="since launch" />
          </div>
        </div>
      </section>
    </div>
  );
}

function dwell(d) {
  return `${d} ${d === 1 ? "day" : "days"}`;
}
/* ------------------------------------------------------------------- ticker
   Live corridor ticker — spread across the hero, fed by /api/market/overview.
   The mono/green ticks keep the corridor feeling awake. */
export function Ticker({ commodities }) {
  if (!commodities?.length) return null;
  const items = [...commodities, ...commodities];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {items.map((c, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-c">{c.label}</span>
            <span className="ticker-v mono">${fmtUSD(c.latest)}</span>
            <span className={c.change_3m_pct >= 0 ? "ticker-up" : "ticker-down"}>
              {c.change_3m_pct >= 0 ? "▲" : "▼"} {Math.abs(c.change_3m_pct).toFixed(1)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
