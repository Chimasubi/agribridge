import { useEffect, useState } from "react";

const $api = async (route, opts = {}) => {
  const r = await fetch(`/api${route}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (r.status === 404) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
};

export const api = {
  get: (route) => $api(route),
  post: (route, body) => $api(route, { method: "POST", body }),
};

export const fmtUSD = (n, d = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: d }).format(n);

export const fmtMT = (n) => `${new Intl.NumberFormat("en-US").format(n)} MT`;

export const fmtNum = (n) => new Intl.NumberFormat("en-US").format(n);

export const fmtK = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
  return `$${Math.round(v)}`;
};

export const timeAgo = (iso) => {
  if (!iso) return "";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const personaInitials = (p) =>
  p.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();

export const tierMeta = {
  gold: { label: "Gold", cls: "tier-gold" },
  silver: { label: "Silver", cls: "tier-silver" },
  bronze: { label: "Bronze", cls: "tier-bronze" },
  platinum: { label: "Platinum", cls: "tier-platinum" },
};

export const STATUS_META = {
  negotiation: { label: "Negotiation", tone: "info" },
  funded: { label: "Escrow funded", tone: "amber" },
  shipped: { label: "In transit", tone: "info" },
  disputed: { label: "Disputed", tone: "bad" },
  delivered: { label: "Delivered", tone: "good" },
  closed: { label: "Closed", tone: "good" },
};

export const stageOrder = ["negotiation", "funded", "shipped", "delivered", "closed"];

export function useFetch(route) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [load, setLoad] = useState(true);
  const refetch = () =>
    api.get(route).then(setData).catch(setErr).finally(() => setLoad(false));
  if (load) refetch();
  return { data, err, load, refetch };
}