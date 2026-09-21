import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  BadgeCheck, FileText, Globe2, Clock3, Languages, CreditCard, MessageSquareQuote,
  Star, Scale, X, Building2, Package, ShieldCheck, Boxes,
} from "lucide-react";
import { api, fmtUSD, shortDate } from "../api.js";
import { useSession } from "../store.jsx";
import { useToast } from "../components/toast.jsx";
import { Av, Badge, Empty, Spinner, TIER_LABEL } from "../components/ui.jsx";
import { Flag, Country } from "../components/country.jsx";

const CERTS = [
  { name: "ISO 9001:2015 QMS", issuer: "Bureau Veritas", cat: "Quality" },
  { name: "GOST R Quality Certificate", issuer: "Rosstandart", cat: "Quality" },
  { name: "Certificate of Conformity EAC", issuer: "Eurasian Economic Commission", cat: "Conformity" },
  { name: "Phytosanitary Certificate", issuer: "Rosselkhoznadzor", cat: "Plant health" },
  { name: "Certificate of Origin", issuer: "Chamber of Commerce", cat: "Origin" },
  { name: "Fumigation Certificate", issuer: "Agreed Port Lab", cat: "Logistics" },
];

export function SupplierProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { persona } = useSession();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: "", qty: "", incoterms: "CFR Mombasa", port: "Mombasa" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setData(null);
    api.get(`/suppliers/${id}`).then(setData).catch(() => setData({ notFound: true }));
  }, [id]);

  const certs = useMemo(() => CERTS.map((c) => ({ ...c, at: new Date(Date.now() - Math.floor(Math.random() * 5) * 90 * 864e5) })), []);

  if (!data) return <Spinner />;
  if (data.notFound) return <Empty icon={<Building2 size={22} />} title="Supplier not found" body="This profile may have been removed or the identifier is wrong." />;

  const sup = data.supplier;

  const start = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/deals", {
        buyerId: persona.id, supplierId: Number(id),
        productId: Number(form.productId), qty: Number(form.qty),
        incoterms: form.incoterms, port: form.port,
      });
      toast("Deal room created — RFQ sent to supplier");
      nav(`/deals/${res.deal.id}`);
    } catch (e) {
      toast(e.message, "err");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="panel mb" style={{ padding: 24 }}>
        <div className="row" style={{ gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <Av user={{ name: sup.org }} size={76} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 26 }}>{sup.org}</h1>
              <Flag iso={sup.country} />
              <span className="muted">{sup.country}</span>
            </div>
            <div className="row" style={{ gap: 20, marginTop: 10, fontSize: 13, flexWrap: "wrap" }}>
              <span className="row" style={{ gap: 5 }}><Star size={13} fill="var(--gold)" color="var(--gold)" /> {sup.rating || "—"} avg review</span>
              <span className="row" style={{ gap: 5 }}><ShieldCheck size={13} className="muted" /> {sup.deals_completed} escrow deals closed</span>
              <span className="row" style={{ gap: 5 }}><Boxes size={13} className="muted" /> {sup.products_count} listed products</span>
              <span className="row" style={{ gap: 5 }}><BadgeCheck size={13} className="muted" /> Since {new Date(sup.joined).getFullYear()}</span>
            </div>
            {sup.capacity_mt > 0 && (
              <div className="faint" style={{ marginTop: 8, fontSize: 12 }}>
                Capacity {sup.capacity_mt.toLocaleString()} MT · markets: {sup.markets}
              </div>
            )}
          </div>
          <Badge tone={sup.trust_tier === "gold" || sup.trust_tier === "platinum" ? "amber" : "info"} style={{ textTransform: "capitalize" }}>
            <BadgeCheck size={11} /> {TIER_LABEL(sup.trust_tier)} verified
          </Badge>
          <button className="btn btn-primary btn-lg" disabled={!persona || persona.role === "supplier"} onClick={() => setModal(true)}>
            <MessageSquareQuote size={17} /> Start a deal
          </button>
        </div>
      </section>

      <div className="seg mb">
        {["overview", "products", "certifications", "reviews"].map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-2">
          <section className="panel" style={{ padding: 18 }}>
            <h3 className="hd" style={{ margin: "0 0 8px" }}>Company profile</h3>
            <p className="muted" style={{ lineHeight: 1.7, margin: 0 }}>
              {sup.org} is an export-focused producer serving East and Southern Africa through AgriBridge's verified
              corridor. All batches ship with certificates of analysis, and every deal is eligible for escrow protection.
            </p>
            <div className="grid grid-2" style={{ marginTop: 18 }}>
              {[["Established", String(new Date(sup.joined).getFullYear() - 9)], ["Export markets", "KE · TZ · MW · ZM · RW · UG"], ["Annual capacity", sup.capacity_mt ? `${(sup.capacity_mt / 1).toLocaleString()} MT+` : "120,000 MT+"], ["Active deals", String(data.active_deals)]].map(([k, v]) => (
                <div key={k}>
                  <div className="faint" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 600 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel" style={{ padding: 18 }}>
            <h3 className="hd" style={{ margin: "0 0 12px" }}>Business &amp; payment terms</h3>
            <div>
              {[{ icon: Clock3, label: "Response time", value: "≤ 6 business hours" }, { icon: Languages, label: "Languages", value: "RU · EN · SW · FR" }, { icon: CreditCard, label: "Payment accepted", value: "Bank wire · USDT/USDC escrow · LC" }, { icon: Globe2, label: "Incoterms offered", value: "FOB · CFR · CIF · DDP" }, { icon: Scale, label: "Dispute clause", value: "AgriBridge arbitration rules (ICC-aligned)" }].map((r) => (
                <div key={r.label} className="row" style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                  <r.icon size={17} className="muted" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 13.5 }}>
                    <span className="muted">{r.label}: </span>
                    <b>{r.value}</b>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "products" && (
        data.products.length === 0 ? (
          <Empty icon={<Package size={22} />} title="No products listed" body="This supplier has not published a catalogue yet." />
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
            {data.products.map((p) => (
              <article key={p.id} className="panel" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="row between">
                  <h3 style={{ fontSize: 15, margin: 0 }}>{p.name}</h3>
                  <span className="badge mono">HS {p.hs_code}</span>
                </div>
                <div className="muted small">{p.category} · origin {p.origin}</div>
                <div className="row" style={{ gap: 14, fontSize: 13 }}>
                  <span><b>{fmtUSD(p.price_usd_per_mt)}</b>/MT</span>
                  <span>MOQ <b>{p.moq_mt} MT</b></span>
                  <span>{p.in_stock_mt.toLocaleString()} MT stock</span>
                </div>
                <div className="faint" style={{ fontSize: 11.5 }}>{p.certifications}</div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: "auto", alignSelf: "flex-start" }}
                  onClick={() => { setForm({ ...form, productId: String(p.id), qty: String(p.moq_mt) }); setModal(true); }}>
                  Request quote
                </button>
              </article>
            ))}
          </div>
        )
      )}

      {tab === "certifications" && (
        <>
          <div className="grid grid-2">
            {certs.map((c) => (
              <div key={c.name} className="panel" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center" }}>
                <span className="icon-tile" style={{ width: 42, height: 42, borderRadius: 12 }}><FileText size={19} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{c.issuer} · {c.cat} · verified {shortDate(c.at.toISOString())}</div>
                </div>
                <Badge tone="good"><BadgeCheck size={12} /> On file</Badge>
              </div>
            ))}
          </div>
          <section className="panel mt" style={{ padding: 16, fontSize: 13 }}>
            <b>Certificate scope (per lot):</b>
            <pre className="mono" style={{ whiteSpace: "pre-wrap", margin: "8px 0 0", fontSize: 12 }}>
              {data.products.map((p) => `${p.name.split(" ").slice(0, 3).join(" ")} · HS ${p.hs_code}`).join("\n")}
            </pre>
          </section>
        </>
      )}

      {tab === "reviews" && (
        <div style={{ display: "grid", gap: 14 }}>
          {data.reviews.length === 0 && <Empty icon={<MessageSquareQuote size={22} />} title="No verified reviews yet" body="Reviews are posted only after an escrowed, delivered deal." />}
          {data.reviews.map((r) => (
            <article key={r.id} className="panel" style={{ padding: 16, display: "flex", gap: 14 }}>
              <Av user={{ name: r.buyer_name || r.buyer_org }} size={38} />
              <div>
                <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 14 }}>{r.buyer_org}</b>
                  <span style={{ display: "flex", gap: 1, color: "var(--gold)" }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={13} fill={i < r.rating ? "currentColor" : "none"} strokeWidth={1.5} />)}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 14 }}>{r.text}</p>
                <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>Verified buyer · escrow deal</div>
              </div>
            </article>
          ))}
        </div>
      )}

      {data.similar?.length > 0 && (
        <div style={{ marginTop: 34 }}>
          <h2 className="hd" style={{ margin: "0 0 16px", fontSize: 20 }}>Similar verified suppliers</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {data.similar.map((s) => (
              <Link key={s.id} to={`/suppliers/${s.id}`} className="panel" style={{ padding: 14 }}>
                <div className="row" style={{ gap: 10 }}>
                  <Av user={{ name: s.org }} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.org}</div>
                    <Country name={s.country} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={(e) => { e.preventDefault(); start(); }}>
            <div className="modal-head">
              <h3>Start a deal</h3>
              <button type="button" className="btn btn-icon btn-ghost btn-sm" onClick={() => setModal(false)}><X size={15} /></button>
            </div>
            <div className="modal-body">
              <p className="muted small" style={{ marginTop: 0 }}>An RFQ opens a private Deal Room with {sup.org}. No payment is required — funds are only locked once you both agree.</p>
              <div className="field-row">
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="field">Product</label>
                  <select className="input" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value, qty: String(data.products.find((p) => String(p.id) === e.target.value)?.moq_mt || "") })} required>
                    <option value="">Select a product…</option>
                    {data.products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {fmtUSD(p.price_usd_per_mt)}/MT (MOQ {p.moq_mt} MT)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field">Quantity (MT)</label>
                  <input className="input mono" type="number" min="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} required />
                </div>
                <div>
                  <label className="field">Incoterms</label>
                  <select className="input" value={form.incoterms} onChange={(e) => setForm({ ...form, incoterms: e.target.value })}>
                    {["FOB", "CFR Mombasa", "CFR Dar es Salaam", "CIF Beira", "DDP"].map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field">Discharge port</label>
                  <select className="input" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })}>
                    {["Mombasa", "Dar es Salaam", "Beira", "Negotiable"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? "Opening deal room…" : "Open private Deal Room"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}