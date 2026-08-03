import { useEffect, useState } from 'react'
import { Icon } from "@iconify/react";

const PHRASES = [
  'Discover Clubs',
  'Find Events',
  'Meet Students',
  'Join Communities',
  'Grow Your Network',
  'Share Moments',
  'Build Together',
  'Explore Campus',
  'Stay Connected',
  'Campus Updates',
]

// The rail renders the phrase list five times over so the translate can keep
// marching forward without the viewer ever reaching an edge.
const ITEMS = [...PHRASES, ...PHRASES, ...PHRASES, ...PHRASES, ...PHRASES]

const ITEM_HEIGHT = 60
const VIEWPORT_HEIGHT = 420

const FALLOFF = [1, 0.45, 0.3, 0.2]

const VALUES = [
  {
    title: 'Students',
    icon: 'solar:users-group-rounded-bold',
  },
  {
    title: 'Community',
    icon: 'solar:heart-bold',
  },
  {
    title: 'Collaborate',
    icon: 'solar:hand-stars-bold',
  },
  {
    title: 'Privacy',
    icon: 'solar:shield-check-bold',
  },
  {
    title: 'Innovation',
    icon: 'mingcute:bulb-2-fill',
  },
  {
    title: 'Growth',
    icon: 'solar:graph-up-bold',
  },
]

function CoreValue({ value }) {
  return (
    <div className="group flex items-center gap-2 text-white/45 transition-all duration-200 hover:text-white">
      <Icon
        icon={value.icon}
        width={20}
        height={20}
        className="shrink-0 transition-opacity duration-200 opacity-80 group-hover:opacity-100"
      />

      <span className="text-sm font-semibold tracking-wide uppercase">
        {value.title}
      </span>
    </div>
  );
}

export default function HeroSection() {
  const [active, setActive] = useState(PHRASES.length * 2 + 4)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((current) =>
        current >= ITEMS.length - PHRASES.length ? PHRASES.length * 2 : current + 1,
      )
    }, 2200)
    return () => window.clearInterval(id)
  }, [])

  const offset = -(active * ITEM_HEIGHT) + (VIEWPORT_HEIGHT - ITEM_HEIGHT) / 2

  return (
    <section className="relative flex flex-col overflow-hidden bg-[#0b0b0d]" data-cy="section-hero">
      <img
        src="Backgroundland.jpg"
        alt=""
        fetchPriority="high"
        decoding="async"
        className="pointer-events-none absolute inset-0 size-full object-cover object-top"
        style={{ objectPosition: "center 5%" }}

      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/20" />
      <div className="relative mx-auto flex w-full max-w-screen-2xl flex-1 flex-col justify-end px-5 pb-8 pt-24 sm:px-10 lg:px-20 2xl:px-40">
        <div className="flex flex-1 flex-col justify-center gap-8 py-10 lg:flex-row lg:items-center lg:gap-12 lg:py-20">
          <div className="flex max-w-2xl flex-col gap-6">
            <a
              href="https://a16z.com/100-gen-ai-apps-6/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-fit items-center gap-3 whitespace-nowrap rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <span className="text-white">The All-in-One Campus Platform</span>
              <span className="hidden text-white/40 sm:inline">Join today</span>
              <svg
                className="inline-block size-4.5 fill-current text-[#ff3ea5]"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                aria-hidden="true"
              >
                <path d="M13.2 5.4 11.8 6.8l4.2 4.2H4v2h12l-4.2 4.2 1.4 1.4L19.8 12z" />
              </svg>
            </a>
            <h1 className="font-alternate text-4xl leading-[1.15] tracking-tight text-[#ffffff] sm:text-5xl lg:text-[55px]">
              Everything your campus needs, all in one place.
            </h1>
            <p className="text-sm leading-[1.35] text-[#ffffffbf] sm:text-lg">
              Connect with students, discover clubs, attend events, share updates, and become part of a thriving campus community—all through UniLynk.
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <a
                href="https://www.magnific.com/sign-up?client_id=magnific&lang=en#from_element=home_hero"
                className="flex h-10 items-center justify-center gap-2 text-nowrap rounded-lg bg-white px-6 py-3 text-base font-medium text-black transition duration-150 ease-in-out hover:bg-white/90 focus:bg-white/90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffffff4c] active:outline-none"
              >
                Get Started
              </a>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 text-nowrap rounded-lg border border-white bg-transparent px-6 py-3 text-base font-medium text-white transition duration-150 ease-in-out hover:bg-white/10 focus:bg-white/10 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffffff4c] active:outline-none"
              >
                <svg
                  className="inline-block size-4 fill-current"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Explore Features
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative flex gap-4">
              <div
                className="flex shrink-0 flex-col"
                style={{ height: VIEWPORT_HEIGHT, justifyContent: 'center' }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="text-[#ff3ea5]"
                >
                  <polygon points="4,2 22,12 4,22" fill="currentColor" />
                </svg>
              </div>
              <div className="overflow-hidden" style={{ height: VIEWPORT_HEIGHT }}>
                <div
                  style={{
                    transform: `translateY(${offset}px)`,
                    transition: 'transform 700ms ease-in-out',
                  }}
                >
                  {ITEMS.map((phrase, index) => {
                    const distance = Math.abs(index - active)
                    const opacity = FALLOFF[distance] ?? 0.1
                    return (
                      <div
                        key={`${phrase}-${index}`}
                        className="flex items-center"
                        style={{ height: ITEM_HEIGHT }}
                      >
                        <span
                          className="whitespace-nowrap font-alternate text-3xl font-bold text-[#ffffff]"
                          style={{ opacity, transition: 'opacity 700ms ease-in-out' }}
                        >
                          {phrase}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 lg:mt-12">
          <div className="flex flex-col items-center gap-6">
            <p className="text-center text-sm text-[#ffffff]">
              Designed to bring students, clubs, and campus communities together.
            </p>
            <div className="hidden items-center justify-center gap-10 lg:flex xl:gap-14">
              {VALUES.map((value) => (
                <CoreValue
                  key={value.title}
                  value={value}
                />
              ))}
            </div>
            <div className="w-full overflow-hidden lg:hidden">
              <div className="flex w-max animate-scroll-horizontal items-center gap-8 motion-reduce:animate-none">
                {VALUES.map((value) => (
                  <CoreValue
                    key={value.title}
                    value={value}
                  />
                ))}
                {VALUES.map((value) => (
                  <CoreValue
                    key={value.title}
                    value={value}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
