import { useEffect, useState } from "react";
import {
  Globe2, Building, GaugeCircle, Scale, ShieldCheck, Landmark, Ship, TrendingDown, LineChart as Line,
  Target, Atom, ArrowRight, Zap, Users, FileCheck2, Network,
} from "lucide-react";
import { api } from "../api.js";
import { Panel, Stat, Badge } from "../components/ui.jsx";

const PAST_ICONS = [TrendingDown, GaugeCircle, ShieldCheck, Atom];
const NOW_ICONS = [Landmark, FileCheck2, ShieldCheck, Ship, Network];
const FUT_ICONS = [Zap, FileCheck2, Line, Users];

export function Vision() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/insights").then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div>
      <section className="hero" style={{ padding: "36px 0 26px" }}>
        <span className="prism b" />
        <div className="hero-eyebrow">
          <Globe2 size={13} /> The corridor, narrated for trade partners & ministries
        </div>
        <h1>
          Africa ⇄ Eurasia trade has a <em>trust problem</em>, not a demand problem.
        </h1>
        <p className="lede">
          Sixty billion tonnes of grain and inputs move on paper rails. AgriBridge is the protocol that makes every
          shipment traceable, every payment escrowed and every certificate verifiable — from farmgate to frontier.
        </p>
      </section>

      <section className="grid grid-4">
        {data.whyItMatters.map((k) => (
          <Stat key={k.label} label={k.label} value={k.value} hint="corridor economics" />
        ))}
      </section>

      <section className="stack mt2" style={{ gap: 0 }}>
        <TimelineBlock
          icons={PAST_ICONS}
          tone="bad"
          stage="Past"
          kicker="Where the corridor leaked"
          title="The legacy corridor taxed every step"
          intro="For decades the route ran on opaque pricing, blind payments and paper compliance. Each failure was concentrated — small buyers and producers absorbed the worst of it."
          items={data.past}
        />
        <TimelineBlock
          icons={NOW_ICONS}
          tone="good"
          stage="Present"
          kicker="Where AgriBridge sits today"
          title="Every constraint is being converted into a line item"
          intro="AgriBridge removes the friction at the point it happens: settlement, screening, escrow, logistics and financing are now products, not promises."
          items={data.present}
        />
        <TimelineBlock
          icons={FUT_ICONS}
          tone="info"
          stage="Future"
          kicker="Where the protocol is heading"
          title="A programmable, passportised agro-trade rail"
          intro="The end state is one verified identity that travels with the cargo, settlement measured in seconds, and financing that prices risk instead of rationing it."
          items={data.future}
        />
      </section>

      <section className="mt2">
        <Panel title="Constraints to outcomes" sub="How the platform moves measured indicators" pad={false}>
          <table className="table">
            <thead>
              <tr>
                <th>Constraint</th>
                <th>Legacy corridor</th>
                <th>AgriBridge rail</th>
                <th className="num">Impact</th>
              </tr>
            </thead>
            <tbody>
              {data.constraintsSolved.map((c) => (
                <tr key={c.constraint}>
                  <td style={{ fontWeight: 600 }}>{c.constraint}</td>
                  <td className="muted">{c.before}</td>
                  <td>{c.after}</td>
                  <td className="num">
                    <Badge tone="good"><Target size={11} /> {c.metric}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <section className="viz-band mt2">
        <div className="grid grid-3" style={{ alignItems: "center" }}>
          <div>
            <div className="hero-eyebrow"><Scale size={13} /> Alignment</div>
            <h2 style={{ margin: "10px 0", fontSize: 22 }}>Built for policy coherence</h2>
            <p className="muted small" style={{ maxWidth: 420 }}>
              Every escrow release emits an auditable record; every consignment is sanctions-screened and HS-checked
              before it funds. Regulators inspect the rail, not the stack of paper.
            </p>
          </div>
          <div>
            <div className="hero-eyebrow"><Building size={13} /> Buy &amp; supply sides</div>
            <h2 style={{ margin: "10px 0", fontSize: 22 }}>Cooperative-ready procurement</h2>
            <p className="muted small" style={{ maxWidth: 420 }}>
              Pool cooperative demand into bankable lots, sign forward agreements, and let escrow-backed financing trigger
              the moment a contract is countersigned.
            </p>
          </div>
          <div>
            <div className="hero-eyebrow"><Ship size={13} /> Sovereign rails</div>
            <h2 style={{ margin: "10px 0", fontSize: 22 }}>Ports, corridors, rails</h2>
            <p className="muted small" style={{ maxWidth: 420 }}>
              Mombasa, Dar es Salaam, Beira, Novorossiysk and Rotterdam — each with live dwell, throughput and vessel
              telemetry feeding the desk.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function TimelineBlock({ stage, kicker, title, intro, items, icons, tone }) {
  return (
    <section className="mt2">
      <div className="row mb">
        <span className={`badge ${tone === "bad" ? "bad" : tone === "info" ? "info" : "good"}`} style={{ fontSize: 12, padding: "6px 12px" }}>{stage}</span>
        <div>
          <div className="hero-eyebrow" style={{ margin: 0 }}>{kicker}</div>
        </div>
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: 26 }}>{title}</h2>
      <p className="muted" style={{ maxWidth: 760, margin: "0 0 18px" }}>{intro}</p>
      <div className="timeline">
        {items.map((it) => {
          const Icon = icons[(items.indexOf(it) % icons.length)];
          return (
            <article key={it.id} className="tl-item">
              <div className="tl-rail">
                <span className={`tl-dot ${tone === "bad" ? "bad" : tone === "info" ? "info" : "good"}`} style={{ borderColor: tone === "bad" ? "var(--danger-soft)" : tone === "info" ? "var(--info-soft)" : "var(--success-soft)" }} />
                <span className="tl-line" />
              </div>
              <div className="panel" style={{ flex: 1, padding: "16px 18px" }}>
                <div className="row between">
                  <div className="row">
                    <span className="icon-tile">{<Icon size={16} />}</span>
                    <h3 style={{ margin: 0, fontSize: 15 }}>{it.title}</h3>
                  </div>
                  {it.kpi && (
                    <div style={{ textAlign: "right" }}>
                      <div className="mono" style={{ fontWeight: 700, fontSize: 15, color: tone === "bad" ? "var(--danger)" : "var(--primary)" }}>{it.kpi.value}</div>
                      <div className="faint" style={{ fontSize: 10.5 }}>{it.kpi.label}</div>
                    </div>
                  )}
                </div>
                <p className="muted small" style={{ margin: "10px 0 0", maxWidth: 640 }}>
                  {tone === "bad" ? it.problem : tone === "info" ? it.vision : it.problem}
                </p>
                {(it.feature || it.route) && tone === "good" && (
                  <div className="row mt">
                    <Badge tone="good"><Zap size={11} /> {it.feature}</Badge>
                    {it.route && <ArrowRight size={13} className="faint" />}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}