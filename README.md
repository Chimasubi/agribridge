# AgriBridge — verified B2B trade, escrow & brokerage for the Africa ⇄ Russia/EU corridor

A working MVP of the **AgriBridge concept**: a verified supplier directory, private
**deal rooms** with negotiation chat, **escrow-locked payments** released on verified
delivery, integrated **logistics tracking**, a **broker pipeline desk**, an admin
compliance panel, and a sanctions/HS-code screening engine.

Runs 100% locally in a single repo — a real relational database with seeded demo
data so every screen is populated the moment you open it. Built for a live demo
walkthrough, not a marketing page.

## Stack

| Layer | Tech | Why |
|---|---|---|
| API | Node 22 `node:sqlite` (built-in, no native deps) | Real relational DB, zero build step |
| HTTP | Express | API + static SPA serving in one process |
| Web (dev) | Vite + React 19 + React Router | Hot reload, fast iteration |
| Web (build) | Vite production build, served by the API | One port for the whole demo |
| Icons/chips | lucide-react + light SVG | Crisp, no heavy UI kit |

System requirement: **Node 22.5+** (for `node:sqlite`).

## Quick start

```bash
cd agribridge

# 1. Install (root workspaces install all three packages)
npm install

# 2. Terminal A — API on :4000 (seeds SQLite on first boot)
cd server && npm run dev

# 3. Terminal B — frontend dev server on :5173 (proxies /api → :4000)
cd web && npm run dev
```

Open http://localhost:5173 — the app works in any browser.

**Production-ish single-port run** (build the SPA, serve everything from :4000):

```bash
npm run build          # builds web/dist
cd server && npm start # serves API + built SPA on :4000
```

The seeded database is recreated from scratch whenever `server/data/` is deleted —
so you can always reset to a fresh, fully-populated demo:

```bash
rm -rf server/data && cd server && npm run dev
```

## The 10-minute walkthrough

The platform ships with a set of personas you can switch between from the top-right
"persona" menu — try the same screen as a buyer, a Russian supplier, a Kenyan
broker, a logistics forwarder, or the platform admin, and watch each role's view change.

**1 — Discovery.** Landing page shows verified suppliers, featured deals, an activity
feed each companion receives, and ping-lived FX more than a decade.

**2 — Directory & KYC.** Browse `Suppliers` for origin/inspection screening,
KYC status, tier, certifications and CoA documents. A highlighted trust engine
screens every party.

**3 — Product compliance.** Each item is screened against its HS code × destination —
verify a known-good code (e.g. `3105.20`) vs a flagged dual-use item.

**4 — Deal room.** Every deal has a private negotiation chat, a milestone tracker,
a document vault)Skip building the empty "right" runner; `npm run build` + `npm start` covers the demo. So iterate to finish.

conversation with a single agreed deal; switch peers to watch escrow lock, ship, clear, and auto-release proceeds.

**5 — Escrow.** The escrow dashboard shows wallet balance (`available`), amounts `locked`
on board for active deals, plus the `released` outflows — funds lock the moment a
buyer funds a deal and are only released after both parties confirm delivered.
A demo FX board shows the corridor mid-rates alongside.

**6 — Logistics.** A container-map tracks each shipment (port of loading → discharge
port), vessel, ETA, and custody events; forwarder assignments appear automatically.

**7 — Broker desk.** A pipeline kanban (`Lead → Negotiation → Funded → Shipped →
Delivered`), commission ledger, and mediation queue. Broker personas see commission
on every delivered deal and an arbitration queue.

**8 — Admin & compliance.** A consolidated admin view (users, trust tiers, GMV,
escrow holdings, open disputes), a compliance panel with live **sanctions screening**
(`/api/compliance/screen?name=…`) and **HS-code × destination** checks
(`/api/compliance/hs?code=…&dest=…`), and a mediation/arbitration desk.

## Demo missions (pick one)

- **As buyer Amara (id 1):** open a supplier → "Start a deal" → agree quote →
  release escrow on delivery. Watch the milestone tracker flip in the deal room.
- **As broker Aisha (id 14):** broker dashboard shows your pipeline; open the
  dispute deal (0151) and run the arbitration queue.
- **As supplier Dmitri (id 7):** open your supplier profile, review certifications and
  products, then confirm a quote in the deal room.
- **Compliance (any admin/broker):** screen "Viktor Selim" (auto-block) vs a
  clean name; check HS `3105.20` vs `9306.30` to see goods screening.

## API surface (all `/api/…`)

`GET /api/health` · `GET /api/suppliers` · `GET /api/suppliers/:id` ·
`GET /api/products?category=` · `GET /api/deals` · `GET /api/deals/:id` ·
`POST /api/deals` · `POST /api/deals/:id/advance` (quote/contract/fund/ship/clear/confirm/dispute/close) ·
`GET /api/escrows` · `GET /api/fx` · `GET /api/logistics` ·
`GET /api/broker/dashboard` · `GET /api/admin/overview` ·
`GET /api/compliance/screen` · `GET /api/compliance/hs` ·
`POST /api/session` (switch persona — the demo's "log in as…") ·
`GET /api/me` · `.../disputes` · `.../logs` · `.../tx`

## Files worth knowing

- `server/src/db.js` — schema + seeded data (users, suppliers, products, deals,
  milestones, escrows, logistics, disputes, transactions, reviews, messages).
- `server/src/index.js` — the entire REST API (state machine for deal progress).
- `web/src/App.jsx` — route table; `web/src/pages/` — every screen;
  `web/src/components/` — layout, nav, persona switcher, badges, country/flag,
  toast, cargo chips.

## Design decisions

- **Escrow as a lifecycle, not a toggle** — funding locks funds, every transition
  (quote → contract → funded → shipped → delivered) is an auditable milestone, and
  funds can only be released or disputed, never "cancelled" unilaterally.
- **One import** (`node:sqlite`) to sidestep native build complexity. Both `server`
  and `web` act as npm workspaces with zero compiled extensions.
- The whole app is persona-first so the same data tells different stories per role
  — that's the "deal room" that makes B2B trade feel real in a demo.

---

This is a take-home MVP build: complete, runnable, deterministically seeded, and
ready to extend. Questions → open a PR or DM.
