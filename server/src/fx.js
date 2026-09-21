const BASE = {
  USD_RUB: 92.4,
  USD_EUR: 0.92,
  USD_KES: 128.5,
  USD_TZS: 2620,
  USD_UGX: 3700,
  USD_MWK: 1690,
  USD_ZMW: 26.8,
  USD_RWF: 1390,
  USDT_USD: 1,
  USDC_USD: 1,
};

function noise(amt, vol = 0.004) {
  return amt * (1 + (Math.random() - 0.5) * vol);
}

export function rates() {
  const out = {};
  for (const [k, v] of Object.entries(BASE)) out[k] = Number(noise(v).toFixed(k === "USD_TZS" || k === "USD_UGX" || k === "USD_MWK" ? 2 : 3));
  return out;
}

export function convert(usd, from) {
  const r = rates();
  if (from === "USD" || from.startsWith("USDT") || from.startsWith("USDC")) return usd;
  const key = `USD_${from}`;
  if (!r[key]) return usd;
  return usd * r[key];
}