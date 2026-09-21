import { ShieldCheck, BadgeCheck } from "lucide-react";
import { Badge } from "./ui.jsx";
import { STATUS_META } from "../api.js";

export function TrustBadge({ tier }) {
  const label = tier === "platinum" ? "Platinum" : tier === "gold" ? "Gold" : tier === "silver" ? "Silver" : tier === "bronze" ? "Bronze" : tier;
  const color = tier === "gold" || tier === "platinum" ? "amber" : tier === "bronze" ? "warn" : "info";
  return (
    <Badge tone={color}>
      <BadgeCheck size={11} />
      {label} verified
    </Badge>
  );
}

export function KYCBadge({ kyc }) {
  return kyc === "verified" ? (
    <Badge tone="good">
      <ShieldCheck size={11} /> KYC verified
    </Badge>
  ) : (
    <Badge tone="warn">KYC pending</Badge>
  );
}

export function SanctionBadge({ verdict }) {
  const tone = verdict === "block" ? "bad" : verdict === "review" ? "warn" : "good";
  const label = verdict === "block" ? "Flagged" : verdict === "review" ? "Review" : "Clear";
  return (
    <Badge tone={tone}>
      <span className="dot-on" />
      {label}
    </Badge>
  );
}

export function StatusPill({ status }) {
  const m = STATUS_META[status] || { label: status, tone: "neutral" };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}