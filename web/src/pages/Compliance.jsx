import { useState } from "react";
import { ShieldAlert, ShieldCheck, SearchCheck, PackageX, FileCheck2, ListChecks } from "lucide-react";
import { api } from "../api.js";
import { Badge } from "../components/ui.jsx";

const DESTINATIONS = ["Tanzania", "Kenya", "Uganda", "Malawi", "Zambia", "Rwanda"];

const toneOf = (v) => (v === "block" ? "bad" : v === "review" ? "warn" : "good");

export function Compliance() {
  const [name, setName] = useState("AgroGran Rus");
  const [party, setParty] = useState(null);
  const [hs, setHs] = useState("3105.20");
  const [dest, setDest] = useState("Tanzania");
  const [goods, setGoods] = useState(null);
  const [busy, setBusy] = useState(false);

  const screenParty = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await api.get(`/compliance/screen?name=${encodeURIComponent(name.trim() || "AgroGran Rus")}`).catch(() => null);
    setParty(r);
    setBusy(false);
  };

  const checkGoods = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await api.get(`/compliance/hs?code=${encodeURIComponent(hs.trim() || "3105.20")}&dest=${encodeURIComponent(dest)}`).catch(() => null);
    setGoods(r);
    setBusy(false);
  };

  return (
    <div>
      <section className="hero" style={{ padding: "26px 0 20px" }}>
        <div className="hero-eyebrow"><SearchCheck size={13} /> Compliance engine</div>
        <h1 style={{ fontSize: 30 }}>Screened before it trades, <em>re-screened as it moves</em>.</h1>
        <p className="lede">
          Party screening against EU / US OFAC / UK / UN lists, plus HS × destination goods checks,
          run on onboarding, on every fund and on every shipment — with the audit trail retained.
        </p>
      </section>

      <section className="grid grid-2">
        <form className="panel mt" style={{ padding: 20 }} onSubmit={screenParty}>
          <div className="row" style={{ gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>
            <SearchCheck size={14} /> Party screening
          </div>
          <h3 className="hd" style={{ margin: "6px 0 14px", fontSize: 18 }}>Screen a company or individual</h3>
          <label className="field">Legal name / company</label>
          <input className="input mb" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AgroGran Rus" />
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Checking…" : "Run screening"}</button>
            {["Viktor Selim", "Asia Bank for Trade", "NordAgrar GmbH", "UralChem Agro"].map((s) => (
              <button type="button" key={s} className="btn btn-ghost btn-sm" onClick={() => setName(s)}>{s}</button>
            ))}
          </div>

          {party && (
            <div className="panel mt" style={{ padding: 16, borderColor: party.verdict === "block" ? "var(--danger)" : party.verdict === "review" ? "var(--warn)" : "var(--success)", borderWidth: 1.5 }}>
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                {party.verdict === "block" ? <ShieldAlert size={20} style={{ color: "var(--danger)" }} /> : <ShieldCheck size={20} style={{ color: "var(--success)" }} />}
                <b style={{ fontSize: 16 }}>{party.name}</b>
                <Badge tone={toneOf(party.verdict)} mono>{String(party.verdict).toUpperCase()} · risk {party.risk}%</Badge>
              </div>
              {party.matched && (
                <div className="mt" style={{ fontSize: 13, background: "var(--danger-soft)", borderRadius: 10, padding: "10px 14px", color: "var(--ink)" }}>
                  <b>Match:</b> {party.matched.name} (score {party.matched.score}%) on {party.matched.lists.join(", ")}
                </div>
              )}
              <p className="muted small" style={{ margin: "10px 0 0" }}>{party.note}</p>
            </div>
          )}
        </form>

        <form className="panel mt" style={{ padding: 20 }} onSubmit={checkGoods}>
          <div className="row" style={{ gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>
            <PackageX size={14} /> Goods check
          </div>
          <h3 className="hd" style={{ margin: "6px 0 14px", fontSize: 18 }}>HS code × destination</h3>
          <div className="field-row">
            <div>
              <label className="field">HS code</label>
              <input className="input mono" value={hs} onChange={(e) => setHs(e.target.value)} placeholder="3105.20" />
            </div>
            <div>
              <label className="field">Destination</label>
              <select className="input" value={dest} onChange={(e) => setDest(e.target.value)}>
                {DESTINATIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="row mt" style={{ gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Checking…" : "Check goods"}</button>
            {["3102.10", "3105.20", "3808.93", "9306.30"].map((c) => (
              <button type="button" key={c} className="btn btn-ghost btn-sm" onClick={() => setHs(c)}>{c}</button>
            ))}
          </div>

          {goods && (
            <div className="panel mt" style={{ padding: 16, borderColor: goods.blocked ? "var(--danger)" : "var(--success)", borderWidth: 1.5 }}>
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>{goods.hs}</span>
                <Badge tone={toneOf(goods.verdict)} mono>{String(goods.verdict).toUpperCase()}</Badge>
                <span className="muted small">{goods.category}</span>
              </div>
              <div className="mt small" style={{ display: "grid", gap: 4 }}>
                {goods.reasons.map((r, i) => (
                  <div key={i} className="row" style={{ gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: goods.blocked ? "var(--danger)" : "var(--success)", flex: "none" }} />
                    {r}
                  </div>
                ))}
              </div>
              {!goods.blocked && (
                <div className="faint small mt">
                  Agricultural fertiliser / agro-chemical trade to this market is permitted under general licence
                  regimes (UK &amp; EU) — verify batch-level paperwork per shipment.
                </div>
              )}
            </div>
          )}
        </form>
      </section>

      <section className="panel mt2" style={{ padding: 20, fontSize: 13.5 }}>
        <h3 className="hd row" style={{ margin: "0 0 10px", gap: 8 }}><FileCheck2 size={16} /> How onboarding enforces this</h3>
        <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          <li>KYC/KYB document intake → UBO disclosure for every shareholder above 10%.</li>
          <li>Party screened on every open list plus soft-duplicate review for corporate groups.</li>
          <li>HS code × destination checked before an RFQ can go live.</li>
          <li>Re-screen every 90 days and on every transaction; audit trail retained 5+ years.</li>
          <li>Any match in the <b>block</b> zone freezes the deal and raises a compliance alert.</li>
        </ol>
        <div className="row mt" style={{ gap: 8, color: "var(--muted)" }}>
          <ListChecks size={15} />
          <span className="small">Because screening is automatic, the corridor's decision latency drops from days to minutes.</span>
        </div>
      </section>
    </div>
  );
}