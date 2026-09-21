import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp, Ship, ArrowUpRight, ArrowDownRight, Zap, Radio, Calculator, Banknote,
} from "lucide-react";
import { api, fmtNum, fmtUSD } from "../api.js";
import { Panel, Stat, Badge } from "../components/ui.jsx";
import { LineChart, Bars, Donut } from "../components/charts.jsx";
import { Flag } from "../components/country.jsx";

const COMM_META = {
  urea: { hs: "3102.10", scale: "MT" },
  npk: { hs: "3105.20", scale: "MT" },
  dap: { hs: "3105.30", scale: "MT" },
  mop: { hs: "3104.20", scale: "MT" },
  can: { hs: "3102.30", scale: "MT" },
  glyphosate: { hs: "3808.93", scale: "L" },
  freight: { hs: "BALTIC·RX", scale: "FEU" },
};

export function Market() {
  const [ov, setOv] = useState(null);
  const [cor, setCor] = useState(null);
  const [sel, setSel] = useState("urea");
  const [amt, setAmt] = useState(250000);
  const [tenor, setTenor] = useState(30);
  const [rail, setRail] = useState("stablecoin");
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    api.get("/market/overview").then(setOv).catch(() => {});
    api.get("/market/corridor").then(setCor).catch(() => {});
  }, []);

  const commodity = useMemo(() => ov?.commodities?.find((c) => c.key === sel) || ov?.commodities?.[0], [ov, sel]);

  const runQuote = () => api.post("/finance/quote", { amount: amt, tenorDays: tenor, rail }).then(setQuote).catch(() => {});

  const fmtT = (v) => `$${fmtNum(Math.round(v))}`;

  return (
    <div>
      <section className="hero" style={{ padding: "28px 0 18px" }}>
        <span className="prism a" style={{ opacity: 0.4 }} />
        <div className="hero-eyebrow"><TrendingUp size={13} /> Corridor market intelligence</div>
        <h1 style={{ fontSize: 30 }}>Benchmarks you can <em>act on</em> — and finance that prices risk.</h1>
        <p className="lede" style={{ maxWidth: 640 }}>
          Deterministic reference series for the corridor's critical inputs, live port telemetry and a
          rail-by-rail financing comparison, all escrow-backed.
        </p>
      </section>

      <section className="grid grid-4 mt">
        <Stat label="Commodities tracked" value={ov?.commodities?.length || "…"} hint="fertiliser + freight" />
        <Stat label="Corridor throughput" value={cor ? `${fmtNum(cor.throughput_mt)} MT` : "…"} hint="per quarter" />
        <Stat label="Active vessels" value={cor?.active_vessels || "…"} hint="across 5 ports" />
        <Stat label="Avg port dwell" value={cor ? `${cor.avg_dwell_days}d` : "…"} hint="Mombasa → Rotterdam" />
      </section>

      <section className="grid mt2" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "stretch" }}>
        <Panel title="Commodity series" sub="Index vs 12 months ago — deterministic, re-seeded per session">
          <div className="chip-row mb">
            {ov?.commodities?.map((c) => (
              <button key={c.key} className={`seg ${sel === c.key ? "on" : ""}`} style={{ display: "inline-flex" }} onClick={() => setSel(c.key)}>
                <span className="row" style={{ gap: 6 }}>
                  {c.key === "freight" ? <Ship size={13} /> : <Radio size={13} />}
                  {c.name}
                </span>
              </button>
            ))}
          </div>
          {commodity && (
            <>
              <div className="chart-wrap">
                <LineChart data={commodity.series} key="price" height={240} color={commodity.change_pct >= 0 ? "var(--danger)" : "var(--primary)"} format={fmtT} />
              </div>
              <div className="row between mt">
                <div className="row" style={{ gap: 8 }}>
                  <span className="badge">{commodity.name}</span>
                  <span className="mono faint">HS {COMM_META[commodity.key]?.hs || "—"}</span>
                </div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 18 }}>
                  USD {fmtNum(Math.round(commodity.latest))} <span className="faint" style={{ fontSize: 12 }}>/{COMM_META[commodity.key]?.scale || commodity.unit}</span>
                </div>
              </div>
            </>
          )}
        </Panel>

        <div className="stack">
          <Panel title="Session summary" sub="This commodity, this corridor" pad>
            {commodity ? (
              <div className="stack">
                <div className="grid grid-2">
                  <Stat label="1m move" value={`${commodity.change_3m_pct >= 0 ? "+" : ""}${commodity.change_3m_pct.toFixed(1)}%`} tone={commodity.change_3m_pct >= 0 ? "bad" : "good"} />
                  <Stat label="12m move" value={`${commodity.change_pct >= 0 ? "+" : ""}${commodity.change_pct.toFixed(1)}%`} tone={commodity.change_pct >= 0 ? "bad" : "good"} />
                </div>
                <div className="viz-band" style={{ padding: 14 }}>
                  <div className="row" style={{ gap: 6 }}>
                    {commodity.change_pct >= 0 ? <ArrowUpRight size={14} style={{ color: "var(--danger)" }} /> : <ArrowDownRight size={14} style={{ color: "var(--success)" }} />}
                    <span className="small muted">
                      {commodity.change_pct >= 0
                        ? "Buyers should lock offers and escrow now — the benchmark is firming."
                        : "A softening benchmark favours buyers; verify certificates before funding."}
                    </span>
                  </div>
                </div>
                <div className="small muted">
                  Screening preview: <span className="mono">HS {COMM_META[commodity.key]?.hs || "—"}</span> is exportable to the
                  destinations below under the general agricultural licence.
                </div>
              </div>
            ) : (
              <div className="muted" style={{ padding: 10 }}>Loading…</div>
            )}
          </Panel>

          <Panel title="Port telemetry" sub="Live dwell & congestion" pad={false}>
            <div className="panel-pad" style={{ paddingTop: 12 }}>
              <Bars
                data={cor?.ports?.map((p) => ({ l: p.port.split(" ")[0], v: p.dwell_days, color: p.dwell_days > 4.5 ? "var(--danger)" : p.dwell_days > 3 ? "var(--accent)" : "var(--primary)" })) || []}
                h={130}
                fmt={(v) => `${v}d`}
              />
            </div>
            <div style={{ borderTop: "1px solid var(--border)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="faint">{cor?.routes ?? 0} active sea routes</span>
              <Badge tone="info"><Ship size={11} /> {cor?.active_vessels ?? 0} vessels en route</Badge>
            </div>
          </Panel>
        </div>
      </section>

      <section className="mt2">
        <Panel title="Corridor ports" sub="Throughput, dwelling and congestion — the physical rail" pad>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {cor?.ports?.map((p) => (
              <div key={p.port} className="stat" style={{ padding: 14 }}>
                <div className="row between">
                  <div className="row">
                    <Flag iso={p.country} />
                    <b style={{ fontSize: 13 }}>{p.port}</b>
                  </div>
                  <Badge tone={p.congestion > 40 ? "bad" : p.congestion > 28 ? "warn" : "good"}>
                    {p.congestion}% cong.
                  </Badge>
                </div>
                <div className="mt" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div className="faint" style={{ fontSize: 10.5 }}>THROUGHPUT / Q</div>
                    <div className="mono" style={{ fontWeight: 700 }}>{fmtNum(p.throughput_mt)} MT</div>
                  </div>
                  <div>
                    <div className="faint" style={{ fontSize: 10.5 }}>DWELL</div>
                    <div className="mono" style={{ fontWeight: 700 }}>{p.dwell_days} d</div>
                  </div>
                </div>
                <div className="faint" style={{ marginTop: 8, fontSize: 11 }}>{p.active_vessels} vessels · ${p.cost_per_ctr}/FEU landed</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid mt2" style={{ gridTemplateColumns: "1.5fr 1fr", alignItems: "stretch" }}>
        <Panel title="Settlement rails" sub="Compare cost, time and working-capital release per method" pad={false}>
          <table className="table">
            <thead>
              <tr>
                <th>Rail</th>
                <th className="num">Cost (bps)</th>
                <th className="num">Settlement</th>
                <th className="num">Capital release</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ov?.rails?.map((r) => (
                <tr key={r.kind}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.label}</div>
                    <div className="faint" style={{ fontSize: 11 }}>{r.notes}</div>
                  </td>
                  <td className="num mono">{r.cost_bps} bps</td>
                  <td className="num mono">{r.settlement_days} d</td>
                  <td className="num mono">{r.working_capital_release_days === 0 ? "instant" : `${r.working_capital_release_days} d`}</td>
                  <td className="num">
                    {r.kind === "stablecoin" || r.kind === "trade_finance" ? <Badge tone="good"><Zap size={11} /> Live</Badge> : <Badge>Legacy</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Trade-finance simulator" sub="What does escrow-backed financing change?" pad>
          <div className="field-row">
            <div>
              <label className="field">Purchase value (USD)</label>
              <input className="input mono" type="number" value={amt} onChange={(e) => setAmt(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="field">Tenor (days)</label>
              <input className="input mono" type="number" value={tenor} onChange={(e) => setTenor(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="mt">
            <label className="field">Rail</label>
            <select className="input" value={rail} onChange={(e) => setRail(e.target.value)}>
              {ov?.rails?.map((r) => (
                <option key={r.kind} value={r.kind}>{r.label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={runQuote}>
            <Calculator size={15} /> Simulate financing
          </button>
          {quote && (
            <div className="viz-band mt" style={{ padding: 14 }}>
              <div className="row between">
                <span className="small muted">AgriBridge financing</span>
                <Badge tone="good"><Banknote size={11} /> 9% p.a.</Badge>
              </div>
              <div className="grid grid-2 mt">
                <Stat label="Financing cost" value={fmtUSD(quote.quote.financing_cost)} hint="vs bank-wire imputed rate" />
                <Stat label="Working capital" value={`${quote.quote.working_capital_days}d`} tone="good" hint="released, not locked" />
              </div>
              <div className="grid grid-2 mt">
                <Stat label="Settlement" value={`${quote.quote.settlement_hrs.toFixed(1)} hrs`} tone="good" hint={`vs ${quote.baseline.settlement_hrs.toFixed(1)}h wire`} />
                <Stat label="Interest saved" value={fmtUSD(quote.quote.cost_of_capital_saved)} tone="good" hint="vs 20% informal credit" />
              </div>
              <div className="small faint mt" style={{ textAlign: "center" }}>
                Simulated for demo. Live pricing per verified counterparty and FX.
              </div>
            </div>
          )}
        </Panel>
      </section>

      <section className="grid grid-2 mt2">
        <Panel title="FX reference" sub="Noise-added deterministic rates" pad>
          <div className="grid grid-2">
            {ov?.fx && Object.entries(ov.fx).map(([k, v]) => (
              <div key={k} className="row between" style={{ padding: "8px 0" }}>
                <span className="mono">{k.replace("_", "/")}</span>
                <span className="mono" style={{ fontWeight: 700 }}>{Number(v).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Market composition" sub="Corridor mix this session" pad>
          <div className="row" style={{ gap: 24, justifyContent: "center", padding: "8px 0" }}>
            <Donut
              segments={[
                { v: 52, color: "var(--primary)" },
                { v: 24, color: "var(--accent)" },
                { v: 14, color: "var(--info)" },
                { v: 10, color: "var(--danger)" },
              ]}
              center="52%"
              sub="NPK & DAP"
              size={124}
            />
            <div className="stack small">
              <div className="row"><span className="dot-on" style={{ background: "var(--primary)", width: 9, height: 9, borderRadius: "50%" }} /> NPK &amp; DAP blends</div>
              <div className="row"><span className="dot-on" style={{ background: "var(--accent)", width: 9, height: 9, borderRadius: "50%" }} /> Urea &amp; N-based</div>
              <div className="row"><span className="dot-on" style={{ background: "var(--info)", width: 9, height: 9, borderRadius: "50%" }} /> MOP &amp; CAN</div>
              <div className="row"><span className="dot-on" style={{ background: "var(--danger)", width: 9, height: 9, borderRadius: "50%" }} /> Crop protection</div>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}