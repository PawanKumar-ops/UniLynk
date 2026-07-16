"use client"

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Icon } from "@iconify/react";

const STUDENT_STEPS = [
  {
    icon: "solar:user-outline",
    title: "Build your profile",
    desc: "Add your skills, achievements and interests so clubs and teams can discover you.",
  },
  {
    icon: "solar:users-group-rounded-line-duotone",
    title: "Find or form a team",
    desc: "Use TeamFinder to filter peers by skill and send invites, or join an open team.",
  },
  {
    icon: "solar:chat-square-call-line-duotone",
    title: "Chat & collaborate",
    desc: "Message anyone on campus, follow your favourite clubs and stay in the loop.",
  },
];

const CLUB_STEPS = [
  {
    icon: "solar:buildings-2-linear",
    title: "Register your club",
    desc: "Set up a club profile with logo, category and admin team in a few minutes.",
  },
  {
    icon: "uiw:file-excel",
    title: "Upload members via Excel",
    desc: "Drop in an .xlsx with a Roll No. column — we match members automatically.",
  },
  {
    icon: "solar:calendar-outline",
    title: "Publish events & posts",
    desc: "Announce events, share updates and reach every student on campus instantly.",
  },
];

const PROMISES = [
  { icon: "meteor-icons:clock", title: "< 24h response", desc: "Average support reply time." },
  { icon: "solar:verified-check-bold", title: "Verified clubs", desc: "Every club approved by admin." },
  { icon: "solar:wallet-outline", title: "Free for students", desc: "All core features, always free." },
  { icon: "solar:notes-linear", title: "Step-by-step guides", desc: "Clear flows for every action." },
];

const FAQS = [
  {
    q: "How do clubs publish an event?",
    a: "Go to your club dashboard → Events → New Event. Add a title, date, venue and cover image, then publish. The event appears in the campus feed and on your club page.",
  },
  {
    q: "How does TeamFinder work?",
    a: "Open TeamFinder, filter students by skill, year or interest, view their profile and skills, and send a team invite. Students can also browse open teams and request to join.",
  },
  {
    q: "What format should the Excel sheet be in to add members?",
    a: "Upload an .xlsx or .csv file. The Roll No. column is compulsory. Optional columns: Name, Email, Branch, Year. Duplicate roll numbers are skipped automatically.",
  },
  {
    q: "Why is Roll Number required?",
    a: "Roll Number uniquely identifies each student on campus. It prevents duplicate accounts and links members correctly to their existing student profile.",
  },
  {
    q: "How do I register my club?",
    a: "Click Register Club, fill in the club name, category, description and upload a logo. Once approved by admin, you can start adding members and publishing events.",
  },
  {
    q: "How do I add skills and achievements to my profile?",
    a: "Open your profile → Edit → add skills as tags and list achievements with a short description. A complete profile shows up higher in TeamFinder results.",
  },
  {
    q: "Can I chat with people outside my club?",
    a: "Yes. Chat works across the whole campus — message any student or club, or create group chats for project teams.",
  },
  {
    q: "How are posts different from events?",
    a: "Posts are short updates on the feed (like a tweet). Events are scheduled activities with date, venue and RSVPs.",
  },
];

export default function GetHelpPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(0);

  const q = query.trim().toLowerCase();
  const filteredFaqs = FAQS.filter(
    (f) =>
      !q ||
      f.q.toLowerCase().includes(q) ||
      f.a.toLowerCase().includes(q),
  );


  return (
    <div className="min-h-screen bg-white text-black">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/10">
        {/* soft background accents */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.06),transparent_60%)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-black/60">
            About Unilynk
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            One campus.{" "}
            <span className="italic text-black/60">One link.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-black/60 sm:text-base">
            Unilynk is the home for student life — profiles, clubs, events and
            teams woven into a single, calm space. We're building the platform
            we wished we had on day one of college.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-10 py-2.5 text-sm font-medium text-black/80 transition-colors hover:bg-gray-100 hover:text-black"
            >
              Talk to us
            </a>
          </div>

          {/* quick stats */}
          <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-black/10 bg-white">
            {[
              { k: "10k+", v: "Students" },
              { k: "250+", v: "Clubs" },
              { k: "1k+", v: "Events" },
            ].map((s, i) => (
              <div
                key={s.v}
                className={`px-4 py-5 ${i !== 0 ? "border-l border-black/10" : ""}`}
              >
                <dt className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {s.k}
                </dt>
                <dd className="mt-1 text-[11px] font-medium uppercase tracking-wider text-black/50">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Getting started */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-black/50">
            Getting started
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Up and running in three steps
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-black/60">
            Whether you're a student looking for a team or a club bringing your
            members online — here's the fastest path.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {[
            { title: "For students", steps: STUDENT_STEPS },
            { title: "For clubs", steps: CLUB_STEPS },
          ].map((group) => (
            <div
              key={group.title}
              className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight">
                  {group.title}
                </h3>
                <span className="text-[10px] font-medium uppercase tracking-wider text-black/40">
                  3 steps
                </span>
              </div>
              <ol className="relative space-y-5 border-l border-dashed border-black/15 pl-5">
                {group.steps.map((s, i) => (
                  <li key={s.title} className="relative">
                    <span className="absolute -left-[34px] grid h-7 w-7 place-items-center rounded-full border border-black/15 bg-white text-[11px] font-semibold">
                      {i + 1}
                    </span>
                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-black text-white">
                        <Icon icon={s.icon} className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold tracking-tight">
                          {s.title}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-black/60">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Promises strip */}
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-4">
          {PROMISES.map((p) => (
            <div key={p.title} className="bg-white p-5">
              <Icon icon={p.icon} className="h-4 w-4 text-black" />
              <p className="mt-3 text-sm font-semibold tracking-tight">
                {p.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-black/55">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* Excel upload guide */}
      <section className="border-y border-black/10 bg-black text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/60">
              For clubs
            </span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Add members in seconds with an Excel upload
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Skip manual entry. Upload an .xlsx or .csv with your members and
              we'll match them to existing student profiles. Roll Number is the
              only required column.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/80">
              {[
                "Required: Roll No.",
                "Optional: Name, Email, Branch, Year",
                "Duplicates are skipped automatically",
                "Invites are sent to unmatched emails",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white" />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/15 bg-white text-black">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs text-black/60">
                <Icon icon="uiw:file-excel" className="h-3.5 w-3.5" />
                members.xlsx
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-black/50">
                Preview
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-black/[0.03] text-black/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Roll No. *</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Branch</th>
                    <th className="px-3 py-2 font-medium">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {[
                    ["22BCE1024", "A. Sharma", "CSE", "3"],
                    ["22BME1102", "R. Iyer", "ME", "3"],
                    ["23BEC0421", "S. Khan", "ECE", "2"],
                    ["21BIT0998", "M. Das", "IT", "4"],
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((c, i) => (
                        <td
                          key={i}
                          className={`px-3 py-2 ${i === 0 ? "font-medium" : "text-black/70"}`}
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-black/50">
            FAQ
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Questions, answered.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
            The most common things students and clubs ask us about Unilynk.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition-all ${isOpen
                  ? "border-black/20 bg-white"
                  : "border-black/10 bg-white hover:bg-[#fafafa]"
                  }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                  aria-expanded={isOpen}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/[0.04] text-[11px] font-semibold text-black/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm font-medium sm:text-base">
                    {f.q}
                  </span>
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform ${isOpen ? "rotate-180" : ""
                      }`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pl-[60px] text-sm leading-relaxed text-black/65 sm:px-6 sm:pb-6 sm:pl-[68px]">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>


      {/* Contact */}
      <section
        id="contact"
        className="border-t border-black/10 bg-black/[0.02]"
      >
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Still need help?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
            Our team usually replies within a day. Tell us if you're a student
            or a club admin so we can route it faster.
          </p>
          <a
            href="mailto:support@campus.app"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
          >
            <Icon icon="solar:letter-opened-outline" className="h-4 w-4" />
            support@campus.app
          </a>
        </div>
      </section>

      <footer className="border-t border-black/10 py-6 text-center text-xs text-black/50">
        © {new Date().getFullYear()} Campus Hub — Connecting clubs & students.
      </footer>
    </div>
  );
}
