"use client"

import { useMemo, useState } from "react"
import { DashboardEventsShell } from "@/components/DashboardEventsShell"
import "@/app/dashboard/dashboard.css"
import "@/components/events-pages.css"

/* ----------------------------------------------------------------------------
 * Icons — consistent 1.6 stroke set
 * ------------------------------------------------------------------------- */
const S = ({ className, children }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {children}
    </svg>
)

const Icons = {
    home: (p) => (
        <S {...p}>
            <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-4v-6h-8v6H4a1 1 0 0 1-1-1z" />
        </S>
    ),
    clubs: (p) => (
        <S {...p}>
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            <path d="M16 6.5a3 3 0 0 1 0 5.5M21 20a5.5 5.5 0 0 0-4-5.3" />
        </S>
    ),
    events: (p) => (
        <S {...p}>
            <rect x="3.5" y="5" width="17" height="16" rx="2" />
            <path d="M3.5 9.5h17M8 3v4M16 3v4" />
        </S>
    ),
    chat: (p) => (
        <S {...p}>
            <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
        </S>
    ),
    settings: (p) => (
        <S {...p}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </S>
    ),
    arrowRight: (p) => (
        <S {...p}>
            <path d="M5 12h14M13 6l6 6-6 6" />
        </S>
    ),
    arrowLeft: (p) => (
        <S {...p}>
            <path d="M19 12H5M11 18l-6-6 6-6" />
        </S>
    ),
    verified: (p) => (
        <S {...p}>
            <path d="M12 2.6c1.2 1.3 2.9 2 4.7 1.9.4 1.7 1.5 3.1 3 4-1.5.9-2.6 2.3-3 4-1.8-.1-3.5.6-4.7 1.9-1.2-1.3-2.9-2-4.7-1.9-.4-1.7-1.5-3.1-3-4 1.5-.9 2.6-2.3 3-4C9.1 4.6 10.8 3.9 12 2.6z" />
            <path d="m9 12 2 2 4-4" />
        </S>
    ),
    self: (p) => (
        <S {...p}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
        </S>
    ),
    trophy: (p) => (
        <S {...p}>
            <path d="M8 4h8v4a4 4 0 0 1-8 0z" />
            <path d="M8 5H5v1a3 3 0 0 0 3 3M16 5h3v1a3 3 0 0 1-3 3M10 12.5V15h4v-2.5M9 20h6M10 17h4v3h-4z" />
        </S>
    ),
    briefcase: (p) => (
        <S {...p}>
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
        </S>
    ),
    arrowUp: (p) => (
        <S {...p}>
            <path d="M12 20V6M6 11l6-6 6 6" />
        </S>
    ),
    flag: (p) => (
        <S {...p}>
            <path d="M5 21V4M5 4h11l-2 3 2 3H5" />
        </S>
    ),
    wrench: (p) => (
        <S {...p}>
            <path d="M14.5 6.5a4 4 0 0 1-5 5L4 17v3h3l5.5-5.5a4 4 0 0 1 5-5l-2.7 2.7-1.8-1.8z" />
        </S>
    ),
    skill: (p) => (
        <S {...p}>
            <path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9 2.6-.1-.1.9-5.4-4-3.9 5.5-.8z" />
        </S>
    ),
    users: (p) => (
        <S {...p}>
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </S>
    ),
    logout: (p) => (
        <S {...p}>
            <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 12H9M17 8l4 4-4 4" />
        </S>
    ),
    github: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
        </svg>
    ),
    linkedin: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0zM3.4 8.5h3.06V21H3.4V8.5zm5.2 0h2.93v1.71h.04c.41-.77 1.4-1.58 2.89-1.58 3.09 0 3.66 2.03 3.66 4.67V21h-3.05v-5.53c0-1.32-.02-3.02-1.84-3.02-1.84 0-2.12 1.44-2.12 2.92V21H8.6V8.5z" />
        </svg>
    ),
    x: (p) => (
        <svg {...p} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.23 2.25h6.83l4.71 6.23 5.47-6.23zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z" />
        </svg>
    ),
    globe: (p) => (
        <S {...p}>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
        </S>
    ),
}

const emphasized = ["achievement", "internship", "promotion"]

const kindMeta = {
    "club-join": { label: "Club Joined", icon: Icons.users },
    "club-leave": { label: "Club Left", icon: Icons.logout },
    promotion: { label: "Position Upgrade", icon: Icons.arrowUp },
    achievement: { label: "Achievement", icon: Icons.trophy },
    internship: { label: "Internship", icon: Icons.briefcase },
    event: { label: "Event Attended", icon: Icons.flag },
    organize: { label: "Event Organized", icon: Icons.users },
    workshop: { label: "Workshop", icon: Icons.wrench },
    skill: { label: "Skill Completed", icon: Icons.skill },
}

const MILESTONES = [
    {
        id: "m1",
        kind: "club-join",
        year: "First Year",
        date: "Aug 2022",
        title: "Joined DevDomain",
        org: "DevDomain · Coding Club",
        role: "Member",
        logo: "DD",
        detail:
            "Cleared the second-round technical interview and joined as a first-year member of the web development wing.",
        tags: ["Web", "Open Source"],
        verified: true,
    },
    {
        id: "m2",
        kind: "workshop",
        year: "First Year",
        date: "Sep 2022",
        title: "Git & GitHub Fundamentals",
        org: "DevDomain",
        role: "Attendee",
        logo: "DD",
        detail:
            "Two-day hands-on workshop covering version control, branching strategies and collaborative pull-request workflows.",
        verified: true,
    },
    {
        id: "m3",
        kind: "skill",
        year: "First Year",
        date: "Nov 2022",
        title: "Frontend with React",
        org: "Self-paced · freeCodeCamp",
        role: "Certification",
        logo: "FE",
        detail:
            "Completed a 40-hour React track — components, hooks, and state management — and shipped three practice projects.",
        tags: ["React", "JavaScript"],
        proof: "Certificate ID: FCC-REACT-8821",
        verified: false,
    },
    {
        id: "m4",
        kind: "event",
        year: "First Year",
        date: "Feb 2023",
        title: "HackNIT 2023",
        org: "Technical Society · 24hr Hackathon",
        role: "Participant",
        logo: "HN",
        detail:
            "First hackathon — built a campus lost-and-found tracker with a team of four across an overnight sprint.",
        tags: ["Firebase", "React"],
        verified: true,
    },
    {
        id: "m5",
        kind: "internship",
        year: "Second Year",
        date: "Jun 2023",
        title: "Frontend Developer Intern",
        org: "Zephyr Labs",
        role: "Summer Intern · 8 weeks",
        logo: "ZL",
        detail:
            "Built and shipped three production dashboard modules in React and TypeScript, improving first-paint time by 22%.",
        tags: ["TypeScript", "React", "Figma"],
        proof: "Offer & completion letter on file · verified by mentor",
        verified: true,
    },
    {
        id: "m6",
        kind: "achievement",
        year: "Second Year",
        date: "Oct 2023",
        title: "Winner — SIH Internal Round",
        org: "Smart India Hackathon",
        role: "Team Lead",
        logo: "SIH",
        detail:
            "Led a team of six to first place in the institute round for a real-time crowd-density monitoring solution.",
        tags: ["Computer Vision", "Node.js"],
        proof: "Winner certificate · verified by faculty coordinator",
        verified: true,
    },
    {
        id: "m7",
        kind: "promotion",
        year: "Second Year",
        date: "Jan 2024",
        title: "Promoted to Web Lead",
        org: "DevDomain · Coding Club",
        role: "Member → Web Development Lead",
        logo: "DD",
        detail:
            "Recognised for mentorship and project delivery; now leads a nine-person web wing and reviews all club deployments.",
        verified: true,
    },
    {
        id: "m8",
        kind: "organize",
        year: "Third Year",
        date: "Sep 2024",
        title: "Organized CodeSprint '24",
        org: "DevDomain",
        role: "Event Lead · Contribution: end-to-end ownership",
        logo: "DD",
        detail:
            "Owned logistics, sponsor outreach and the judging portal for a 300-participant coding contest. Raised ₹1.2L in sponsorship.",
        tags: ["Leadership", "Ops"],
        verified: true,
    },
    {
        id: "m9",
        kind: "internship",
        year: "Third Year",
        date: "Jun 2024",
        title: "SDE Intern",
        org: "Hyperion Systems",
        role: "Backend Intern · 10 weeks",
        logo: "HS",
        detail:
            "Designed and shipped a rate-limiting service handling 4M+ daily requests; converted to a pre-placement offer.",
        tags: ["Go", "Redis", "Postgres"],
        proof: "PPO letter on file · verified by HR",
        verified: true,
    },
    {
        id: "m10",
        kind: "achievement",
        year: "Third Year",
        date: "Mar 2025",
        title: "Runner-up — ACM ICPC Regionals",
        org: "ACM ICPC",
        role: "Contestant",
        logo: "ACM",
        detail:
            "Placed 2nd across 180 teams in the regional programming contest, solving 8 of 11 problems.",
        proof: "Regional scoreboard · self-added, pending verification",
        tags: ["DSA", "C++"],
        verified: false,
    },
    {
        id: "m11",
        kind: "promotion",
        year: "Final Year",
        date: "Aug 2025",
        title: "Elected Club President",
        org: "DevDomain · Coding Club",
        role: "Web Lead → President",
        logo: "DD",
        detail:
            "Elected by the core committee to lead a 60-member club; sets the annual roadmap and mentors incoming leads.",
        verified: true,
    },
    {
        id: "m12",
        kind: "skill",
        year: "Final Year",
        date: "Sep 2025",
        title: "AWS Certified Cloud Practitioner",
        org: "Amazon Web Services",
        role: "Certification",
        logo: "AWS",
        detail:
            "Passed the CLF-C02 exam covering core AWS services, security, and cloud economics.",
        proof: "Credential ID: AWS-CP-4471902",
        tags: ["AWS", "Cloud"],
        verified: true,
    },
]

/* ----------------------------------------------------------------------------
 * Small building blocks
 * ------------------------------------------------------------------------- */
function VerifyBadge({ verified }) {
    return verified ? (
        <span
            title="Verified"
            aria-label="Verified"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0a0a0a] text-white"
        >
            <Icons.verified className="h-3.5 w-3.5" />
        </span>
    ) : (
        <span
            title="Self-added"
            aria-label="Self-added"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#dcdcdc] bg-white text-[#5c5c5c]"
        >
            <Icons.self className="h-3.5 w-3.5" />
        </span>
    )
}

/* ----------------------------------------------------------------------------
 * Milestone card
 * ------------------------------------------------------------------------- */
function MilestoneCard({ m }) {
    const meta = kindMeta[m.kind]
    const isKey = emphasized.includes(m.kind)
    const isWin = m.kind === "achievement"

    return (
        <div className="relative pl-[68px] sm:pl-[80px]">
            {/* node on the rail — club/company logo or trophy */}
            <div className="absolute left-0 top-0 z-10 sm:left-1">
                {/* higher-priority milestones ripple outward as expanding wave rings */}
                {isKey && (
                    <>
                        <span className="pointer-events-none absolute inset-0 rounded-2xl border border-[#0a0a0a]/45 [animation:wave_2.6s_ease-out_infinite]" />
                        <span className="pointer-events-none absolute inset-0 rounded-2xl border border-[#0a0a0a]/45 [animation:wave_2.6s_ease-out_infinite] [animation-delay:0.87s]" />
                        <span className="pointer-events-none absolute inset-0 rounded-2xl border border-[#0a0a0a]/45 [animation:wave_2.6s_ease-out_infinite] [animation-delay:1.74s]" />
                    </>
                )}
                <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-[#dcdcdc] bg-[#f7f7f7] text-[12px] font-semibold tracking-tight text-[#5c5c5c] ring-4 ring-white sm:h-14 sm:w-14">
                    {isWin ? <Icons.trophy className="h-6 w-6" /> : m.logo}
                </div>
            </div>

            {/* card — clean, compact, static */}
            <div className="rounded-2xl border border-[#ececec] bg-white px-4 py-4 transition-all duration-200 hover:-translate-y-px hover:border-[#dcdcdc] hover:shadow-[0_16px_36px_-30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#a1a1a1]">
                        {meta.label}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-[#a1a1a1]">
                        {m.date}
                    </span>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                    <h3 className="min-w-0 truncate text-[15px] font-semibold leading-snug tracking-tight text-[#0a0a0a]">
                        {m.title}
                    </h3>
                    <VerifyBadge verified={m.verified} />
                </div>
                <p className="mt-1 truncate text-[12.5px] text-[#5c5c5c]">
                    {m.org}
                    {m.role && <span className="text-[#a1a1a1]"> · {m.role}</span>}
                </p>
            </div>
        </div>
    )
}

const EVENTS = [
    {
        club: "Fine Arts Club",
        tag: "AR",
        image:
            "https://images.unsplash.com/photo-1563341932-0c7e1870d40f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        date: "24–30 NOV",
        title: "School of Visual Art — Master Degree Thesis Exhibition",
        price: "₹10",
    },
    {
        club: "Cricket Club",
        tag: "CC",
        image:
            "https://images.unsplash.com/photo-1544056140-768470f7dbb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        date: "02–04 DEC",
        title: "Inter-Branch Premier League — Season Finale",
        price: "₹20",
    },
]


/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */
function PassportPage() {
    const groups = useMemo(() => {
        const order = []
        const map = new Map()
        for (const m of MILESTONES) {
            if (!map.has(m.year)) {
                map.set(m.year, [])
                order.push(m.year)
            }
            map.get(m.year)?.push(m)
        }
        return order.map((y) => ({
            year: y,
            items: map.get(y) ?? [],
        }))
    }, [])

    return (
        <div className="min-h-full bg-[#ffffff] text-[#0a0a0a]">
            {/* top bar */}
            <div className="sticky top-0 z-30 flex items-center gap-4 border-b border-[#ececec] bg-white/85 px-4 py-4 backdrop-blur-md sm:px-8">
                <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#0a0a0a] transition-colors hover:bg-[#f7f7f7]">
                    <Icons.arrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                    <h2 className="truncate text-[17px] font-semibold tracking-tight text-[#0a0a0a]">
                        Student Journey
                    </h2>
                    <p className="truncate text-[12.5px] text-[#5c5c5c]">
                        Production &amp; Industrial Engineering · First Year → Final Year
                    </p>
                </div>
            </div>

            <div className="px-4 py-6 sm:px-8 sm:py-8">
                {/* header — clean profile identity card */}
                <header className="overflow-hidden rounded-3xl border border-[#ececec] bg-white">
                    <div className="p-6 sm:p-8">
                        {/* identity row */}
                        <div className="flex items-start gap-4 sm:gap-5">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-[#ececec] sm:h-[76px] sm:w-[76px]">
                                <img
                                    src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                                    alt="Pawan Kumar"
                                    className="h-full w-full object-cover grayscale"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h1 className="text-[23px] font-bold leading-none tracking-tight text-[#0a0a0a] sm:text-[27px]">
                                    Pawan Kumar
                                </h1>
                                <p className="mt-2 text-[13.5px] text-[#5c5c5c]">
                                    Production &amp; Industrial Engineering · Batch of 2022–2026
                                </p>
                                <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-[#a1a1a1]">
                                    <Icons.home className="h-3.5 w-3.5" />
                                    National Institute of Technology, Kurukshetra
                                </p>
                            </div>
                        </div>

                        {/* divider + actions */}
                        <div className="mt-6 flex items-center justify-end border-t border-[#ececec] pt-5">
                            {/* social links */}
                            <div className="flex items-center gap-2">
                                {[
                                    { icon: Icons.github, label: "GitHub" },
                                    { icon: Icons.linkedin, label: "LinkedIn" },
                                    { icon: Icons.x, label: "X" },
                                    { icon: Icons.globe, label: "Website" },
                                ].map((s) => {
                                    const I = s.icon
                                    return (
                                        <a
                                            key={s.label}
                                            href="#"
                                            aria-label={s.label}
                                            className="grid h-9 w-9 place-items-center rounded-full border border-[#ececec] bg-white text-[#5c5c5c] transition-colors hover:border-[#0a0a0a] hover:text-[#0a0a0a]"
                                        >
                                            <I className="h-[17px] w-[17px]" />
                                        </a>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </header>

                {/* timeline */}
                <section className="mt-8">
                    {groups.map((g, gi) => (
                        <div key={g.year} className="relative">
                            {/* year label — centered pill */}
                            <div className="mb-5 flex justify-center">
                                <div className="inline-flex items-center gap-2.5 rounded-full border border-[#ececec] bg-white px-4 py-1.5 shadow-[0_6px_20px_-14px_rgba(0,0,0,0.5)]">
                                    <span className="font-mono text-[11px] font-semibold text-[#a1a1a1]">
                                        {String(gi + 1).padStart(2, "0")}
                                    </span>
                                    <span className="text-[13px] font-semibold tracking-tight text-[#0a0a0a]">
                                        {g.year}
                                    </span>
                                    <span className="font-mono text-[12px] text-[#a1a1a1]">
                                        {2022 + gi} – {2023 + gi}
                                    </span>
                                </div>
                            </div>

                            {/* vertical rail */}
                            <div className="relative">
                                <span className="absolute left-[23px] top-0 bottom-0 w-px bg-[#ececec] sm:left-[32px]" />
                                <div className="flex flex-col gap-4 pb-8">
                                    {g.items.map((m) => (
                                        <MilestoneCard key={m.id} m={m} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* present marker */}
                    <div className="relative pl-[68px] sm:pl-[80px]">
                        <span className="absolute left-[23px] top-1 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full border-2 border-[#0a0a0a] bg-white ring-4 ring-white sm:left-[32px]">
                            <span className="h-2 w-2 rounded-full bg-[#0a0a0a]" />
                        </span>
                        <p className="pt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#0a0a0a]">
                            Present · the story continues
                        </p>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default function App() {
    return (
        <DashboardEventsShell>
            <PassportPage />
        </DashboardEventsShell>
    )
}