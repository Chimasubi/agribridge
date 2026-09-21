import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, Coins, Target, Banknote, Gavel, Download, ArrowRight } from "lucide-react";
import { api, fmtUSD } from "../api.js";
import { useToast } from "../components/toast.jsx";
import { Stat, Badge, Spinner, Panel } from "../components/ui.jsx";
import { STATUS_META } from "../api.js";

const COLS = ["negotiation", "funded", "shipped", "delivered", "disputed", "closed"];

export function Broker() {
  const [data, setData] = useState(null);
  const toast = useToast();

  const load = () => api.get("/broker/dashboard").then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const rule = async (id, verdict) => {
    const note = verdict === "rule" ? "Supplier issued a credit; escrow released at original terms." : "Claim rejected — evidence insufficient. Deal reopens for negotiation.";
    await api.post(`/disputes/${id}/rule`, { verdict, note }).catch(() => {});
    toast(verdict === "rule" ? "Ruling recorded in favour" : "Claim rejected");
    load();
  };

  if (!data) return <Spinner />;
  const k = data.kpis;

  return (
    <div>
      <section className="hero" style={{ padding: "26px 0 20px" }}>
        <div className="hero-eyebrow"><Handshake size={13} /> Broker mode</div>
        <h1 style={{ fontSize: 30 }}>Originate, negotiate, <em>mediate</em> — earn on every escrow close.</h1>
        <p className="lede">The broker desk is the neutral spine of the corridor: commission ledger, live pipeline and the ICC-aligned mediation queue.</p>
      </section>

      <section className="grid grid-4">
        <Stat label="Active deals" value={k.active} hint="on your desk" />
        <Stat label="Commission earned" value={fmtUSD(k.commission_earned)} hint="1.5% on closed value" />
        <Stat label="Win rate" value={`${k.win_rate}%`} hint="closed ÷ total" />
        <Stat label="Avg deal size" value={fmtUSD(k.avg_deal)} hint="per brokered deal" />
      </section>

      <section className="mt2">
        <div className="row mb">
          <h2 className="hd" style={{ margin: 0, fontSize: 20 }}>Pipeline</h2>
          <Badge tone="info" style={{ marginLeft: 8 }}>live</Badge>
        </div>
        <div className="kanban">
          {COLS.map((key) => {
            const col = data.pipeline[key] || [];
            return (
              <div key={key} className="kan-col">
                <h4>{STATUS_META[key]?.label || key} · {col.length}</h4>
                {col.map((d) => (
                  <Link key={d.id} to={`/deals/${d.id}`} className="kan-card">
                    <div className="mono" style={{ fontWeight: 600, fontSize: 12 }}>{d.code}</div>
                    <div className="muted small" style={{ fontSize: 11.5 }}>{d.buyer} ⇄ {d.supplier}</div>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 12, marginTop: 4 }}>{fmtUSD(d.total)}</div>
                  </Link>
                ))}
                {col.length === 0 && <div className="faint" style={{ fontSize: 11.5, padding: "4px 2px" }}>empty</div>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid mt2" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
        <Panel title="Commission ledger" sub="1.5% of every executed deal value" pad={false}>
          <table className="table">
            <thead>
              <tr>
                <th>Deal</th>
                <th className="num">Value</th>
                <th className="num">Commission</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.map((l) => (
                <tr key={l.deal_id}>
                  <td><span className="mono" style={{ fontWeight: 600 }}>{l.code}</span></td>
                  <td className="num">{fmtUSD(l.value_usd)}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{fmtUSD(l.commission_usd)}</td>
                  <td><Badge tone={l.payout === "paid" ? "good" : "amber"}>{l.payout}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="panel-pad" style={{ borderTop: "1px solid var(--border)" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { const a = document.createElement("a"); a.download = "commission-ledger.csv"; a.href = "data:text/csv," + encodeURIComponent("Deal,Value,Commission,Status\n" + data.ledger.map((l) => `${l.code},${l.value_usd},${l.commission_usd},${l.payout}`).join("\n")); a.click(); }}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </Panel>

        <div className="stack">
          <Panel title="Mediation queue" sub="Funds stay frozen until a ruling is recorded" pad>
            {data.disputes.length === 0 && <div className="muted" style={{ textAlign: "center", padding: 16 }}>No open disputes.</div>}
            {data.disputes.map((d) => (
              <div key={d.id} className="stack mb" style={{ gap: 10, border: "1px solid var(--danger-soft)", borderRadius: 12, padding: 14, background: "var(--danger-soft)" }}>
                <div className="row between">
                  <span className="mono" style={{ fontWeight: 700 }}>{d.code}</span>
                  <Badge tone="bad"><Gavel size={11} /> open</Badge>
                </div>
                <div style={{ fontWeight: 700 }}>{d.parties}</div>
                <p className="small" style={{ margin: 0 }}>{d.reason}</p>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => rule(d.id, "rule")}>Rule in favour</button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => rule(d.id, "reject")}>Reject claim</button>
                </div>
              </div>
            ))}
            <div className="faint small">Arbitrations follow AgriBridge rules, ICC-aligned. The escrow stays locked until the ruling lands.</div>
          </Panel>

          <div className="viz-band">
            <div className="row" style={{ gap: 8 }}>
              <Coins size={15} style={{ color: "var(--primary)" }} />
              <span className="small">Pipeline reflects only escrow-backed negotiations — no handshake deals, no ghost inventory.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}