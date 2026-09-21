import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Globe2, TrendingUp, Building2, Package, Briefcase, ShieldCheck, Ship,
  Scale, Handshake, Server, Menu, Search, Bell, Sun, Moon, Check, ChevronsUpDown, MessageSquarePlus,
  Sparkles, UserRound, Landmark,
} from "lucide-react";
import { useSession } from "../store.jsx";
import { useTheme } from "../theme.jsx";
import { api, timeAgo } from "../api.js";
import { Av } from "./ui.jsx";

const NAV = [
  {
    group: "Corridor",
    items: [
      { to: "/", label: "Discover", icon: LayoutDashboard, kbd: "g h" },
      { to: "/vision", label: "Vision", icon: Globe2, kbd: "g v" },
      { to: "/market", label: "Market", icon: TrendingUp, kbd: "g m" },
    ],
  },
  {
    group: "Trade",
    items: [
      { to: "/suppliers", label: "Suppliers", icon: Building2, kbd: "g s" },
      { to: "/products", label: "Products", icon: Package, kbd: "g p" },
      { to: "/deals", label: "Deals", icon: Briefcase, kbd: "g d" },
      { to: "/escrow", label: "Escrow", icon: ShieldCheck, kbd: "g e" },
      { to: "/logistics", label: "Logistics", icon: Ship, kbd: "g l" },
    ],
  },
  {
    group: "Governance",
    items: [
      { to: "/compliance", label: "Compliance", icon: Scale, kbd: "g c" },
      { to: "/broker", label: "Broker Desk", icon: Handshake, kbd: "g b" },
      { to: "/admin", label: "Admin", icon: Server, kbd: "g a" },
    ],
  },
];

let cmdKeySeq = "";
let gNavTimeout = null;

export function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { persona, users, switchTo, byRole } = useSession();
  const { theme, toggle } = useTheme();
  const [palette, setPalette] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const [qi, setQi] = useState(0);
  const palsRef = useRef(null);
  const bellRef = useRef(null);

  const page = useMemo(() => NAV.flatMap((g) => g.items).find((i) => (i.to === "/" ? pathname === "/" : pathname.startsWith(i.to))), [pathname]);

  useEffect(() => {
    api.get("/notifications").then((d) => {
      setNotifs(d.notifications || []);
      setUnread(d.unread || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!palette) { setQ(""); setQi(0); return; }
    palsRef.current?.focus();
  }, [palette]);

  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); return; }
      if (e.key === "Escape") { setPalette(false); setNotifOpen(false); setPersonaOpen(false); setMobileOpen(false); return; }
      if (e.key === "/" && !meta && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) {
        e.preventDefault(); setPalette(true); return;
      }
      if (palette && e.key === "ArrowDown") { e.preventDefault(); setQi((i) => Math.min(i + 1, results.length - 1)); }
      if (palette && e.key === "ArrowUp") { e.preventDefault(); setQi((i) => Math.max(i - 1, 0)); }
      if (palette && e.key === "Enter") { const hit = results[qi]; if (hit) go(hit); }

      if (e.key === "g") { clearTimeout(gNavTimeout); gNavTimeout = setTimeout(() => (cmdKeySeq = ""), 1200); cmdKeySeq = "g"; return; }
      if (cmdKeySeq === "g") {
        const map = {
          h: "/", v: "/vision", m: "/market", s: "/suppliers", p: "/products", d: "/deals",
          e: "/escrow", l: "/logistics", c: "/compliance", b: "/broker", a: "/admin",
        };
        if (map[e.key]) { navigate(map[e.key]); cmdKeySeq = ""; }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(gNavTimeout);
    };
  });

  useEffect(() => {
    const onDoc = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const nav = NAV.flatMap((g) => g.items).filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
    const people = users.filter((u) => (u.name + u.org).toLowerCase().includes(q.toLowerCase()));
    return [...nav.map((i) => ({ ...i, kind: "page" })), ...people.map((u) => ({ kind: "persona", to: null, label: u.name, desc: `${u.org} · ${u.role}`, id: u.id }))];
  }, [q, users]);

  const go = (hit) => {
    setPalette(false);
    if (hit.kind === "logout") nav("compliance")();
    if (hit.to) navigate(hit.to);
    if (hit.id) switchTo(hit.id);
  };

  const markAll = async () => {
    await api.post("/notifications/read", {});
    setNotifs((n) => n.map((x) => ({ ...x, read: 1 })));
    setUnread(0);
    setNotifOpen(false);
  };

  return (
    <div className="shell">
      <aside className={`sidenav ${mobileOpen ? "open" : ""}`}>
        <Brand />
        <div style={{ overflow: "auto", paddingBottom: 8 }}>
          {NAV.map((g) => (
            <div key={g.group} className="nav-group">
              <h5>{g.group}</h5>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.to === "/"} className="nav-item" onClick={() => setMobileOpen(false)}>
                  <it.icon />
                  <span>{it.label}</span>
                  <span className="nav-kbd">{it.kbd}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>
        <div className="nav-spacer" />
        <div className="sidenav-foot">
          <div className="theme-row">
            <span>Appearance</span>
            <button className="btn btn-icon btn-sm btn-ghost" onClick={toggle} title="Toggle theme">
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <button className="persona-card" style={{ width: "100%" }} onClick={() => setPersonaOpen((o) => !o)}>
              {persona ? <Av user={persona} size={34} /> : <span className="avatar" style={{ background: "var(--primary)" }}><Landmark size={16} /></span>}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="persona-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{persona?.name || "…"}</div>
                <div className="persona-role" style={{ textTransform: "capitalize" }}>{persona?.role || "loading"}</div>
              </div>
              <ChevronsUpDown size={14} className="faint" />
            </button>
            {personaOpen && (
              <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow-pop)", padding: 8, zIndex: 70, maxHeight: 320, overflow: "auto" }}>
                <div style={{ padding: "4px 8px 6px", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--faint)" }}>Viewpoint switcher</div>
                {["buyer", "supplier", "broker", "logistics", "admin"].map((role) => (
                  <div key={role} style={{ marginBottom: 2 }}>
                    {byRole?.[role]?.map((u) => (
                      <button
                        key={u.id}
                        className="cmd-row"
                        onClick={() => { switchTo(u.id); setPersonaOpen(false); }}
                        style={{ fontSize: 12.5 }}
                      >
                        <Av user={u} size={26} />
                        <span style={{ textTransform: "capitalize" }}>{u.name}</span>
                        <span className="cmd-desc" style={{ textTransform: "capitalize" }}>{u.org}</span>
                        {persona?.id === u.id && <Check size={14} style={{ color: "var(--primary)" }} />}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <button className="btn btn-icon btn-ghost menu-btn" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu size={18} />
          </button>
          <div className="breadcrumb">
            <span className="crumb-muted">AgriBridge /</span> {page?.label || "Overview"}
          </div>
          <div className="kbd-hint">
            <button className="cmd-chip" onClick={() => setPalette(true)}>
              <Search size={14} />
              <span className="cmd-label">Search, go, act…</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div style={{ position: "relative" }} ref={bellRef}>
              <button className="bell" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications">
                <Bell size={16} />
                {unread > 0 && <span className="dot" />}
              </button>
              {notifOpen && (
                <div className="pop">
                  <div className="pop-head">
                    <h4>Notifications {unread > 0 && <span className="badge good" style={{ marginLeft: 6 }}>{unread}</span>}</h4>
                    <button className="btn btn-soft btn-sm" onClick={markAll}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: 340, overflow: "auto" }}>
                    {notifs.length === 0 && <div className="muted" style={{ padding: 24, textAlign: "center", fontSize: 13 }}>No activity yet.</div>}
                    {notifs.map((n) => (
                      <div key={n.id} className={`notif ${n.read ? "" : "unread"}`} onClick={() => { if (!n.read) api.post("/notifications/read", { id: n.id }); setUnread((u) => Math.max(0, u - 1)); }}>
                        <span className={`icon-tile ${n.kind === "alert" ? "red" : n.kind === "escrow" ? "amber" : "blue"}`} style={{ width: 30, height: 30, borderRadius: 8 }}>
                          {n.kind === "alert" ? <ShieldCheck size={14} /> : n.kind === "escrow" ? <Landmark size={14} /> : <MessageSquarePlus size={14} />}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="n-title">{n.title}</div>
                          <div className="n-body">{n.body}</div>
                          <div className="n-time">{timeAgo(n.ts)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main">
          <Outlet />
        </main>

        <Footer />
      </div>

      {palette && (
        <div className="cmd-backdrop" onMouseDown={() => setPalette(false)}>
          <div className="cmd-panel" onMouseDown={(e) => e.stopPropagation()}>
            <div className="cmd-search">
              <Search size={18} />
              <input
                ref={palsRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setQi(0); }}
                placeholder="Search pages, people, actions…"
              />
              <kbd style={{ color: "var(--faint)", fontFamily: "var(--mono)", fontSize: 11 }}>Esc</kbd>
            </div>
            <div className="cmd-list">
              {results.length === 0 && <div className="muted" style={{ padding: "18px 12px", textAlign: "center" }}>No matches for “{q}”.</div>}
              {results.map((r, i) => (
                <button key={r.kind + (r.to || r.id)} className={`cmd-row ${i === qi ? "active" : ""}`} onMouseEnter={() => setQi(i)} onClick={() => go(r)}>
                  {r.kind === "page" ? <r.icon /> : <UserRound size={16} />}
                  {r.label}
                  <span className="cmd-desc">{r.desc || r.kbd}</span>
                </button>
              ))}
              <div style={{ height: 4 }} />
            </div>
            <div style={{ display: "flex", gap: 12, padding: "8px 12px 4px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--faint)" }}>
              <span><kbd style={{ fontFamily: "var(--mono)" }}>↑↓</kbd> navigate</span>
              <span><kbd style={{ fontFamily: "var(--mono)" }}>Enter</kbd> go</span>
              <span><kbd style={{ fontFamily: "var(--mono)" }}>g</kbd> then key jumps directly</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Sparkles size={18} />
      </span>
      <div>
        <div className="brand-name">AgriBridge</div>
        <div className="brand-sub">Trusted agro corridor</div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="row" style={{ gap: 10 }}>
        <span className="brand-mark" style={{ width: 26, height: 26, borderRadius: 7 }}><Sparkles size={13} /></span>
        <span className="brand-name">AgriBridge</span>
        <span className="badge" style={{ marginLeft: 4 }}>v2.0</span>
      </div>
      <nav>
        <a href="/vision">Vision</a>
        <a href="/market">Market</a>
        <a href="/compliance">Compliance</a>
        <a href="/broker">Broker desk</a>
        <a href="/escrow">Escrow</a>
      </nav>
      <div className="legal">Africa ⇄ Eurasia verified agro-trade corridor. Escrow · Compliance · Logistics · Finance.</div>
    </footer>
  );
}

export { NAV };