import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ship, Container, MapPin, Clock3, FileText, ChevronRight } from "lucide-react";
import { api, timeAgo, shortDate } from "../api.js";
import { StatusBadge, Badge, Empty } from "../components/ui.jsx";

const PORT = {
  "Novorossiysk": [44.72, 37.8],
  "Rotterdam": [51.94, 4.48],
  "Hamburg": [53.55, 9.99],
  "Mombasa": [-4.05, 39.67],
  "Dar es Salaam": [-6.8, 39.29],
  "Beira": [-19.82, 34.84],
  "Origin": [44.72, 37.8],
};

const W = 1000, H = 320;
const proj = ([lat, lon]) => [((lon + 10) / 65) * W, ((45 - lat) / 82) * H];

const TIMELINE = ["Booking confirmed", "Loaded on board", "In transit", "Customs", "Delivered"];
const statusIdx = (s) => ({ booking: 0, loaded: 1, in_transit: 2, cleared: 3, delivered: 4 }[s] ?? 2);

export function Logistics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/logistics").then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="loading"><span className="spin" /></div>;

  return (
    <div>
      <section className="hero" style={{ padding: "26px 0 20px" }}>
        <div className="hero-eyebrow"><Ship size={13} /> Logistics desk</div>
        <h1 style={{ fontSize: 30 }}>Containers stop being a <em>black box</em>.</h1>
        <p className="lede">Integrated forwarders at Mombasa, Dar es Salaam and Beira push live dwell, customs and vessel status into the deal room.</p>
        <div className="hero-actions">
          <Badge tone="info" style={{ fontSize: 12, padding: "6px 12px" }}><Ship size={12} /> {data.shipments.length} containers active</Badge>
        </div>
      </section>

      {data.shipments.length === 0 && (
        <Empty icon={<Ship size={22} />} title="No shipments yet" body="Book freight once a deal is funded — the forwarder desk takes it from there." />
      )}

      {data.shipments.map((l) => {
        const idx = statusIdx(l.status);
        const origin = l.route.split("→")[0].trim();
        const dest = l.route.split("→")[1]?.trim() || l.port;
        const [ox, oy] = proj(PORT[origin] || PORT.Origin);
        const [dx, dy] = proj(PORT[dest] || PORT.Mombasa);
        let [mx, my] = [(ox + dx) / 2, (oy + dy) / 2];
        if (l.status === "loaded") [mx, my] = [ox + (dx - ox) * 0.08, oy + (dy - oy) * 0.08];
        if (l.status === "cleared" || l.status === "delivered") [mx, my] = [ox + (dx - ox) * 0.96, oy + (dy - oy) * 0.96];

        return (
          <section key={l.id} className="panel mb" style={{ overflow: "hidden" }}>
            <div className="panel-head" style={{ flexWrap: "wrap" }}>
              <div>
                <div className="mono faint" style={{ fontSize: 12 }}>{l.code}</div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{l.route}</div>
                <div className="faint" style={{ fontSize: 12.5 }}>{l.forwarder_org || "Forwarder"} · booked via AgriBridge</div>
              </div>
              <div className="spacer">
                <StatusBadge status={l.deal_status === "delivered" ? "delivered" : l.deal_status === "shipped" ? "shipped" : "funded"} />
                <span className="faint small">ETA {shortDate(l.eta)}</span>
              </div>
            </div>

            <div className="chart-wrap" style={{ position: "relative", height: H, background: "radial-gradient(circle at 50% 50%, var(--surface-3) 0%, var(--bg) 100%)" }}>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block", position: "absolute", inset: 0 }}>
                <line x1={ox} y1={oy} x2={dx} y2={dy} stroke="var(--border-strong)" strokeWidth="2.5" strokeDasharray="7 6" />
                <line x1={ox} y1={oy} x2={dx} y2={dy} stroke="var(--primary)" strokeWidth="2.5" strokeDasharray="40 2" opacity="0.55" />
                <circle cx={ox} cy={oy} r={8} fill="var(--surface)" stroke="var(--primary)" strokeWidth="3" />
                <circle cx={dx} cy={dy} r={8} fill="var(--accent)" stroke="var(--surface)" strokeWidth="3" />
                {l.vessel && (
                  <g transform={`translate(${mx} ${my})`}>
                    <circle r={20} fill="var(--accent-soft)">
                      <animate attributeName="r" values="10;26;10" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                    <circle r={10} fill="var(--accent)" stroke="var(--surface)" strokeWidth="3" />
                  </g>
                )}
              </svg>
              {[[ox, oy, origin, "var(--primary)"], [dx, dy, dest, "var(--warn)"]].map(([x, y, label, color], i) => (
                <div key={i} style={{ position: "absolute", left: (x / W) * 100 + "%", top: (y / H) * 100 + "%" }}>
                  <div style={{ width: 0, height: 0, margin: "0 auto", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: `7px solid ${color}` }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color, textAlign: "center", background: "var(--surface)", padding: "0 4px", borderRadius: 5 }}>{label}</div>
                </div>
              ))}
              <div className="row faint" style={{ position: "absolute", right: 14, top: 10, gap: 5 }}><MapPin size={13} /> live telemetry · noise-added demo</div>
            </div>

            <div className="panel-pad">
              <div className="row" style={{ gap: 18, flexWrap: "wrap", alignItems: "center" }}>
                <div className="row" style={{ gap: 12 }}>
                  <span className="icon-tile" style={{ width: 34, height: 34, borderRadius: 9 }}><Container size={16} /></span>
                  <div style={{ fontSize: 13 }}>
                    <div className="mono" style={{ fontWeight: 700 }}>{l.container_no}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>Vessel {l.vessel}</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  {TIMELINE.map((t, i) => (
                    <span key={t} className="row" style={{ gap: 4 }}>
                      <Badge tone={i <= idx ? "good" : "neutral"}>{t}</Badge>
                      {i < TIMELINE.length - 1 && <ChevronRight size={12} className="faint" />}
                    </span>
                  ))}
                </div>
                <div className="spacer row">
                  <span className="faint small row" style={{ gap: 5 }}><FileText size={12} /> B/L on file</span>
                  <span className="faint small row" style={{ gap: 5 }}><Clock3 size={12} /> last ping {timeAgo(l.eta)}</span>
                  <Link to={`/deals/${l.deal_id}`} className="btn btn-ghost btn-sm">Open deal <ChevronRight size={13} /></Link>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}