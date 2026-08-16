import { useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BRANCH_YEAR_MATRIX,
  MATRIX_YEARS,
  REGISTRATION_TREND,
} from '@/data/analytics'
import { Chip } from './ui'

// Testora-style green palette for categorical marks
const SEG = ['#0f3d31', '#e8b84b', '#a7d3c2', '#5f9a86', '#cfe7dd', '#2f6f5b']

/* ---------- Horizontal gradient bars (magnitude) ---------- */
export function BarList({
  data,
  suffix = '',
  denom,
}) {
  const max = Math.max(...data.map((d) => d.count))
  const total = denom ?? data.reduce((s, d) => s + d.count, 0)
  const [hover, setHover] = useState(null)
  return (
    <div className="flex flex-col gap-3.5">
      {data.map((d) => {
        const pct = Math.round((d.count / total) * 100)
        const active = hover === d.label
        return (
          <div key={d.label} onMouseEnter={() => setHover(d.label)} onMouseLeave={() => setHover(null)}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px] font-medium text-ink-2">{d.label}</span>
              <span className="shrink-0 font-mono text-[12px] tabular-nums text-ink">
                {d.count.toLocaleString()}
                {suffix}
                <span className="ml-1.5 text-ink-4">{pct}%</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-mint-3">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(d.count / max) * 100}%`,
                  background: active
                    ? 'linear-gradient(90deg, #1a5344, #2f6f5b)'
                    : 'linear-gradient(90deg, #0f3d31, #2f6f5b)',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Donut (categorical identity) ---------- */
export function Donut({ data, centerLabel }) {
  const [active, setActive] = useState(0)
  const total = data.reduce((s, d) => s + d.count, 0)
  const cur = data[active]
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <div className="relative h-[176px] w-[176px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              innerRadius={60}
              outerRadius={84}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={3}
              startAngle={90}
              endAngle={-270}
              onMouseEnter={(_, i) => setActive(i)}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={SEG[i % SEG.length]} opacity={i === active ? 1 : 0.9} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-display text-[26px] font-bold leading-none text-ink">
              {centerLabel ?? `${Math.round((cur.count / total) * 100)}%`}
            </div>
            <div className="mt-1 max-w-[96px] truncate font-mono text-[9px] uppercase tracking-wider text-ink-4">
              {centerLabel ? 'total' : cur.label}
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-1.5">
        {data.map((d, i) => (
          <button
            key={d.label}
            onMouseEnter={() => setActive(i)}
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
              i === active ? 'bg-mint-3' : ''
            }`}
          >
            <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: SEG[i % SEG.length] }} />
            <span className="flex-1 truncate text-[13px] font-medium text-ink-2">{d.label}</span>
            <span className="font-mono text-[12px] tabular-nums text-ink">{d.count}</span>
            <span className="w-9 text-right font-mono text-[11px] text-ink-4">
              {Math.round((d.count / total) * 100)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Gauge donut (single ratio) ---------- */
export function FileGauge({ q }) {
  const submitted = q.submitted ?? 0
  const missing = q.missing ?? 0
  const total = submitted + missing
  const pct = Math.round((submitted / total) * 100)
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
      <div className="relative h-[176px] w-[176px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { label: 'Submitted', count: submitted },
                { label: 'Missing', count: missing },
              ]}
              dataKey="count"
              innerRadius={62}
              outerRadius={84}
              startAngle={90}
              endAngle={-270}
              cornerRadius={8}
              stroke="none"
            >
              <Cell fill="#0f3d31" />
              <Cell fill="#e6f1ec" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-display text-[30px] font-bold leading-none text-forest">{pct}%</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ink-4">uploaded</div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Submitted" value={submitted} />
          <Stat label="Missing" value={missing} />
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-4">File types</p>
          <div className="flex flex-wrap gap-1.5">
            {q.fileKinds?.map((f) => (
              <Chip key={f.label} tone="mint">
                {f.label} · {f.count}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-3.5 py-3">
      <div className="font-display text-xl font-bold leading-none text-ink">{value}</div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-4">{label}</div>
    </div>
  )
}

/* ---------- Radar (multiple-correct: profile of choices) ---------- */
export function RadarChartView({ data }) {
  const chartData = data.map((d) => ({ subject: d.label, value: d.count }))
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke="#dbe7e1" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#3a4a44', fontSize: 11, fontFamily: 'Inter' }}
          />
          <Radar dataKey="value" stroke="#0f3d31" strokeWidth={2} fill="#0f3d31" fillOpacity={0.16} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e6ece9',
              fontSize: 12,
              fontFamily: 'Inter',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------- Vertical gradient bars (dropdown pattern) ---------- */
export function VerticalBars({ data }) {
  const max = Math.max(...data.map((d) => d.count))
  const total = data.reduce((s, d) => s + d.count, 0)

  const needsScroll = data.length > 8

  return (
    <div
      className={`w-full ${
        needsScroll
          ? 'overflow-x-auto scrollbar-none'
          : 'overflow-x-hidden'
      }`}
    >
      <div
        className={`flex items-end gap-3 pt-4 ${
          needsScroll ? 'min-w-max' : 'w-full justify-around'
        }`}
      >
        {data.map((d, i) => {
          const pct = Math.round((d.count / total) * 100)

          return (
            <div
              key={d.label}
              className={`flex shrink-0 flex-col items-center gap-2 ${
                needsScroll
                  ? 'w-[52px]'
                  : 'flex-1'
              }`}
            >
              <span className="font-display text-lg font-bold text-ink">
                {pct}%
              </span>

              <div className="flex h-[120px] w-full max-w-[52px] items-end overflow-hidden rounded-t-lg rounded-b-md bg-mint-3">
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${(d.count / max) * 100}%`,
                    background:
                      i === 0
                        ? 'linear-gradient(180deg,#0f3d31,#2f6f5b)'
                        : i === 1
                          ? 'linear-gradient(180deg,#5f9a86,#2f6f5b)'
                          : 'linear-gradient(180deg,#e8b84b,#d9a52f)',
                  }}
                />
              </div>

              <span className="w-full truncate text-center text-[11px] font-medium leading-tight text-ink-3">
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Paragraph card ---------- */
export function ParagraphCard({ q }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Responses" value={q.responses ?? 0} />
        <Stat label="Avg. words" value={q.avgWords ?? 0} />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-4">
          Sample responses
        </p>
        <div className="flex flex-col gap-2">
          {q.sampleResponses?.map((r, i) => (
            <blockquote
              key={i}
              className="rounded-2xl border border-line bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink-2"
            >
              <span className="mr-1 font-display font-bold text-sage">“</span>
              {r}
            </blockquote>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Registered users: bars + line combo (single series) ---------- */
function RegTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const reg = payload[0]?.payload?.registrations
  return (
    <div className="rounded-xl bg-forest px-3 py-2 text-white shadow-lg">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-mint">{label}</p>
      <p className="text-[12px]">
        Registered <b className="font-semibold">{reg}</b>
      </p>
    </div>
  )
}

export function RegisteredChart() {
  const total = REGISTRATION_TREND.reduce((s, d) => s + d.registrations, 0)
  const peak = REGISTRATION_TREND.reduce((a, b) => (b.registrations > a.registrations ? b : a))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-medium text-ink-3">Total registered</span>
          <span className="font-display text-2xl font-bold text-ink">{total.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-ink-2">
          <span className="h-2.5 w-4 rounded-sm bg-mint" />
          <span className="h-0.5 w-4 rounded-full bg-forest" />
          Registered users
        </div>
      </div>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={REGISTRATION_TREND} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#eef3f1" />
            <XAxis
              dataKey="day"
              tickFormatter={(d) => d.replace('Aug ', '')}
              tick={{ fill: '#9aa8a2', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9aa8a2', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: 'rgba(15,61,49,0.05)' }} content={<RegTooltip />} />
            <Bar dataKey="registrations" barSize={20} radius={[6, 6, 0, 0]} fill="#a7d3c2" />
            <Line
              type="monotone"
              dataKey="registrations"
              stroke="#0f3d31"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0f3d31' }}
              activeDot={{ r: 6, fill: '#0f3d31', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 font-mono text-[11px] text-ink-4">
        Peak day · {peak.day} with {peak.registrations} sign-ups
      </p>
    </div>
  )
}

/* ---------- Branch × Year heatmap ---------- */
export function Heatmap() {
  const all = BRANCH_YEAR_MATRIX.flatMap((r) => r.values)
  const max = Math.max(...all)
  const [hover, setHover] = useState(null)

  const color = (v) => {
    const t = v / max
    const lerp = (a, b) => Math.round(a + (b - a) * t)

    return `rgb(${lerp(230, 15)}, ${lerp(241, 61)}, ${lerp(236, 49)})`
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-1.5 grid grid-cols-[120px_repeat(5,minmax(0,1fr))] gap-1.5">
        <span />

        {MATRIX_YEARS.map((y) => (
          <span
            key={y}
            className="text-center font-mono text-[10px] uppercase text-ink-4"
          >
            {y}
          </span>
        ))}
      </div>

      {/* Rows */}
      {BRANCH_YEAR_MATRIX.map((row) => (
        <div
          key={row.branch}
          className="mb-1.5 grid grid-cols-[120px_repeat(5,minmax(0,1fr))] items-center gap-1.5"
        >
          <span className="truncate pr-2 text-[12px] font-medium text-ink-2">
            {row.branch}
          </span>

          {row.values.map((v, i) => (
            <div
              key={i}
              onMouseEnter={() =>
                setHover({
                  b: row.branch,
                  y: MATRIX_YEARS[i],
                  v,
                })
              }
              onMouseLeave={() => setHover(null)}
              className="grid h-9 min-w-0 place-items-center rounded-md text-[11px] font-semibold transition"
              style={{
                background: color(v),
                color: v / max > 0.5 ? "#fff" : "#10231c",
              }}
            >
              {v}
            </div>
          ))}
        </div>
      ))}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="h-6 text-[11px] text-ink-3">
          {hover ? (
            <span>
              <b className="text-ink">{hover.v}</b> · {hover.b} · {hover.y} year
            </span>
          ) : (
            <span className="text-ink-4">
              Hover a cell for details
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-ink-4">
          Low

          <div
            className="h-2.5 w-24 rounded-full"
            style={{
              background:
                "linear-gradient(90deg,#e6f1ec,#0f3d31)",
            }}
          />

          High
        </div>
      </div>
    </div>
  )
}
