import { useMemo, useState } from 'react'
import { REGISTRANTS, YEAR_DATA } from '@/data/analytics'
import { Avatar } from './ui'

const FILTERS = ['All years', ...YEAR_DATA.map((y) => y.label)]

export function Registrants() {
  const [filter, setFilter] = useState('All years')

  const list = useMemo(
    () => (filter === 'All years' ? REGISTRANTS : REGISTRANTS.filter((r) => r.year === filter)),
    [filter],
  )

  return (
    <div>
      {/* Filter pills — a clean alternative to a search bar */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
              filter === f
                ? 'bg-forest text-white'
                : 'border border-line bg-panel text-ink-2 hover:border-forest/40'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto self-center font-mono text-[12px] text-ink-4">
          {list.length} people
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {list.map((r) => (
          <button
            key={r.id}
            className="group flex items-center gap-4 rounded-2xl border border-line bg-panel px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(16,35,28,0.03)] transition hover:-translate-y-0.5 hover:border-forest/25 hover:shadow-md"
          >
            <Avatar name={r.name} hue={r.avatarHue} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-[15px] font-semibold leading-tight text-ink">{r.name}</p>
                <span className="rounded-full bg-mint-3 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-forest">
                  {r.branch}
                </span>
                <span className="rounded-full bg-line-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  {r.year.split(' ')[0]} yr
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-[12px] text-ink-4">{r.email}</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="font-mono text-[11px] text-ink-4">Registered</p>
              <p className="font-mono text-[12px] text-ink-2">{r.registeredAt}</p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition group-hover:border-forest group-hover:bg-forest group-hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14m-6-6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
