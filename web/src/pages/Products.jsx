import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ShieldAlert, ShieldCheck, Package, Loader2 } from "lucide-react";
import { api, fmtUSD, fmtNum } from "../api.js";
import { Empty, Badge } from "../components/ui.jsx";
import { Flag } from "../components/country.jsx";

const CATS = ["Fertilizer", "Agro-Chemicals", "Machinery", "Seeds"];
const DESTINATIONS = ["Tanzania", "Kenya", "Uganda", "Malawi", "Zambia", "Rwanda"];

export function Products() {
  const [params] = useSearchParams();
  const [cat, setCat] = useState(params.get("category") || "");
  const [q, setQ] = useState("");
  const [dest, setDest] = useState("Tanzania");
  const [products, setProducts] = useState([]);
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const s = new URLSearchParams();
    if (cat) s.set("category", cat);
    api.get(`/products?${s}`)
      .then((r) => setProducts(r.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cat]);

  useEffect(() => {
    setChecks({});
    products.slice(0, 24).forEach((p) => {
      api.get(`/compliance/hs?code=${encodeURIComponent(p.hs_code)}&dest=${encodeURIComponent(dest)}`)
        .then((c) => setChecks((m) => ({ ...m, [p.id]: c })))
        .catch(() => {});
    });
  }, [dest, cat, products.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = products.filter((p) => (q ? (p.name + p.hs_code).toLowerCase().includes(q.toLowerCase()) : true));

  return (
    <div>
      <section className="hero" style={{ padding: "26px 0 20px" }}>
        <div className="hero-eyebrow"><Package size={13} /> Marketplace catalogue</div>
        <h1 style={{ fontSize: 30 }}>Every lot cleared against the <em>destination list</em> before you quote.</h1>
        <p className="lede">HS-level goods screening runs live, per consignment, against sanctions and export-control lists for the receiving market.</p>
      </section>

      <div className="row mb" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="seg">
          <button className={cat === "" ? "on" : ""} onClick={() => setCat("")}>All</button>
          {CATS.map((c) => (
            <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <select className="input" value={dest} onChange={(e) => setDest(e.target.value)} style={{ width: "auto", marginLeft: "auto" }}>
          {DESTINATIONS.map((d) => <option key={d} value={d}>Deliver to: {d}</option>)}
        </select>
      </div>

      <form className="search mb" style={{ maxWidth: 460 }} onSubmit={(e) => e.preventDefault()}>
        <Search size={15} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by product or HS code…" />
      </form>

      {loading ? (
        <div className="loading"><Loader2 size={20} className="spin" style={{ animation: "sp 1s linear infinite" }} /></div>
      ) : filtered.length === 0 ? (
        <Empty icon={<Package size={22} />} title="No products match" body="Try a different category, term, or destination." />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))" }}>
          {filtered.map((p) => {
            const c = checks[p.id];
            const blocked = c && c.verdict === "block";
            return (
              <article key={p.id} className="panel" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="row between">
                  <h3 style={{ fontSize: 15, margin: 0 }}>{p.name}</h3>
                  <span className="badge mono">{p.hs_code}</span>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <Flag iso={p.country} />
                  <span className="muted small">{p.supplier_org} · {p.country}</span>
                </div>
                <div className="row" style={{ gap: 16, fontSize: 13.5 }}>
                  <span><b>{fmtUSD(p.price_usd_per_mt)}</b>/MT</span>
                  <span className="muted">MOQ {fmtNum(p.moq_mt)} MT</span>
                  <span className="muted">{fmtNum(p.in_stock_mt)} MT stock</span>
                </div>
                <div className="row" style={{ marginTop: "auto" }}>
                  {!c ? (
                    <span className="muted small row" style={{ gap: 6 }}><Loader2 size={12} /> Screening {p.hs_code} → {dest}</span>
                  ) : blocked ? (
                    <Badge tone="bad"><ShieldAlert size={12} /> Flagged for {dest}</Badge>
                  ) : (
                    <Badge tone="good"><ShieldCheck size={12} /> Clear for {dest} · {c.verdict === "review" ? "review" : "allowed"}</Badge>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}