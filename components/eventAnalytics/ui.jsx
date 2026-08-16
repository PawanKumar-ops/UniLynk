export function Panel({
  children,
  className = '',
}) {
  return (
    <section
      className={`rounded-3xl border border-line bg-panel p-5 shadow-[0_1px_2px_rgba(16,35,28,0.04)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  )
}

export function SectionLabel({ children }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-4">{children}</p>
  )
}

export function CardTitle({ children }) {
  return <h3 className="font-display text-[17px] font-bold leading-tight text-ink">{children}</h3>
}

export function Avatar({ name, size = 34 }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="grid shrink-0 place-items-center rounded-full border border-[#e2e2e2] bg-[#f3f3f3] font-display font-semibold text-[#333333]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}

export function Chip({
  children,
  tone = 'default',
}) {
  const tones = {
    default: 'border border-line text-ink-2 bg-panel',
    solid: 'bg-forest text-white border border-forest',
    mint: 'bg-mint-3 text-forest border border-transparent',
    gold: 'bg-[#fbf1d8] text-[#8a6410] border border-transparent',
    muted: 'bg-line-2 text-ink-3 border border-transparent',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function TrendChip({ value }) {
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
        up ? 'bg-mint-3 text-good' : 'bg-[#fbeceb] text-critical'
      }`}
    >
      {up ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  )
}
