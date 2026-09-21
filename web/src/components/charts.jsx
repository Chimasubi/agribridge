import { useId } from "react";

const NUMS = (d, key = "v") => d.map((p) => Number(key ? p[key] : p));

export function LineChart({ data, key = "price", height = 200, color = "var(--primary)", labels, format }) {
  const gid = useId().replace(/:/g, "");
  const pts = NUMS(data, key);
  if (!pts.length) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const W = 640, H = height, P = 8;
  const step = W / (pts.length - 1);
  const xy = (i, v) => [P + i * step, H - P - ((v - min) / span) * (H - P * 2)];
  const line = pts.map((v, i) => xy(i, v).join(",")).join(" ");
  const area = `M ${xy(0, pts[0]).join(" ")} L ${line.split(" ").join(" L ")} L ${xy(pts.length - 1, min).join(" ")} Z`;
  const nTicks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: nTicks }).map((_, i) => {
        const y = P + (i * (H - P * 2)) / (nTicks - 1);
        const v = max - (i * span) / (nTicks - 1);
        return (
          <g key={i}>
            <line x1={P} x2={W - P} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 4" strokeWidth="1" />
            <text x={W - P} y={y - 3} textAnchor="end" className="axis-t" fill="currentColor">
              {format ? format(v) : Math.round(v).toLocaleString()}
            </text>
          </g>
        );
      })}
      {lines()}
      {labels && (
        <g>
          {pts.map((_, i) => (
            <text key={i} x={P + i * step} y={H - 1} textAnchor="middle" className="axis-t" fill="currentColor">
              {labels[i]}
            </text>
          ))}
        </g>
      )}
    </svg>
  );

  function lines() {
    return (
      <>
        <path d={area} fill={`url(#g${gid})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="none">
          <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="0.8s" />
        </polyline>
        <circle cx={xy(pts.length - 1, pts[pts.length - 1])[0]} cy={xy(pts.length - 1, pts[pts.length - 1])[1]} r="3.4" fill={color} />
      </>
    );
  }
}

export function Spark({ data, key = "price", w = 90, h = 30, color = "var(--primary)" }) {
  const pts = NUMS(data, key);
  if (pts.length < 2) return null;
  const min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1;
  const S = [w, h], P = 0;
  const xy = (i, v) => [P + (i * (S[0] - P * 2)) / (pts.length - 1), S[1] - ((v - min) / span) * (S[1] - P * 2)];
  const line = pts.map((v, i) => xy(i, v).join(",")).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Bars({ data, h = 120, color = "var(--primary)", fmt }) {
  const mx = Math.max(...data.map((d) => d.v));
  return (
    <svg viewBox={`0 0 ${data.length * 26} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      {data.map((d, i) => {
        const bh = (d.v / mx) * (h - 26);
        return (
          <g key={i}>
            <rect x={i * 26 + 4} y={h - bh} width={18} height={bh - 2} rx="3" fill={d.color || color} opacity="0.9" />
            <text x={i * 26 + 13} y={h - bh - 4} textAnchor="middle" className="axis-t" fill="currentColor">
              {fmt ? fmt(d.v) : d.v}
            </text>
            <text x={i * 26 + 13} y={h - 6} textAnchor="middle" className="axis-t" fill="currentColor">
              {d.l}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({ segments, size = 120, thickness = 12, center, sub }) {
  const total = segments.reduce((s, x) => s + x.v, 0) || 1;
  const R = (size - thickness) / 2;
  const C = size / 2;
  let acc = 0;
  const arc = (v, color) => {
    const a0 = (acc / total) * 2 * Math.PI - Math.PI / 2;
    acc += v;
    const a1 = (acc / total) * 2 * Math.PI - Math.PI / 2;
    const x0 = C + R * Math.cos(a0), y0 = C + R * Math.sin(a0);
    const x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return (
      <path key={color + a0} d={`M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}`} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" />
    );
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
      {segments.map((s) => arc(s.v, s.color))}
      <text x={C} y={C - (sub ? 4 : 0)} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 15 }}>
        {center}
      </text>
      {sub && (
        <text x={C} y={C + 12} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--mono)", fontSize: 8.5, fill: "var(--faint)" }}>
          {sub}
        </text>
      )}
    </svg>
  );
}