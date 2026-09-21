import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Handshake, Briefcase } from "lucide-react";
import { api, fmtUSD, fmtNum, timeAgo } from "../api.js";
import { StatusBadge, Empty, Money } from "../components/ui.jsx";
import { Flag } from "../components/country.jsx";
import { useSession } from "../store.jsx";

const FILTERS = ["", "negotiation", "funded", "shipped", "delivered", "disputed", "closed"];

export function Deals() {
  const { persona } = useSession();
  const navigate = useNavigate();
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("");
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const s = new URLSearchParams();
    s.set("role", role);
    if (status) s.set("status", status);
    api.get(`/deals?${s}`)
      .then((r) => setDeals(r.deals))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role, status]);

  const label =
    role === "supplier" ? "As supplier" : role === "broker" ? "Brokered" : role === "all" ? persona?.role === "supplier" ? "As supplier" : persona?.role === "broker" ? "Brokered" : "As buyer" : "As buyer";

  return (
    <div>
      <section className="hero" style={{ padding: "26px 0 20px" }}>
        <div className="hero-eyebrow"><Handshake size={13} /> Deal room</div>
        <h1 style={{ fontSize: 30 }}>Negotiate privately, <em>fund through escrow</em>, release on delivery.</h1>
        <p className="lede">Every deal moves through the same state machine: quote → contract → funded → shipped → delivered → closed. Nothing is trust-me.</p>
      </section>

      <div className="row mb" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="seg">
          <button className={role === "all" ? "on" : ""} onClick={() => setRole("all")}>All</button>
          <button className={role === "buyer" ? "on" : ""} onClick={() => setRole("buyer")}>Buyer</button>
          <button className={role === "supplier" ? "on" : ""} onClick={() => setRole("supplier")}>Supplier</button>
        </div>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "auto", marginLeft: "auto" }}>
          {FILTERS.map((f) => <option key={f} value={f}>{f ? f[0].toUpperCase() + f.slice(1) : "All statuses"}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => navigate("/suppliers")}><Plus size={15} /> New deal</button>
      </div>

      <section className="panel" style={{ padding: 6 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Deal</th>
              <th>Goods</th>
              <th>Counterparty</th>
              <th className="num">Value</th>
              <th>Escrow</th>
              <th>Status</th>
              <th className="num"></th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => {
              const from = role === "supplier" || label.startsWith("As supplier") && role === "all" ? d.buyer_org : d.supplier_org;
              return (
                <tr key={d.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/deals/${d.id}`)}>
                  <td>
                    <span className="mono" style={{ fontWeight: 600 }}>{d.code}</span>
                    <div className="faint" style={{ fontSize: 11 }}>{timeAgo(d.created_at)}</div>
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.product?.name}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{fmtNum(d.qty_mt)} MT · {d.incoterms?.replace(/^CFR |^CIF /, "")}</div>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <Flag iso={d.supplier_country} />
                      <span>{from}</span>
                    </div>
                  </td>
                  <td className="num"><Money value={d.total_usd} /></td>
                  <td>{d.escrow_status === "locked" ? <StatusBadge status="funded" /> : d.escrow_status === "released" ? <StatusBadge status="delivered" /> : <span className="faint">open</span>}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td className="num"><button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/deals/${d.id}`); }}>Open</button></td>
                </tr>
              );
            })}
            {!loading && deals.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <Empty icon={<Briefcase size={22} />} title="No deals here yet" body={`Start one from a supplier profile to begin the first escrowed negotiation. View as: ${label}.`} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="loading"><span className="spin" /></div>}
      </section>

      <p className="faint mt" style={{ fontSize: 12 }}>
        Tip: switch the viewpoint in the sidebar to see each party's deal list.
      </p>
    </div>
  );
}