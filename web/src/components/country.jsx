/* inline SVG flags — no emoji, consistent in light & dark mode */

const KE = (
  <>
    <rect x="0" y="0" width="20" height="14" fill="#f5f7f8" />
    <rect y="4.66" width="20" height="4.66" fill="#16181d" />
    <rect y="5.6" width="20" height="2.8" fill="#fff" />
    <path d="M0 7l20 0 M10 0 L10 14" stroke="#a8192a" strokeWidth="1.5" />
  </>
);

const TZ = (
  <>
    <rect x="0" y="0" width="20" height="14" fill="#14943d" />
    <rect y="0" width="20" height="14" fill="#14943d" />
    <path d="M0 14 L20 0" stroke="#f5bf23" strokeWidth="3" />
    <path d="M0 14 L20 0" stroke="#16181d" strokeWidth="1.4" />
    <path d="M0 6 L14 0" stroke="#2b62a5" strokeWidth="2" />
  </>
);

const MW = (
  <>
    <rect y="0" width="20" height="5" fill="#17181c" />
    <rect y="4.66" width="20" height="4.66" fill="#dc2327" />
    <rect y="9.33" width="20" height="4.66" fill="#3a7821" />
  </>
);

const RW = (
  <>
    <rect y="0" width="20" height="14" fill="#2f6fb4" />
    <rect y="9.33" width="20" height="4.66" fill="#f2b700" />
    <circle cx="10" cy="7" r="3.2" fill="#e74c3c" />
  </>
);

const ZM = (
  <>
    <rect y="0" width="20" height="14" fill="#198a3d" />
    <rect x="10" y="8.4" width="10" height="5.6" fill="#c2a93f" />
  </>
);

const UG = (
  <>
    <rect y="0" width="20" height="14" fill="#16181d" />
    <rect y="2.33" width="20" height="4.66" fill="#f5c400" />
    <rect y="9.33" width="20" height="4.66" fill="#d7242a" />
    <circle cx="10" cy="7" r="2.6" fill="#fff" />
  </>
);

const RU = (
  <>
    <rect y="0" width="20" height="4.66" fill="#f5f7f8" />
    <rect y="4.66" width="20" height="4.66" fill="#2b62a5" />
    <rect y="9.33" width="20" height="4.66" fill="#d7242a" />
  </>
);

const DE = (
  <>
    <rect y="0" width="20" height="4.66" fill="#1a1a1a" />
    <rect y="4.66" width="20" height="4.66" fill="#dd2f2f" />
    <rect y="9.33" width="20" height="4.66" fill="#f5c400" />
  </>
);

const NL = (
  <>
    <rect y="0" width="20" height="4.66" fill="#c81e27" />
    <rect y="4.66" width="20" height="4.66" fill="#fff" />
    <rect y="9.33" width="20" height="4.66" fill="#253d7e" />
  </>
);

const MAP = {
  Kenya: KE,
  Tanzania: TZ,
  Malawi: MW,
  Rwanda: RW,
  Zambia: ZM,
  Uganda: UG,
  Russia: RU,
  Germany: DE,
  Netherlands: NL,
};

export function Flag({ iso, size = 20 }) {
  const isoKey = String(iso || "").trim();
  const art = MAP[isoKey];
  if (!art) {
    return (
      <span className="flag" style={{ width: size, height: size * 0.7, background: "var(--surface-3)", display: "inline-grid", placeItems: "center" }}>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--faint)" }}>
          <circle cx="12" cy="12" r="4" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flag" style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.7} viewBox="0 0 20 14">
        {art}
      </svg>
    </span>
  );
}

export function Country({ name, flag = true }) {
  return (
    <span className="rest" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {flag && <Flag iso={name} />}
      <span>{name}</span>
    </span>
  );
}

export const COUNTRY_CODES = Object.keys(MAP);