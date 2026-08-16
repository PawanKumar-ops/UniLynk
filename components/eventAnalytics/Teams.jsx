import { useState } from 'react'
import { REGISTRANTS } from '@/data/analytics'
import { Avatar, Chip } from './ui'

const byId = new Map(REGISTRANTS.map((r) => [r.id, r]))

function statusOf(members, capacity) {
  return members >= capacity ? 'completed' : 'partial'
}


function Grip() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-ink-4">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}

export function Teams({
  teams,
  setTeams,
  solo,
  setSolo,
}) {
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)

  const move = (payload, to) => {
    if (payload.from === to) return
    let nextSolo = [...solo]
    let nextTeams = teams.map((t) => ({ ...t, members: [...t.members] }))

    if (payload.from === 'solo') {
      nextSolo = nextSolo.filter((id) => id !== payload.registrantId)
    } else {
      nextTeams = nextTeams.map((t) =>
        t.id === payload.from
          ? { ...t, members: t.members.filter((m) => m.registrantId !== payload.registrantId) }
          : t,
      )
    }

    if (to === 'solo') {
      if (!nextSolo.includes(payload.registrantId)) nextSolo.push(payload.registrantId)
    } else {
      nextTeams = nextTeams.map((t) => {
        if (t.id !== to) return t
        if (t.members.some((m) => m.registrantId === payload.registrantId)) return t
        const role = t.members.length === 0 ? 'leader' : 'member'
        return { ...t, members: [...t.members, { registrantId: payload.registrantId, role }] }
      })
    }

    nextTeams = nextTeams.map((t) => ({ ...t, status: statusOf(t.members.length, t.capacity) }))
    setTeams(nextTeams)
    setSolo(nextSolo)
    setDrag(null)
    setOver(null)
  }

  const completed = teams.filter((t) => t.status === 'completed')
  const partial = teams.filter((t) => t.status === 'partial')

  const memberRow = (registrantId, from, role) => {
    const r = byId.get(registrantId)
    if (!r) return null
    const dragging = drag?.registrantId === registrantId
    return (
      <div
        key={registrantId}
        draggable
        onDragStart={() => setDrag({ registrantId, from })}
        onDragEnd={() => {
          setDrag(null)
          setOver(null)
        }}
        className={`flex cursor-grab items-center gap-2.5 rounded-2xl border bg-panel px-2.5 py-2 transition active:cursor-grabbing ${
          dragging ? 'border-forest opacity-50' : 'border-line hover:border-forest/30 hover:shadow-sm'
        }`}
      >
        <Grip />
        <Avatar name={r.name} hue={r.avatarHue} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-ink">{r.name}</p>
          <p className="truncate font-mono text-[10px] text-ink-4">
            {r.branch} · {r.year.split(' ')[0]} yr
          </p>
        </div>
        {role && <Chip tone={role === 'leader' ? 'solid' : 'muted'}>{role}</Chip>}
      </div>
    )
  }

  const teamCard = (t) => {
    const isOver = over === t.id
    const pct = Math.round((t.members.length / t.capacity) * 100)
    return (
      <div
        key={t.id}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(t.id)
        }}
        onDragLeave={() => setOver((o) => (o === t.id ? null : o))}
        onDrop={(e) => {
          e.preventDefault()
          if (drag) move(drag, t.id)
        }}
        className={`flex flex-col rounded-3xl border bg-panel p-4 shadow-[0_1px_2px_rgba(16,35,28,0.04)] transition ${
          isOver ? 'border-forest ring-2 ring-forest/15' : 'border-line'
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-display text-[16px] font-bold leading-tight text-ink">{t.name}</h4>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-4">
              {t.members.length}/{t.capacity} members
            </p>
          </div>
          <Chip tone={t.status === 'completed' ? 'solid' : 'gold'}>
            {t.status === 'completed' ? '✓ complete' : 'partial'}
          </Chip>
        </div>

        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-mint-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: t.status === 'completed' ? '#0f3d31' : 'linear-gradient(90deg,#5f9a86,#0f3d31)',
            }}
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {t.members.map((m) => memberRow(m.registrantId, t.id, m.role))}
          {Array.from({ length: Math.max(0, t.capacity - t.members.length) }).map((_, i) => (
            <div
              key={i}
              className={`grid h-[48px] place-items-center rounded-2xl border border-dashed text-[11px] transition ${
                isOver ? 'border-forest/50 bg-mint-3 text-forest' : 'border-line text-ink-4'
              }`}
            >
              {isOver ? 'Drop to add' : 'Empty slot'}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint-3 text-forest">
          <Grip />
        </span>
        <p className="text-[12px] text-ink-3">
          <span className="font-semibold text-ink-2">Drag &amp; drop</span> members between teams or
          from the solo pool to complete every squad — status updates automatically.
        </p>
      </div>

      <Group title="Completed teams" count={completed.length} tone="solid">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{completed.map(teamCard)}</div>
      </Group>

      <Group title="Partially completed" count={partial.length} tone="gold">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{partial.map(teamCard)}</div>
      </Group>

      <div>
        <div className="mb-3 flex items-center gap-2.5">
          <h3 className="font-display text-[18px] font-bold text-ink">Solo — unassigned</h3>
          <Chip>{solo.length}</Chip>
        </div>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setOver('solo')
          }}
          onDragLeave={() => setOver((o) => (o === 'solo' ? null : o))}
          onDrop={(e) => {
            e.preventDefault()
            if (drag) move(drag, 'solo')
          }}
          className={`grid grid-cols-1 gap-2.5 rounded-3xl border p-4 transition sm:grid-cols-2 xl:grid-cols-3 ${
            over === 'solo' ? 'border-forest bg-mint-3 ring-2 ring-forest/15' : 'border-dashed border-line'
          }`}
        >
          {solo.length === 0 && (
            <p className="col-span-full py-8 text-center text-[13px] text-ink-4">
              Everyone has been placed on a team 🎉
            </p>
          )}
          {solo.map((id) => memberRow(id, 'solo'))}
        </div>
      </div>
    </div>
  )
}

function Group({
  title,
  count,
  tone = 'default',
  children,
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <h3 className="font-display text-[18px] font-bold text-ink">{title}</h3>
        <Chip tone={tone}>{count}</Chip>
      </div>
      {children}
    </div>
  )
}
