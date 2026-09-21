import { useMemo } from "react";
import { tierMeta, personaInitials, STATUS_META } from "../api.js";
import { Flag } from "./country.jsx";

export function Panel({ title, sub, pad, actions, children, className = "" }) {
  if (title) {
    return (
      <section className={`panel ${className}`}>
        <div className="panel-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {actions && <div className="spacer">{actions}</div>}
        </div>
        <div className={pad === false ? "" : "panel-pad"}>{children}</div>
      </section>
    );
  }
  return <section className={`panel ${pad === false ? "" : "panel-pad"} ${className}`}>{children}</section>;
}

export function Stat({ label, value, delta, hint, tone, mono }) {
  const deltaCls =
    tone === "good" ? "good" : tone === "bad" ? "bad" : delta != null && Math.sign(Number(String(delta).replace(/[^-\d.]/g, ""))) < 0 ? "bad" : "good";
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className={`value ${mono ? "mono" : ""}`}>{value}</div>
      {(delta != null || hint) && (
        <div className="hint">
          {delta != null && <span className={`badge ${deltaCls}`}>{delta}</span>}
          {hint && <span style={{ marginLeft: 8 }}>{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function Badge({ children, tone = "neutral", mono }) {
  return <span className={`badge ${tone} ${mono ? "mono" : ""}`}>{children}</span>;
}

export function TierRing({ tier, size = "sm" }) {
  const meta = tierMeta[tier] || tierMeta.silver;
  const cls = tier === "platinum" ? "tier-platinum" : tier === "gold" ? "tier-gold" : tier === "silver" ? "tier-silver" : "tier-bronze";
  return <span className={`ring ${cls}`} title={meta.label}>{tier.slice(0, 2).toUpperCase()}</span>;
}

export const TIER_LABEL = (t) => (tierMeta[t] || { label: t }).label;

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, tone: "neutral" };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export function Av({ user, size = 34 }) {
  const hue = useMemo(() => {
    let h = 142;
    if (user) for (const c of user.name || user.org || "") h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }, [user]);
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${hue} 45% 42%), hsl(${(hue + 40) % 360} 55% 28%))` }}
      title={user?.name || user?.org}
    >
      {personaInitials(user || { name: "??" })}
    </span>
  );
}

export function OrgCell({ org, country, tier }) {
  return (
    <div className="row" style={{ minWidth: 0 }}>
      {country && <Flag iso={country} />}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org}</div>
        {tier && <div style={{ fontSize: 11, color: "var(--faint)" }}>{TIER_LABEL(tier)} verified</div>}
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="loading">
      <span className="spin" />
      <span className="muted">Loading…</span>
    </div>
  );
}

export function Empty({ icon, title, body, action }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div className="icon-tile" style={{ margin: "0 auto 14px", width: 52, height: 52, borderRadius: 14 }}>
        {icon}
      </div>
      <h4 style={{ margin: "0 0 4px" }}>{title}</h4>
      <p className="muted" style={{ margin: "0 0 14px", maxWidth: 380, marginInline: "auto" }}>{body}</p>
      {action}
    </div>
  );
}

export function Skeleton({ rows = 3 }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />
      ))}
    </div>
  );
}

export function Money({ value, small }) {
  return <span className={small ? "mono small" : "mono"} style={{ fontWeight: 600 }}>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0)}</span>;
}