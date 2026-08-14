"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from "next/navigation";
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


const av = (id, w = 160) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${w}&fit=crop&auto=format`

const teams = [
  {
    id: 't1',
    name: 'Quantum Loop',
    project: 'Smart India Hackathon 2026 — AI campus navigator',
    category: 'Hackathon',
    needed: 1,
    lead: 'Ananya Rao',
    members: [
      { id: 'm1', name: 'Ananya Rao', branch: 'Computer Science', year: 'Third Year', avatar: av('photo-1494790108377-be9c29b29330'), role: 'Team Lead · ML' },
      { id: 'm2', name: 'Kabir Menon', branch: 'Electronics & Comm.', year: 'Second Year', avatar: av('photo-1500648767791-00dcc994a43e'), role: 'Backend' },
      { id: 'm3', name: 'Ishita Verma', branch: 'Computer Science', year: 'Third Year', avatar: av('photo-1534528741775-53994a69daeb'), role: 'Design' },
    ],
  },
  {
    id: 't2',
    name: 'Grid Runners',
    project: 'Formula Student — electric drivetrain telemetry',
    category: 'Robotics',
    needed: 2,
    lead: 'Dev Sharma',
    members: [
      { id: 'm4', name: 'Dev Sharma', branch: 'Mechanical', year: 'Fourth Year', avatar: av('photo-1506794778202-cad84cf45f1d'), role: 'Team Lead' },
      { id: 'm5', name: 'Naina Gupta', branch: 'Electrical', year: 'Third Year', avatar: av('photo-1517841905240-472988babdf9'), role: 'Powertrain' },
    ],
  },
  {
    id: 't3',
    name: 'Frame 24',
    project: 'Inter-college short film · sci-fi anthology',
    category: 'Creative',
    needed: 3,
    lead: 'Rohan Nair',
    members: [
      { id: 'm6', name: 'Rohan Nair', branch: 'Architecture', year: 'Fourth Year', avatar: av('photo-1519085360753-af0119f7cbe7'), role: 'Director' },
      { id: 'm7', name: 'Meera Iyer', branch: 'Humanities', year: 'Second Year', avatar: av('photo-1544005313-94ddf0286df2'), role: 'Writer' },
    ],
  },
  {
    id: 't4',
    name: 'Ledger Labs',
    project: 'ETHIndia — on-chain attendance & credentials',
    category: 'Hackathon',
    needed: 1,
    lead: 'Aditya Bose',
    members: [
      { id: 'm8', name: 'Aditya Bose', branch: 'Computer Science', year: 'Third Year', avatar: av('photo-1502685104226-ee32379fefbe'), role: 'Team Lead · Solidity' },
      { id: 'm9', name: 'Sara Khan', branch: 'Information Tech.', year: 'Second Year', avatar: av('photo-1508214751196-bcfd4ca60f91'), role: 'Frontend' },
      { id: 'm10', name: 'Yash Pillai', branch: 'Computer Science', year: 'Third Year', avatar: av('photo-1531427186611-ecfd6d936c79'), role: 'Full-stack' },
    ],
  },
  {
    id: 't5',
    name: 'Solaris',
    project: 'Shell Eco-marathon — solar vehicle build',
    category: 'Robotics',
    needed: 2,
    lead: 'Tara Deshmukh',
    members: [
      { id: 'm11', name: 'Tara Deshmukh', branch: 'Mechanical', year: 'Fourth Year', avatar: av('photo-1487412720507-e7ab37603c6f'), role: 'Team Lead' },
      { id: 'm12', name: 'Farhan Ali', branch: 'Electrical', year: 'Third Year', avatar: av('photo-1463453091185-61582044d556'), role: 'Systems' },
    ],
  },
]

const seekers = [
  {
    id: 's1',
    name: 'Aryan Kapoor',
    branch: 'Computer Science',
    year: 'Second Year',
    avatar: av('photo-1500648767791-00dcc994a43e'),
    headline: 'Full-stack dev looking for a hackathon squad',
    skills: ['React', 'Node.js', 'PostgreSQL'],
    looking: 'A hackathon team for Smart India Hackathon 2026. I can own the entire web stack and love shipping fast.',
  },
  {
    id: 's2',
    name: 'Priya Sundaram',
    branch: 'Design (B.Des)',
    year: 'Third Year',
    avatar: av('photo-1534528741775-53994a69daeb'),
    headline: 'Product designer — UX, prototyping, motion',
    skills: ['Figma', 'UX Research', 'Framer'],
    looking: 'Any team that needs design leadership. I turn rough ideas into polished, usable products.',
  },
  {
    id: 's3',
    name: 'Nikhil Reddy',
    branch: 'Electronics & Comm.',
    year: 'Third Year',
    avatar: av('photo-1531427186611-ecfd6d936c79'),
    headline: 'Embedded + robotics enthusiast',
    skills: ['C/C++', 'PCB Design', 'ROS'],
    looking: 'A robotics or Formula Student team. Comfortable with firmware, sensors and control systems.',
  },
  {
    id: 's4',
    name: 'Sanya Malhotra',
    branch: 'Information Tech.',
    year: 'Second Year',
    avatar: av('photo-1508214751196-bcfd4ca60f91'),
    headline: 'ML student, first hackathon',
    skills: ['Python', 'PyTorch', 'Pandas'],
    looking: 'A beginner-friendly team to learn and contribute on an ML-heavy project.',
  },
  {
    id: 's5',
    name: 'Karan Joshi',
    branch: 'Mechanical',
    year: 'Fourth Year',
    avatar: av('photo-1506794778202-cad84cf45f1d'),
    headline: 'CAD + manufacturing lead',
    skills: ['SolidWorks', 'CFD', 'Fabrication'],
    looking: 'A vehicle or drone build team for a final-year capstone-worthy project.',
  },
  {
    id: 's6',
    name: 'Zoya Sheikh',
    branch: 'Humanities',
    year: 'First Year',
    avatar: av('photo-1544005313-94ddf0286df2'),
    headline: 'Writer & content strategist',
    skills: ['Copywriting', 'Storyboarding', 'Editing'],
    looking: 'A creative or film team where I can shape narrative and outreach.',
  },
]

const currentUser = {
  name: 'Anime Merch',
  email: 'animemerch90@gmail.com',
  year: 'First Year',
  avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=160&h=160&fit=crop&auto=format',
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */


export function TeamFinderPage({ initialView = "teams" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [teamsData, setTeamsData] = useState([]);
  const [seekersData, setSeekersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch("/api/forms/team-finder", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Could not load TeamFinder")))
      .then((data) => {
        if (!ignore) {
          setTeamsData(data.teams || []);
          setSeekersData(data.solo || []);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [refreshKey]);

  const parts = pathname.split("/").filter(Boolean);
  const section = parts[2] === "teamfinder" ? parts[3] : initialView;
  const id = decodeURIComponent(parts[4] || "");
  const viewName = section === "members" ? (id ? "seeker" : "seekers") : (id ? "team" : "teams");
  const team = viewName === "team" ? teamsData.find((t) => t.id === id) : null;
  const seeker = viewName === "seeker" ? seekersData.find((s) => s.id === id) : null;

  return (
    <main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]">
      {viewName === 'teams' && (
        <TeamsView
          teams={teamsData} loading={loading} onRefresh={() => setRefreshKey((k) => k + 1)} onOpen={(id) => router.push(`/dashboard/teamfinder/teams/${encodeURIComponent(id)}`)}
          onFindMembers={() => router.push('/dashboard/teamfinder/members')}
        />
      )}
      {viewName === 'team' && team && (
        <TeamDetailView team={team} onBack={() => router.push('/dashboard/teamfinder/teams')} />
      )}
      {viewName === 'seekers' && (
        <SeekersView
          seekers={seekersData} loading={loading} onOpen={(id) => router.push(`/dashboard/teamfinder/members/${encodeURIComponent(id)}`)}
          onBack={() => router.push('/dashboard/teamfinder/teams')}
        />
      )}
      {viewName === 'seeker' && seeker && (
        <SeekerDetailView seeker={seeker} onBack={() => router.push('/dashboard/teamfinder/members')} />
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
          onClick={onBack || (() => router.back())}
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
    const message = value.trim()
    const res = await fetch('/api/team-finder/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId, target, message }),
    })
    if (res.ok) setSent(message)
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
            <Send size={16} />
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

/* ------------------------------------------------------------------ */
/* View 1 — Teams looking for members                                  */
/* ------------------------------------------------------------------ */

function TeamsView({
  teams: teamsList = [],
  loading = false,
  onOpen,
  onFindMembers,
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const list = teamsList

  return (
    <div className="view-in">
      <PageHeader
        title="Join a Team"
        subtitle={loading ? "Loading teams..." : `${teamsList.length} teams are looking for members`}
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


      <div className="flex flex-col gap-3 sm:px-3.5 pb-1.5">
        {loading ? <p className="px-4 py-6 text-sm text-[#71717a]">Loading TeamFinder...</p> : list.map((t) => (
          <TeamCard key={t.id} team={t} onOpen={() => onOpen(t.id)} />
        ))}
      </div>
      <FinishProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}

function FinishProfileModal({ open, onClose }) {
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  if (!open) return null
  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/team-finder/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) })
      if (!res.ok) throw new Error('Could not save')
      onClose()
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-5 backdrop-blur-[3px]" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-[28px] border border-[#eeeeed] bg-white p-6 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.35)]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[21px] font-extrabold tracking-[-0.02em]">Finish TeamFinder profile</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#71717a]">Add a short message shown on your member detail page so teams know what you can contribute.</p>
        <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 600))} rows={5} placeholder="I am looking for a team where I can contribute..." className="mt-5 w-full resize-none rounded-2xl border border-[#e0e0de] bg-white p-3 text-[14px] outline-none focus:border-[#0a0a0a]/50" />
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full bg-[#eceef1] py-3 text-[14px] font-semibold">Cancel</button>
          <button onClick={save} disabled={saving || !description.trim()} className="flex-1 rounded-full bg-black py-3 text-[14px] font-semibold text-white disabled:opacity-40">{saving ? 'Saving...' : 'Save'}</button>
        </div>
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
              <p className="mt-2.5 text-[15px] leading-snug text-[#71717a]">{team.project}</p>
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
            <li key={m.id} onClick={() => m.userId && window.location.assign(`/dashboard/profile/${m.userId}`)} className="flex cursor-pointer items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-[#f6f6f5]">
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
            target={{ kind: 'team', teamId: team.id }}
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* View 3 — Members looking for a team                                 */
/* ------------------------------------------------------------------ */

function SeekersView({ seekers: seekersList = [], loading = false, onOpen, onBack }) {
  return (
    <div className="view-in">
      <PageHeader
        title="Find Members"
        subtitle={loading ? "Loading members..." : `${seekersList.length} students are looking for a team`}
        onBack={onBack}
      />

      <div className="flex flex-col gap-3 sm:px-3.5 pb-1.5">
        {loading ? <p className="px-4 py-6 text-sm text-[#71717a]">Loading TeamFinder...</p> : seekersList.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpen(s.id)}
            className="group flex items-center gap-4 rounded-[22px] border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition cursor-pointer bg-[#ffffff] p-4 text-left"
          >
            <Avatar src={s.avatar} alt={s.name} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15.5px] font-bold tracking-[-0.01em]">{s.name}</p>
              <p className="truncate text-[13px] text-[#71717a]">
                {s.branch} · {s.year}
              </p>
              <p className="mt-1.5 line-clamp-1 text-[13.5px] text-[#0a0a0a]/70">
                {s.headline}
              </p>
            </div>
            <ArrowRight size={18} className="shrink-0 text-[#a1a1aa] transition-all group-hover:translate-x-0.5 group-hover:text-[#0a0a0a]" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* View 4 — Seeker detail + invite composer                            */
/* ------------------------------------------------------------------ */

function SeekerDetailView({ seeker, onBack }) {
  return (
    <div className="view-in">
      <PageHeader title={seeker.name} subtitle="Looking for a team" onBack={onBack} />

      <div className="flex flex-col gap-3 sm:px-3.5 pb-1.5">
        <section className="rounded-[28px] border border-[#eeeeed] bg-[#ffffff] p-7">
          <div className="flex items-center gap-4">
            <button onClick={() => seeker.userId && window.location.assign(`/dashboard/profile/${seeker.userId}`)} className="rounded-full"><Avatar src={seeker.avatar} alt={seeker.name} size={74} /></button>
            <div className="min-w-0">
              <button onClick={() => seeker.userId && window.location.assign(`/dashboard/profile/${seeker.userId}`)} className="text-left"><h2 className="text-[21px] font-extrabold tracking-[-0.01em]">{seeker.name}</h2></button>
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
            target={{ kind: 'users', userIds: [seeker.id] }}
          />
        </div>
      </div>
    </div>
  )
}
