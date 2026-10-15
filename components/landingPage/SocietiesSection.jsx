import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { ArrowUpRight } from 'lucide-react'

// Placeholder logos (real brands) — swap `icon` for actual club logos later.
const SOCIETIES = [
  { name: 'Coding Club', tag: 'Tech', icon: 'logos:github-icon', members: '420+' },
  { name: 'Robotics Society', tag: 'Tech', icon: 'logos:tesla', members: '210+' },
  { name: 'Design Collective', tag: 'Creative', icon: 'logos:figma', members: '180+' },
  { name: 'Music Society', tag: 'Cultural', icon: 'logos:spotify-icon', members: '300+' },
  { name: 'Film & Media', tag: 'Creative', icon: 'logos:youtube-icon', members: '160+' },
  { name: 'AI / ML Club', tag: 'Tech', icon: 'logos:openai-icon', members: '350+' },
  { name: 'E-Cell', tag: 'Business', icon: 'logos:stripe', members: '260+' },
  { name: 'Photography Club', tag: 'Creative', icon: 'logos:instagram-icon', members: '240+' },
  { name: 'Literary Society', tag: 'Cultural', icon: 'logos:medium-icon', members: '140+' },
  { name: 'Dev Community', tag: 'Tech', icon: 'logos:google-icon', members: '500+' },
  { name: 'Gaming Society', tag: 'Sports', icon: 'logos:discord-icon', members: '380+' },
  { name: 'Cloud Club', tag: 'Tech', icon: 'logos:aws', members: '150+' },
  { name: 'Dramatics', tag: 'Cultural', icon: 'logos:netflix-icon', members: '190+' },
  { name: 'Social Outreach', tag: 'Service', icon: 'logos:slack-icon', members: '220+' },
  { name: 'Astronomy Club', tag: 'Science', icon: 'logos:apple', members: '130+' },
]

const ROW_A = SOCIETIES.slice(0, 8)
const ROW_B = SOCIETIES.slice(8)

function Chip({ s }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-2 pl-2 pr-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
        <Icon icon={s.icon} width={20} height={20} />
      </span>
      <span className="whitespace-nowrap text-sm font-medium text-white/80">{s.name}</span>
    </div>
  )
}

function Marquee({ items, reverse }) {
  const loop = [...items, ...items, ...items]
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <motion.div
        className="flex w-max gap-3"
        animate={{ x: reverse ? ['-33.333%', '0%'] : ['0%', '-33.333%'] }}
        transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
      >
        {loop.map((s, i) => <Chip key={i} s={s} />)}
      </motion.div>
    </div>
  )
}

const BLURBS = {
  Tech: 'Build, ship and compete with the sharpest minds on campus.',
  Creative: 'Make things people remember, from frames to pixels.',
  Cultural: 'The stage, the mic and the soul of every fest.',
  Business: 'Ideas, pitches and the founders of tomorrow.',
  Sports: 'Squads, leagues and late-night tournaments.',
  Service: 'Give back to the community around campus.',
  Science: 'Curiosity-driven projects beyond the syllabus.',
}

const SLOTS = 4
const TICK = 1300

function Card({ s, idx }) {
  return (
    <div className="relative h-[230px] [perspective:1000px] sm:h-[260px]">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.a
          key={s.name}
          href="#"
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'center center' }}
          className="group absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-18px_rgba(255,62,165,0.45)] sm:p-6"
        >
          <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#ff3ea5]/10 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f3ef] sm:h-16 sm:w-16">
              <Icon icon={s.icon} width={30} height={30} />
            </span>
            <span className="font-mono text-xs text-black/30">{String(idx + 1).padStart(2, '0')}</span>
          </div>
          <div className="relative mt-auto">
            <span className="rounded-full bg-[#ff3ea5]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#ff3ea5]">{s.tag}</span>
            <h3 className="mt-2 text-lg font-semibold leading-tight text-[#3f0808] sm:text-xl">{s.name}</h3>
            <p className="mt-1 line-clamp-2 hidden text-sm text-black/50 sm:block">{BLURBS[s.tag]}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-black/45">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{s.members} members</span>
              <ArrowUpRight className="h-4 w-4 transition-all group-hover:rotate-45 group-hover:text-[#ff3ea5]" />
            </div>
          </div>
        </motion.a>
      </AnimatePresence>
    </div>
  )
}

function Showcase() {
  const [state, setState] = useState({ slots: [0, 1, 2, 3], next: SLOTS, turn: 0 })
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setState(({ slots, next, turn }) => {
        const copy = [...slots]
        copy[turn % SLOTS] = next % SOCIETIES.length
        return { slots: copy, next: next + 1, turn: turn + 1 }
      })
    }, TICK)
    return () => clearInterval(id)
  }, [paused])

  const latest = (state.next - 1) % SOCIETIES.length

  return (
    <div className="mt-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {state.slots.map((idx, slot) => <Card key={slot} s={SOCIETIES[idx]} idx={idx} />)}
      </div>
      <div className="mt-6 flex items-center justify-center gap-1.5">
        {SOCIETIES.map((s, i) => (
          <span
            key={s.name}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === latest ? 'w-6 bg-[#ff3ea5]' : state.slots.includes(i) ? 'w-1.5 bg-[#3f0808]/50' : 'w-1.5 bg-black/15'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function SocietiesSection() {
  return (
    <section id="societies" className="w-full px-5 py-16 sm:px-10 md:py-24 lg:px-20 2xl:px-40">
      <div className="mx-auto w-full max-w-screen-2xl">
        <div className="overflow-hidden rounded-[28px] bg-[#0b0b0d] py-10 md:py-14">
          <div className="flex flex-col gap-4 px-6 md:flex-row md:items-end md:justify-between md:px-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff3ea5]" /> 15+ active societies
              </span>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Every passion has a <span className="text-[#ff3ea5]">home</span> at NIT Kurukshetra.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/50 md:text-base">
              From code to culture, find the communities shaping campus life and join them in a tap.
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-3">
            <Marquee items={ROW_A} />
            <Marquee items={ROW_B} reverse />
          </div>
        </div>

        <Showcase />

        <div className="mt-8 flex justify-center">
          <a href="#" className="inline-flex items-center gap-2 rounded-full bg-[#0b0b0d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff3ea5]">
            Explore all societies <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
