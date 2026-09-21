import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, Lock, ArrowUpRight, Landmark, Coins, ScrollText, Smartphone, ShieldCheck, TrendingUp, ArrowLeftRight } from "lucide-react";
import { api, fmtUSD } from "../api.js";
import { Stat, Badge, StatusBadge, Money, Empty, Panel } from "../components/ui.jsx";
import { Donut } from "../components/charts.jsx";

const FUNDING_OPTIONS = [
  { icon: Landmark, label: "Bank wire", note: "SWIFT · 3–5 days" },
  { icon: Coins, label: "Stablecoin escrow", note: "USDT/USDC · minutes" },
  { icon: ScrollText, label: "Letter of credit", note: "doc-heavy · large lots" },
  { icon: Smartphone, label: "Mobile money", note: "capped at $5k/tranche" },
];

export function Escrow() {
  const [data, setData] = useState(null);
  const [rails, setRails] = useState(null);
  useEffect(() => {
    api.get("/escrows").then(setData).catch(() => {});
    api.get("/market/finance").then(setRails).catch(() => {});
  }, []);

  if (!data) return <div className="loading"><span className="spin" /></div>;

  const lockedCount = data.items.filter((i) => i.escrow_status === "locked").length;

  return (
    <div>
      <section className="hero" style={{ padding: "26px 0 20px" }}>
        <div className="hero-eyebrow"><ShieldCheck size={13} /> Escrow wallet</div>
        <h1 style={{ fontSize: 30 }}>Funds only leave the escrow <em>on verified delivery</em>.</h1>
        <p className="lede">AgriBridge holds settlement in custody. Unless both sides confirm, money does not move — the escrow rules are enforced programmatically.</p>
        <div className="hero-actions">
          <Badge tone="good" style={{ fontSize: 12, padding: "6px 12px" }}><ShieldCheck size={12} /> Escrow rules enforced</Badge>
        </div>
      </section>

      <section className="grid grid-4">
        <Stat label="Available balance" value={fmtUSD(data.available)} hint="demo wallet — ready to fund deals" />
        <Stat label="Locked in escrow" value={fmtUSD(data.locked)} hint={`${lockedCount} active deals`} />
        <Stat label="Released to suppliers" value={fmtUSD(data.released)} hint="0% fraud on released funds" />
        <Stat label="Platform-wide in custody" value={fmtUSD(data.locked_all)} hint="across all viewpoints" />
      </section>

      <section className="grid mt2" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
        <Panel title="Active escrows" sub="Each release is gated on verified delivery and a clean dispute state" pad={false}>
          <table className="table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Counterparty</th>
                <th className="num">Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th className="num"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((i) => (
                <tr key={i.deal_id}>
                  <td><span className="mono" style={{ fontWeight: 600 }}>{i.code}</span></td>
                  <td>{i.counterparty}</td>
                  <td className="num">{i.escrow_status === "open" ? <span className="faint">not funded</span> : <Money value={i.amount_usd} />}</td>
                  <td style={{ fontSize: 12.5 }}>{i.method || "—"}</td>
                  <td>{i.escrow_status === "locked" ? <StatusBadge status="funded" /> : i.escrow_status === "released" ? <StatusBadge status="delivered" /> : <Badge>open</Badge>}</td>
                  <td className="num"><Link className="btn btn-ghost btn-sm" to={`/deals/${i.deal_id}`}>Manage</Link></td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr><td colSpan={6}><Empty icon={<Lock size={22} />} title="No escrows yet" body="Fund an open deal from its Deal Room to see it here." /></td></tr>
              )}
            </tbody>
          </table>
        </Panel>

        <div className="stack">
          <Panel title="Custody position" pad>
            <div className="row" style={{ gap: 20, justifyContent: "center" }}>
              <Donut
                segments={[
                  { v: data.locked, color: "var(--primary)" },
                  { v: data.released, color: "var(--success)" },
                  { v: data.available, color: "var(--surface-3)" },
                ]}
                center={fmtUSD(data.locked).replace("$", "")}
                sub="locked USD"
                size={138}
              />
              <div className="stack small">
                <div className="row"><span className="dot-on" style={{ background: "var(--primary)" }} /> Locked</div>
                <div className="row"><span className="dot-on" style={{ background: "var(--success)" }} /> Released</div>
                <div className="row"><span className="dot-on" style={{ background: "var(--surface-3)", border: "1px solid var(--border-strong)" }} /> Available</div>
              </div>
            </div>
          </Panel>

          <Panel title="Funding rails" sub="Time-to-settlement per method" pad>
            <div className="stack">
              {FUNDING_OPTIONS.map((f) => (
                <div key={f.label} className="row">
                  <span className="icon-tile" style={{ width: 32, height: 32, borderRadius: 8 }}><f.icon size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{f.note}</div>
                  </div>
                  {f.label.toLowerCase().includes("stablecoin") && <Badge tone="good"><ShieldCheck size={11} /> minutes</Badge>}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="FX reference" pad>
            {data.fx && (
              <div className="grid grid-2">
                {Object.entries(data.fx).filter(([k]) => k.startsWith("USD_")).map(([k, v]) => (
                  <div key={k} className="row between" style={{ padding: "5px 0" }}>
                    <span className="mono muted">{k.replace("_", "/")}</span>
                    <span className="mono" style={{ fontWeight: 700 }}>{Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="faint mt small row" style={{ gap: 5 }}><ArrowLeftRight size={12} /> Indicative mid-rates · demo feed</div>
          </Panel>

          <div className="viz-band">
            <div className="row" style={{ gap: 8 }}>
              <TrendingUp size={15} style={{ color: "var(--primary)" }} />
              <span className="small">The stablecoin rail settles in minutes instead of days and eliminates FX haircuts — budgets stay the budget.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}