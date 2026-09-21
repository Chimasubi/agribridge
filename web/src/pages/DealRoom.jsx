import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Send, FileText, UploadCloud, Lock, Unlock, ShieldAlert, CheckCircle2,
  MessageSquare, Languages, Gavel, Truck, AlertTriangle, ArrowLeft, Check, Landmark,
} from "lucide-react";
import { api, fmtUSD, timeAgo, shortDate } from "../api.js";
import { useSession } from "../store.jsx";
import { useToast } from "../components/toast.jsx";
import { StatusBadge, Badge, Av, Empty } from "../components/ui.jsx";
import { Flag } from "../components/country.jsx";

const LANG_LABEL = { en: "English", ru: "Русский", sw: "Kiswahili", fr: "Français" };
const FUNDING = ["Bank wire", "Stablecoin (USDT)", "Stablecoin (USDC)", "Letter of Credit", "Mobile Money"];

const STEPS = Object.freeze([
  { key: "rfq", label: "RFQ sent" },
  { key: "quote", label: "Quote received" },
  { key: "contract", label: "Contract signed" },
  { key: "fund", label: "Escrow funded" },
  { key: "ship", label: "Goods shipped" },
  { key: "customs", label: "Cleared customs" },
  { key: "deliver", label: "Delivered & released" },
]);

const ACTION_TONE = {
  quote: "Quote submitted — deal is in negotiation",
  contract: "Contract confirmed",
  fund: "Escrow funded and locked",
  ship: "Shipment booked and on board",
  clear: "Customs cleared",
  confirm: "Delivery confirmed — escrow released",
  close: "Deal closed",
  dispute: "Dispute raised — funds frozen",
};

export function DealRoom() {
  const { id } = useParams();
  const { persona } = useSession();
  const toast = useToast();
  const [deal, setDeal] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [text, setText] = useState("");
  const [seeTr, setSeeTr] = useState(true);
  const [method, setMethod] = useState(FUNDING[1]);
  const [sending, setSending] = useState(false);
  const chatRef = useRef(null);

  const load = () =>
    api.get(`/deals/${id}`).then((res) => setDeal(res.deal)).catch(() => setNotFound(true));
  useEffect(() => { load(); window.scrollTo(0, 0); /* eslint-disable-next-line */ }, [id]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight }); }, [deal?.messages?.length]);

  if (notFound) return <Empty icon={<Landmark size={22} />} title="Deal not found" body="The deal room may have been archived or the identifier is wrong." />;
  if (!deal) return <div className="loading"><span className="spin" /></div>;

  const myRole = (() => {
    if (deal.buyer?.id === persona?.id) return "buyer";
    if (deal.supplier?.id === persona?.id) return "supplier";
    if (deal.broker?.id === persona?.id) return "broker";
    return null;
  })();

  const act = async (action, extra = {}) => {
    if (!persona) return toast("Pick a viewpoint first", "err");
    setSending(true);
    try {
      const res = await api.post(`/deals/${id}/advance`, { action, actorId: persona.id, ...extra });
      setDeal(res.deal);
      toast(ACTION_TONE[action] || "Deal updated");
    } catch (e) {
      toast(e.message, "err");
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    if (!text.trim() || !persona) return;
    try {
      await api.post(`/deals/${id}/messages`, { senderId: persona.id, body: text, lang: "en" });
      setText("");
      load();
    } catch (e) {
      toast(e.message, "err");
    }
  };

  const esc = deal.escrow;
  const doneKeys = new Set(deal.milestones.filter((m) => m.done).map((m) => m.key));
  const currentStep = STEPS.findIndex((s) => doneKeys.has(s.key));

  return (
    <div>
      <div className="row between mt" style={{ gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div className="mono faint" style={{ fontSize: 12.5 }}>{deal.code} · opened {shortDate(deal.created_at)}</div>
          <div className="row" style={{ gap: 12, marginTop: 4, flexWrap: "wrap" }}>
            <h1 className="hd" style={{ margin: 0, fontSize: 26 }}>{deal.product?.name}</h1>
            <StatusBadge status={deal.status} />
            {deal.dispute && (
              <Badge tone="bad"><Gavel size={11} /> Mediation requested</Badge>
            )}
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>
            {deal.qty_mt} MT · {fmtUSD(deal.unit_price_usd)}/MT · {deal.incoterms} · {deal.port} · HS {deal.product?.hs_code}
          </div>
        </div>
        <div className="row">
          {myRole === "buyer" && deal.status !== "disputed" && (
            <button className="btn btn-danger btn-sm" disabled={sending} onClick={() => act("dispute", { reason: "Buyer raises a dispute — requesting mediation." })}>
              <AlertTriangle size={14} /> Raise dispute
            </button>
          )}
          {(myRole === "broker" || persona?.role === "admin") && !["delivered", "closed", "funded", "shipped"].includes(deal.status) && (
            <button className="btn btn-ghost btn-sm" disabled={sending} onClick={() => act("contract")}><CheckCircle2 size={14} /> Confirm contract</button>
          )}
          <Link to="/deals" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Deals</Link>
        </div>
      </div>

      <div className="room-grid">
        <aside style={{ display: "grid", gap: 16 }}>
          <section className="panel" style={{ padding: 16 }}>
            <h3 className="hd" style={{ margin: "0 0 12px", fontSize: 14 }}>Parties</h3>
            {[{ who: "Buyer", u: deal.buyer, you: myRole === "buyer" }, { who: "Supplier", u: deal.supplier, you: myRole === "supplier" }, ...(deal.broker ? [{ who: "Broker", u: deal.broker, you: myRole === "broker" }] : [])].map((p) => (
              <div key={p.who} className="row" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <Av user={{ name: p.u?.org }} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.u?.org} {p.you && <span style={{ color: "var(--primary)" }}>· you</span>}
                  </div>
                  <div className="row" style={{ gap: 5, fontSize: 11.5 }}>{p.who} {p.u?.country && <Flag iso={p.u.country} size={14} />}</div>
                </div>
              </div>
            ))}
          </section>

          <section className="panel" style={{ padding: 16 }}>
            <h3 className="hd" style={{ margin: "0 0 10px", fontSize: 14 }}>Milestones</h3>
            <div>
              {STEPS.map((s, i) => {
                const done = doneKeys.has(s.key);
                return (
                  <div key={s.key} className={`ms ${done ? "done" : "todo"}`}>
                    <span className="ms-mark">{done ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
                    <div className="ms-body">
                      <div className="ms-label">{s.label}</div>
                      {done && <div className="ms-time">{(deal.milestones.find((m) => m.key === s.key)?.at) ? shortDate(deal.milestones.find((m) => m.key === s.key).at) : "done"}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel" style={{ padding: 16 }}>
            <div className="row between">
              <div className="faint" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em" }}>Transaction log</div>
              <StatusBadge status={esc.status === "locked" ? "funded" : esc.status === "released" ? "delivered" : deal.status} />
            </div>
            <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
              {deal.transactions.length === 0 && <span className="faint" style={{ fontSize: 12.5 }}>No transactions yet.</span>}
              {deal.transactions.map((t) => (
                <div key={t.id} className="row between" style={{ fontSize: 12.5 }}>
                  <span style={{ textTransform: "capitalize" }} className="muted">{t.kind}</span>
                  <span className="mono row" style={{ gap: 6 }}>{t.status === "confirmed" ? <Check size={12} style={{ color: "var(--success)" }} /> : null} {fmtUSD(t.amount_usd)}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="panel" style={{ display: "flex", flexDirection: "column", height: "72vh", padding: 0 }}>
          <div className="panel-head">
            <MessageSquare size={16} style={{ color: "var(--primary)" }} />
            <h3>Deal chat</h3>
            <div className="spacer">
              <button className={`btn btn-soft btn-sm ${seeTr ? "" : ""}`} onClick={() => setSeeTr((v) => !v)} style={{ backgroundColor: !seeTr ? "var(--surface-3)" : undefined, color: !seeTr ? "var(--muted)" : undefined }}>
                <Languages size={13} /> MT {seeTr ? "on" : "off"}
              </button>
            </div>
          </div>
          <div className="msgstream" ref={chatRef}>
            {deal.messages.length === 0 && (
              <div style={{ textAlign: "center", padding: 30 }}><Empty icon={<MessageSquare size={22} />} title="No messages yet" body="Say hello and confirm the specification before funding." /></div>
            )}
            {deal.messages.map((m, i) => {
              const me = m.sender_id === persona?.id;
              if (m.sender_role === "system" || m.to_translate === "sys") {
                return <div key={i} className="msg sys">{m.body}</div>;
              }
              return (
                <div key={i} className={`msg ${me ? "me" : "them"}`}>
                  {m.body}
                  <div className="msg-meta">{m.sender?.org} · {m.sender_role} · {timeAgo(m.ts)}</div>
                </div>
              );
            })}
          </div>
          <div className="row" style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", alignItems: "flex-end" }}>
            <textarea
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type in your language — translation happens automatically…"
              rows={2}
              style={{ flex: 1, resize: "none" }}
            />
            <button className="btn btn-primary" onClick={send} disabled={!text.trim()}><Send size={15} /></button>
          </div>
        </section>

        <aside style={{ display: "grid", gap: 16, alignSelf: "start" }}>
          <section className="panel" style={{ padding: 18, borderColor: esc.status === "locked" ? "var(--primary)" : "var(--border)", borderWidth: esc.status === "locked" ? 2 : 1, gridColumn: "1 / -1" }}>
            <div className="row between">
              <h3 className="hd row" style={{ margin: 0, gap: 8 }}>
                {esc.status === "locked" ? <Lock size={16} style={{ color: "var(--primary)" }} /> : esc.status === "released" ? <Unlock size={16} style={{ color: "var(--success)" }} /> : <Landmark size={16} style={{ color: "var(--faint)" }} />}
                Escrow
              </h3>
              <Badge tone={esc.status === "locked" ? "good" : esc.status === "released" ? "good" : "neutral"}>{esc.status === "locked" ? "Locked" : esc.status === "released" ? "Released" : "Open"}</Badge>
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, margin: "10px 0 2px" }}>
              {esc.amount_usd ? fmtUSD(esc.amount_usd) : fmtUSD(deal.total_usd)} <span className="muted" style={{ fontSize: 14 }}>USD</span>
            </div>
            <div className="faint small">Locked once buyer funds · auto-released on verified delivery</div>

            {deal.status === "negotiation" && myRole === "buyer" && esc.status === "open" && (
              <div className="stack mt" style={{ gap: 10 }}>
                <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {FUNDING.map((f) => <option key={f}>{f}</option>)}
                </select>
                <button className="btn btn-primary" disabled={sending} onClick={() => act("fund", { method })}>
                  <Lock size={15} /> Fund escrow · {fmtUSD(deal.total_usd)}
                </button>
              </div>
            )}

            {deal.status === "negotiation" && myRole === "supplier" && esc.status === "open" && (
              <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} disabled={sending} onClick={() => act("quote")}>
                Submit quote · {fmtUSD(deal.unit_price_usd)}/MT
              </button>
            )}

            {deal.status === "negotiation" && myRole === "buyer" && esc.status === "open" && (
              <div className="faint small mt">Awaiting supplier quote before funding is possible.</div>
            )}

            {deal.status === "funded" && (
              <div className="small muted mt row" style={{ gap: 6 }}>
                Funds locked via {esc.method}. Supplier is now authorised to ship.
              </div>
            )}

            {deal.status === "shipped" && (
              <div className="stack mt" style={{ gap: 8 }}>
                {myRole === "buyer" ? (
                  <>
                    <button className="btn btn-ghost" style={{ width: "100%" }} disabled={sending} onClick={() => act("clear")}>
                      <Truck size={15} /> Confirm customs cleared
                    </button>
                    <button className="btn btn-primary" style={{ width: "100%" }} disabled={sending} onClick={() => act("confirm")}>
                      <Unlock size={15} /> Confirm delivery → release escrow
                    </button>
                  </>
                ) : (
                  <div className="faint small">Awaiting buyer's arrival confirmation to release funds.</div>
                )}
              </div>
            )}

            {deal.status === "delivered" && (
              <Badge tone="good" style={{ marginTop: 12 }}><CheckCircle2 size={12} /> Payment auto-released {deal.milestones.find((m) => m.key === "deliver")?.at ? shortDate(deal.milestones.find((m) => m.key === "deliver").at) : ""}</Badge>
            )}

            {deal.status === "disputed" && (
              <div className="small row mt" style={{ gap: 6, color: "var(--danger)" }}>
                <ShieldAlert size={14} /> Funds frozen pending mediation.
              </div>
            )}
          </section>

          <section className="panel" style={{ padding: 16 }}>
            <h3 className="hd row" style={{ margin: "0 0 10px", gap: 8, fontSize: 14 }}><FileText size={15} /> Documents vault</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {deal.docs.length === 0 && <span className="faint small">No documents uploaded yet.</span>}
              {deal.docs.map((d) => (
                <div key={d.id} className="row" style={{ fontSize: 13 }}>
                  <UploadCloud size={15} className="faint" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                    <div className="faint" style={{ fontSize: 11 }}>{d.kind} · {shortDate(d.uploaded_at)}</div>
                  </div>
                  {d.verified ? <Badge tone="good"><Check size={11} /> ok</Badge> : <Badge>pending</Badge>}
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 12 }} disabled>
              <UploadCloud size={14} /> Upload document
            </button>
          </section>

          {deal.dispute && (
            <section className="panel" style={{ padding: 16, borderColor: "var(--danger)" }}>
              <h3 className="hd row" style={{ margin: 0, gap: 8, color: "var(--danger)", fontSize: 14 }}><Gavel size={15} /> Open dispute</h3>
              <p className="small" style={{ margin: "8px 0 0" }}>{deal.dispute.reason}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}