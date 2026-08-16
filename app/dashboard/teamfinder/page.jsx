"use client"

import { useEffect, useState } from 'react'
import { useRouter } from "next/navigation";
import { Icon } from '@iconify/react';
import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  Home,
  MessageSquare,
  Send,
  Settings,
  UserSearch,
  Users,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */


function TeamFinderPage() {
  const [view, setView] = useState({ name: 'teams' })
  const [data, setData] = useState({ teams: [], seekers: [] })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/forms/team-finder', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not load Team Finder')
      setData({ teams: json.teams || [], seekers: json.solo || [] })
    } catch (error) {
      console.error(error)
      setData({ teams: [], seekers: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const team = view.name === "team" ? data.teams.find((t) => t.id === view.id) : null;
  const seeker = view.name === "seeker" ? data.seekers.find((s) => s.id === view.id) : null;

  return (
    <main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]">
      {view.name === 'teams' && (
        <TeamsView
          teams={data.teams}
          loading={loading}
          onRefresh={load}
          onOpen={(id) => setView({ name: 'team', id })}
          onFindMembers={() => setView({ name: 'seekers' })}
        />
      )}
      {view.name === 'team' && team && (
        <TeamDetailView team={team} onBack={() => setView({ name: 'teams' })} />
      )}
      {view.name === 'seekers' && (
        <SeekersView
          seekers={data.seekers}
          onOpen={(id) => setView({ name: 'seeker', id })}
          onBack={() => setView({ name: 'teams' })}
        />
      )}
      {view.name === 'seeker' && seeker && (
        <SeekerDetailView seeker={seeker} onBack={() => setView({ name: 'seekers' })} />
      )}
    </main>
  )
}

export default function App() {
  return (
    <DashboardEventsShell>
      <TeamFinderPage />
    </DashboardEventsShell>
  )
}

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

function Avatar({ src, alt, size = 44 }) {
  return (
    <span
      className="inline-block shrink-0 overflow-hidden rounded-full bg-[#f4f4f3] ring-1 ring-black/[0.06]"
      style={{ width: size, height: size }}
    >
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </span>
  )
}

// Mock data removed. Real data is fetched from the API via `/api/forms/team-finder` and stored in state.
// The component now relies on the `data` state populated by the `load` function.

function AvatarStack({ members }) {
  return (
    <div className="flex -space-x-2">
      {members.slice(0, 4).map((m) => (
        <span key={m.id} className="rounded-full ring-2 ring-[#ffffff]">
          <Avatar src={m.avatar} alt={m.name} size={26} />
        </span>
      ))}
    </div>
  )
}

function Monogram({ name, size = 48 }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  return (
    <span
      className="grid shrink-0 place-items-center rounded-2xl bg-[#f5f5f3] font-bold tracking-tight text-[#292929]"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </span>
  )
}

function Label({ children }) {
  return (
    <span className="rounded-md border border-[#e0e0de] px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#71717a]">
      {children}
    </span>
  )
}

function PageHeader({
  title,
  subtitle,
  onBack,
  action,
}) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-50 mb-5 flex h-[54px] items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Left */}
      <div
        className="flex min-w-0 items-center"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >

        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="mr-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>


        <div className="min-w-0">
          <h1 className="truncate text-[20px] font-bold leading-5 text-black">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-0.5 truncate text-[13px] leading-4 text-[#536471]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-1.5">
        {action}
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Success modal                                                       */
/* ------------------------------------------------------------------ */

function SuccessModal({
  open,
  onClose,
  recipient,
  message,
  kind,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="modal-in w-full max-w-[400px] overflow-hidden rounded-[28px] border border-[#eeeeed] bg-[#ffffff] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center px-8 pb-6 pt-9 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-[#0a0a0a]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12.5 9.5 18 20 6.5"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: 30,
                  animation: 'drawCheck 0.5s ease-out 0.15s forwards',
                }}
              />
            </svg>
          </span>

          <h2 className="mt-5 text-[21px] font-extrabold tracking-[-0.02em]">
            {kind === 'request' ? 'Request sent' : 'Invite sent'}
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#71717a]">
            Your message to <span className="font-semibold text-[#0a0a0a]">{recipient}</span>{' '}
            is on its way. You&apos;ll be notified as soon as they respond.
          </p>

          <div className="mt-5 w-full rounded-2xl border border-[#eeeeed] bg-[#f6f6f5] p-4 text-left">
            <p className="line-clamp-3 text-[13.5px] leading-relaxed text-[#0a0a0a]/80">
              &ldquo;{message}&rdquo;
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-[#0a0a0a] py-3.5 text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

/* Composer used on both detail pages. */
function MessageComposer({
  recipient,
  label,
  placeholder,
  hint,
  cta,
  kind,
  formId,
  target,
}) {
  const [value, setValue] = useState('')
  const [sent, setSent] = useState(null)

  const send = async () => {
    if (!value.trim() || !formId || !target) return
    const res = await fetch('/api/team-finder/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId, target, message: value.trim() }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Could not send request')
      return
    }
    setSent(value.trim())
  }

  return (
    <div>
      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.09em] text-[#a1a1aa]">
        {label}
      </p>
      <div className="rounded-3xl border border-[#e0e0de] bg-[#ffffff] p-2.5 transition-all focus-within:border-[#0a0a0a]/50 focus-within:shadow-[0_0_0_4px_rgba(10,10,10,0.05)]">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none bg-transparent px-3 pt-2 text-[15px] leading-relaxed text-[#0a0a0a] outline-none placeholder:text-[#a1a1aa]"
        />
        <div className="flex items-center justify-between gap-3 pl-3 pr-1 pb-1">
          <span className="text-[12px] font-medium text-[#a1a1aa]">{hint}</span>
          <button
            onClick={send}
            disabled={!value.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-25"
          >
            {cta}

          </button>
        </div>
      </div>

      <SuccessModal
        open={sent !== null}
        onClose={() => {
          setSent(null)
          setValue('')
        }}
        recipient={recipient}
        message={sent ?? ''}
        kind={kind}
      />
    </div>
  )
}


function FinishProfileModal({ open, onClose, onSaved }) {
  const [formId, setFormId] = useState('')
  const [events, setEvents] = useState([])
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/forms/publics', { cache: 'no-store' })
      .then((r) => r.json())
      .then((forms) => {
        const teamEvents = (Array.isArray(forms) ? forms : []).filter((f) => f.isTeam || f.isTeamEvent)
        setEvents(teamEvents)
        setFormId((current) => current || String(teamEvents[0]?._id || teamEvents[0]?.id || ''))
      })
      .catch(console.error)
  }, [open])

  const save = async () => {
    if (!formId || !description.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/forms/team-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, type: 'solo', description }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not finish profile')
      onSaved?.()
      onClose()
      setDescription('')
    } catch (e) {
      alert(e.message || 'Could not finish profile')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-[3px]" onClick={onClose}>
      <div className="w-full max-w-[430px] rounded-[28px] border border-[#eeeeed] bg-white p-6 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.35)]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[21px] font-extrabold tracking-[-0.02em]">Finish TeamFinder profile</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#71717a]">Add the message shown on your seeker detail page.</p>
        <select value={formId} onChange={(e) => setFormId(e.target.value)} className="mt-5 h-11 w-full rounded-2xl border border-[#e0e0de] px-3 text-[14px] outline-none">
          {events.map((event) => <option key={event._id || event.id} value={event._id || event.id}>{event.title || event.name || 'Team event'}</option>)}
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={500} placeholder="Tell teams what you can contribute, your interests, availability, and preferred role..." className="mt-3 w-full resize-none rounded-2xl border border-[#e0e0de] p-3 text-[14px] outline-none" />
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-[#e0e0de] py-3 text-[14px] font-semibold">Cancel</button>
          <button onClick={save} disabled={saving || !formId || !description.trim()} className="flex-1 rounded-full bg-[#0a0a0a] py-3 text-[14px] font-semibold text-white disabled:opacity-30">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* View 1 — Teams looking for members                                  */
/* ------------------------------------------------------------------ */

function TeamsView({ teams, loading, onRefresh, onOpen, onFindMembers }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const list = teams

  return (
    <div className="view-in">
      <PageHeader
        title="Join a Team"
        subtitle={`${teams.length} teams are looking for members`}
        action={
          <div className='flex items-center gap-1.5'>
            <div className="group relative">
              <button
                onClick={() => setProfileOpen(true)}
                aria-label="Find members looking for a team"
                className="rounded-full flex items-center justify-center border h-9 w-9 border-[#e0e0de] bg-[#ffffff] text-[13px] font-semibold transition-colors hover:bg-[#f4f4f3]"
              >
                <Icon
                  icon="solar:clipboard-add-linear"
                  className="text-[18px]"
                />
              </button>
              <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                Finish Profile
              </div>
            </div>
            <button
              onClick={onFindMembers}
              aria-label="Find members looking for a team"
              className="inline-flex items-center gap-2 rounded-full border border-[#e0e0de] bg-[#ffffff] py-2 pl-3 pr-3.5 text-[13px] font-semibold transition-colors hover:bg-[#f4f4f3]"
            >
              <Icon
                icon="solar:user-linear"
                className="text-[18px]"
              />
              <span className="hidden sm:inline">Find members</span>
            </button>
          </div>
        }
      />

      <FinishProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      <div className="flex flex-col gap-3 sm:px-3.5 pb-1.5">
        {loading ? (
          <p className="px-4 text-[13px] text-[#71717a]">
            Loading teams...
          </p>
        ) : list.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center px-4 text-center">
            <div className="mb-6 flex h-[220px] w-[280px] max-w-[80vw] items-center justify-center">
              <img
                src="/illuistrations/noTeam.svg"
                alt="No teams available"
                className="h-full w-full object-contain"
              />
            </div>

            <h3 className="text-[17px] font-bold tracking-[-0.01em]">
              No teams yet
            </h3>

            <p className="mt-1.5 max-w-[320px] text-[13.5px] leading-relaxed text-[#71717a]">
              There are no teams looking for members right now. Check back later or
              create your Team.
            </p>
          </div>
        ) : (
          list.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              onOpen={() => onOpen(t.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TeamCard({ team, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="group rounded-[26px] border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition cursor-pointer bg-[#ffffff] p-5 text-left"
    >
      <div className="flex items-start gap-4">
        <Monogram name={team.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[17px] font-bold tracking-[-0.01em]">{team.name}</h3>

          </div>
          <p className="mt-1 line-clamp-1 text-[14px] text-[#71717a]">{team.project}</p>
        </div>
        <span className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full  bg-[#f5f5f3] px-3 py-1.5 text-[12px] font-semibold text-[#292929]">
          {team.needed} {team.needed === 1 ? 'spot' : 'spots'}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#eeeeed] pt-4">
        <div className="flex items-center gap-3">
          <AvatarStack members={team.members} />
          <span className="text-[13px] font-medium text-[#71717a]">
            {team.members.length} members · led by {team.lead.split(' ')[0]}
          </span>
        </div>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* View 2 — Team detail + join request composer                        */
/* ------------------------------------------------------------------ */

function TeamDetailView({ team, onBack }) {
  const router = useRouter()
  return (
    <div className="view-in">
      <PageHeader title={team.name} onBack={onBack} />

      <div className="flex flex-col gap-3 sm:px-3.5 pb-1.5">
        <section className="rounded-[28px] border border-[#eeeeed] bg-[#ffffff] p-7 ">
          <div className="flex items-center gap-2.5">
            <Label>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#71717a]">

                {team.needed} {team.needed === 1 ? 'spot' : 'spots'} left
              </span>
            </Label>
          </div>

          <div className="mt-5 flex items-start gap-4">
            <Monogram name={team.name} size={60} />
            <div className="min-w-0 pt-0.5">
              <h2 className="text-[27px] font-extrabold leading-none tracking-[-0.03em]">
                {team.name}
              </h2>
              <p className="mt-2.5 text-[15px] leading-snug text-[#71717a]">{team.eventTitle}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-[#eeeeed] pt-5">
            <AvatarStack members={team.members} />
            <span className="text-[13.5px] font-medium text-[#71717a]">
              {team.members.length} members onboard · led by {team.lead.split(' ')[0]}
            </span>
          </div>
        </section>

        <div className="mt-8 flex items-baseline justify-between">
          <h3 className="text-[15px] font-bold tracking-[-0.01em]">Team members</h3>
          <span className="text-[13px] font-medium text-[#71717a]">
            {team.members.length} people
          </span>
        </div>

        <ul className="mt-3 flex flex-col divide-y divide-[#eeeeed] overflow-hidden rounded-[22px] border border-[#eeeeed]">
          {team.members.map((m) => (
            <li key={m.id} onClick={() => m.userId && router.push(`/dashboard/Userprofile?userId=${encodeURIComponent(m.userId)}`)} className="flex cursor-pointer items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-[#f6f6f5]">
              <Avatar src={m.avatar} alt={m.name} size={46} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{m.name}</p>
                <p className="truncate text-[13px] text-[#71717a]">
                  {m.branch} · {m.year}
                </p>
              </div>
              {m.role && <Label>{m.role}</Label>}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <MessageComposer
            recipient={team.lead}
            kind="request"
            cta="Send request"
            label="Introduce yourself"
            placeholder={`Hi ${team.lead.split(' ')[0]}, I'd love to join ${team.name}. Here's what I can bring to the team…`}
            hint="Shared with the team lead."
            formId={team.formId}
            target={{ kind: "team", teamId: team.id }}
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* View 3 — Members looking for a team                                 */
/* ------------------------------------------------------------------ */

function SeekersView({ seekers, onOpen, onBack }) {
  return (
    <div className="view-in">
      <PageHeader
        title="Find Members"
        subtitle={`${seekers.length} students are looking for a team`}
        onBack={onBack}
      />

      <div className="flex flex-col gap-3 sm:px-3.5 pb-1.5">
      
{seekers.length === 0 ? (
  <div className="flex min-h-[420px] flex-col items-center justify-center px-4 text-center">
    <div className="mb-6 flex h-[220px] w-[280px] max-w-[80vw] items-center justify-center">
      <img
        src="/illuistrations/noMember.svg"
        alt="No members found"
        className="h-full w-full object-contain"
      />
    </div>

    <h3 className="text-[17px] font-bold tracking-[-0.01em]">
      No members found
    </h3>

    <p className="mt-1.5 max-w-[320px] text-[13.5px] leading-relaxed text-[#71717a]">
      No students are looking for a team right now. Check back later to
      find members for your team.
    </p>
  </div>
) : (
            seekers.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpen(s.id)}
                className="group flex items-center gap-4 rounded-[22px] border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition cursor-pointer bg-[#ffffff] p-4 text-left"
              >
                <Avatar src={s.avatar} alt={s.name} size={52} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15.5px] font-bold tracking-[-0.01em]">
                    {s.name}
                  </p>

                  <p className="truncate text-[13px] text-[#71717a]">
                    {s.branch} · {s.year}
                  </p>

                  <p className="mt-1.5 line-clamp-1 text-[13.5px] text-[#0a0a0a]/70">
                    {s.headline}
                  </p>
                </div>

                <ArrowRight
                  size={18}
                  className="shrink-0 text-[#a1a1aa] transition-all group-hover:translate-x-0.5 group-hover:text-[#0a0a0a]"
                />
              </button>
            ))
          )}
        
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* View 4 — Seeker detail + invite composer                            */
/* ------------------------------------------------------------------ */

function SeekerDetailView({ seeker, onBack }) {
  const router = useRouter()
  return (
    <div className="view-in">
      <PageHeader title={seeker.name} subtitle={`${seeker.branch} · ${seeker.year}`} onBack={onBack} />

      <div className="flex flex-col gap-3 sm:px-3.5 pb-1.5">
        <section className="rounded-[28px] border border-[#eeeeed] bg-[#ffffff] p-7">
          <div className="flex items-center gap-4">
            <button onClick={() => seeker.userId && router.push(`/dashboard/Userprofile?userId=${encodeURIComponent(seeker.userId)}`)}><Avatar src={seeker.avatar} alt={seeker.name} size={74} /></button>
            <div className="min-w-0">
              <button onClick={() => seeker.userId && router.push(`/dashboard/Userprofile?userId=${encodeURIComponent(seeker.userId)}`)} className="text-left"><h2 className="text-[21px] font-extrabold tracking-[-0.01em]">{seeker.name}</h2></button>
              <p className="text-[14px] font-medium text-[#71717a]">
                {seeker.branch} · {seeker.year}
              </p>
            </div>
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-[#0a0a0a]/85">
            {seeker.looking}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {seeker.skills.map((sk) => (
              <span
                key={sk}
                className="rounded-full border border-[#e0e0de] px-3 py-1.5 text-[12.5px] font-semibold text-[#0a0a0a]/75"
              >
                {sk}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-8">
          <MessageComposer
            recipient={seeker.name}
            kind="invite"
            cta="Send invite"
            label="Invite to your team"
            placeholder={`Hey ${seeker.name.split(' ')[0]}, we think you'd be a great fit for our team. Want to chat about joining?`}
            hint={`Sent directly to ${seeker.name.split(' ')[0]}.`}
            formId={seeker.formId}
            target={{ kind: "users", userIds: [seeker.id] }}
          />
        </div>
      </div>
    </div>
  )
}
