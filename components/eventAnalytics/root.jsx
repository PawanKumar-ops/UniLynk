import { useState } from 'react'
import { Outlet, useOutletContext } from 'react-router'
import { INITIAL_TEAMS, SOLO_IDS } from '../data/analytics'

export function useShell() {
  return useOutletContext()
}

const NAV = [
  { icon: 'home', label: 'Home', to: '#' },
  { icon: 'clubs', label: 'My Clubs', to: '#' },
  { icon: 'events', label: 'Events', to: '/', active: true },
  { icon: 'chat', label: 'Chat', to: '#' },
]

function NavIcon({ name }) {
  const c = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' }
  const s = {
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (name) {
    case 'home':
      return (
        <svg {...c}>
          <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" {...s} />
        </svg>
      )
    case 'clubs':
      return (
        <svg {...c}>
          <circle cx="9" cy="8" r="3" {...s} />
          <path d="M15 11a3 3 0 1 0-1-5.8M3 20a6 6 0 0 1 12 0M15 20a6 6 0 0 0-3-5.2" {...s} />
        </svg>
      )
    case 'events':
      return (
        <svg {...c}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" {...s} />
          <path d="M3 9h18M8 3v3M16 3v3" {...s} />
        </svg>
      )
    default:
      return (
        <svg {...c}>
          <path d="M4 5h16v11H8l-4 3V5Z" {...s} />
        </svg>
      )
  }
}

function LeftSidebar() {
  return (
    <aside className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="font-display text-2xl font-extrabold tracking-tight text-forest">WN</div>
        <button className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-3 transition hover:bg-panel">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 2v2m0 16v2M2 12h2m16 0h2m-3-7-1.5 1.5M6.5 17.5 5 19m0-14 1.5 1.5M17.5 17.5 19 19"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((n) => (
          <button
            key={n.label}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition ${
              n.active ? 'bg-forest text-white shadow-sm' : 'text-ink-2 hover:bg-panel'
            }`}
          >
            <NavIcon name={n.icon} />
            {n.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="h-24 bg-gradient-to-br from-mint to-pine" />
        <div className="px-4 pb-4">
          <div className="-mt-8 mb-2 grid h-16 w-16 place-items-center rounded-full border-4 border-panel bg-forest font-display text-lg font-bold text-white">
            AM
          </div>
          <p className="font-display text-[15px] font-bold">Anime Merch</p>
          <p className="text-[12px] text-ink-4">animemerch90@gmail.com</p>
          <p className="mt-0.5 font-mono text-[11px] text-ink-3">First Year</p>
          <button className="mt-3 w-full rounded-full bg-forest py-2.5 text-[13px] font-semibold text-white transition hover:bg-forest-2">
            View Profile
          </button>
        </div>
      </div>
    </aside>
  )
}

function RightSidebar() {
  return (
    <aside className="flex h-full flex-col gap-4">
      <button className="flex items-center justify-center gap-2 rounded-3xl border border-line bg-panel py-4 font-display text-[15px] font-bold transition hover:bg-forest hover:text-white">
        Explore Campus
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h14m-6-6 6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="flex gap-1 rounded-3xl border border-line bg-panel p-1">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-forest py-2 text-[12px] font-semibold text-white">
          News Letter
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-semibold text-ink-3">
          Notification
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=760&fit=crop&auto=format"
          alt="Innovation Cell — a bright modern campus interior"
          className="h-[320px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/10 to-transparent" />
        <div className="absolute bottom-0 w-full p-4 text-white">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-display text-lg font-bold">Innovation Cell</p>
            <span className="rounded-full bg-white/25 px-2.5 py-0.5 font-mono text-[10px] uppercase backdrop-blur">
              Free
            </span>
          </div>
          <p className="mb-3 text-[12px] text-white/75">
            Build, ship and demo student projects every fortnight.
          </p>
          <button className="w-full rounded-full bg-white py-2.5 text-[13px] font-semibold text-forest transition hover:bg-white/90">
            Register
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function Root() {
  const [navOpen, setNavOpen] = useState(false)
  const [teams, setTeams] = useState(INITIAL_TEAMS)
  const [solo, setSolo] = useState(SOLO_IDS)

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="font-display text-xl font-extrabold text-forest">WN</div>
        <button
          onClick={() => setNavOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-xl border border-line"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mx-auto grid max-w-[1560px] grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[216px_minmax(0,1fr)] md:px-6 lg:grid-cols-[216px_minmax(0,1fr)_300px]">
        <div className={`${navOpen ? 'block' : 'hidden'} md:sticky md:top-6 md:block md:h-[calc(100vh-3rem)]`}>
          <LeftSidebar />
        </div>

        <main className="min-w-0">
          <Outlet context={{ teams, setTeams, solo, setSolo } } />
        </main>

        <div className="hidden lg:sticky lg:top-6 lg:block lg:h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
