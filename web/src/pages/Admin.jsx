import { useEffect, useState } from "react";
import { ShieldCheck, Users2, Handshake, Banknote, Lock, AlertOctagon, Scale } from "lucide-react";
import { api, fmtUSD, fmtK, shortDate } from "../api.js";
import { KYCBadge, SanctionBadge, StatusPill } from "../components/badges.jsx";
import { Country } from "../components/country.jsx";

export function Admin() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/admin/overview").then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="loading"><span className="spin" /></div>;
  const s = data.stats;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Ops & compliance</div>
          <h1>Admin panel</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>Sanctions screening, party management, disputes and finance.</p>
        </div>
        <span className="pill" style={{ color: "var(--c-success)", background: "var(--c-success-soft)" }}>
          <ShieldCheck size={13} /> Engine: live screening <span style={{ opacity: 0.6 }}>(demo list)</span>
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 22 }}>
        {[[Users2, "Parties", s.users], [Handshake, "Deals", s.deals], [Banknote, "GMV", fmtK(s.gmv)], [Lock, "Locked", fmtUSD(s.locked)], [AlertOctagon, "Open disputes", s.open_disputes]].map(([I, l, v]) => (
          <div key={l} className="stat">
            <div className="stat-label"><I size={15} /> {l}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{v}</div>
            {l === "GMV" && <div className="stat-sub">tek crossing the corridor</div>}
            {l === "Locked" && <div className="stat-sub">in escrow wallets</div>}
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 22 }}>
        <div className="card">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><AlertOctagon size={16} style={{ color: "var(--c-amber)" }} /> Compliance feed</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {data.compliance_feed.map((c, i) => {
              const ok = c.ok !== "info";
              return (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 12.5, alignItems: "flex-start" }}>
                  <span className="pill" style={ok ? { color: "var(--c-success)", background: "var(--c-success-soft)", flexShrink: 0 } : c.ok === "info" ? { color: "var(--c-info)", background: "var(--c-info-soft)", flexShrink: 0 } : { color: "var(--c-danger)", background: "var(--c-danger-soft)", flexShrink: 0 }}>
                    {ok ? "clear" : c.ok}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.org}</div>
                    <div className="muted">{c.note || `Screened ${shortDate(c.checked)}`} {c.type === "supplier" && c.risk > 0 && <span>· risk {c.risk}%</span>}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 6 }}>
          <h3 style={{ padding: "14px 16px 6px" }}>Registered parties</h3>
          <table className="tbl">
            <thead><tr><th>Org</th><th>Role</th><th>KYC</th><th>Sanctions</th></tr></thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.org}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}><Country name={u.country} flag={false} /> · {u.tier}</div>
                  </td>
                  <td style={{ textTransform: "capitalize", fontSize: 12.5 }}>{u.role}</td>
                  <td><KYCBadge kyc={u.kyc} /></td>
                  <td><SanctionBadge verdict={u.sanctions} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 6 }}>
          <h3 style={{ padding: "14px 16px 6px" }}>Finance & disputes</h3>
          <div className="tbl" style={{ display: "grid", gap: 4, paddingBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", fontSize: 13 }}>
              <span className="muted">Revenue (est. 1.5% take rate)</span>
              <strong>{fmtUSD(Math.round(s.gmv * 0.015))}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", fontSize: 13 }}>
              <span className="muted">Escrow released to suppliers</span>
              <strong>{fmtUSD(s.released)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", fontSize: 13 }}>
              <span className="muted"><Scale size={12} /> Mediation rulings</span>
              <strong>{data.compliance_feed.length > 0 ? "ICC-aligned rules" : "—"}</strong>
            </div>
            <div style={{ padding: "6px 16px" }}>
              {data.recent_transactions.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid var(--c-ink-50)", fontSize: 12.5 }}>
                  <span className="mono" style={{ fontWeight: 600 }}>{t.code}</span>
                  <span style={{ textTransform: "capitalize" }} className="muted">{t.kind}</span>
                  <StatusPill status={t.status === "confirmed" ? "delivered" : "funded"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}