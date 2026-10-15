import { motion } from 'framer-motion'
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

function Card({ s, i }) {
  return (
    <motion.a
      href="#"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: (i % 5) * 0.05 }}
      className="group relative flex flex-col rounded-2xl border border-black/[0.06] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#ff3ea5]/40 hover:shadow-[0_12px_30px_-12px_rgba(255,62,165,0.35)] sm:p-5"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4f3ef] transition-colors group-hover:bg-[#ff3ea5]/10 sm:h-12 sm:w-12">
          <Icon icon={s.icon} width={24} height={24} />
        </span>
        <ArrowUpRight className="h-4 w-4 text-black/25 transition-all group-hover:rotate-45 group-hover:text-[#ff3ea5]" />
      </div>
      <h3 className="mt-4 text-sm font-semibold leading-tight text-[#3f0808] sm:text-[15px]">{s.name}</h3>
      <div className="mt-2 flex items-center justify-between text-xs text-black/45">
        <span className="rounded-full bg-black/[0.04] px-2 py-0.5">{s.tag}</span>
        <span>{s.members}</span>
      </div>
    </motion.a>
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

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
          {SOCIETIES.map((s, i) => <Card key={s.name} s={s} i={i} />)}
        </div>

        <div className="mt-8 flex justify-center">
          <a href="#" className="inline-flex items-center gap-2 rounded-full bg-[#0b0b0d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#212125]">
            Explore all societies <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
