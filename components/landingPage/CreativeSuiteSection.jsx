import { useLayoutEffect, useRef, useState } from 'react'
import SpriteIcon from './SpriteIcon'
import { video } from 'framer-motion/client'

const PANELS = [
  {
    id: "campus-life",
    tab: "Campus Life",
    heading: "Everything happening on your campus.",
    description:
      "Discover clubs, attend events, connect with students, and stay updated with everything happening around you.",
    links: [{ label: "Explore Campus" }],
    video: 'https://videocdn.cdnpk.net/videos/4ff63825-3cb3-4cfd-a54f-7c6f1ab86bc5/horizontal/previews/clear/large.mp4?token=exp=1785759247~hmac=c5b77118c2a7b6fdb01b90822b15319b34799f2636ee989e09fa66384726c294',
    features: [
      {
        icon: "users",
        label: "Communities",
        description: "Join communities based on your interests and connect with like-minded students.",
        video: 'https://videocdn.cdnpk.net/videos/4ff63825-3cb3-4cfd-a54f-7c6f1ab86bc5/horizontal/previews/clear/large.mp4?token=exp=1785759247~hmac=c5b77118c2a7b6fdb01b90822b15319b34799f2636ee989e09fa66384726c294',
      },
      {
        icon: "calendar",
        label: "Events",
        description: "Never miss workshops, fests, hackathons, and club activities.",
        video: 'https://videocdn.cdnpk.net/videos/0f7559cf-1e75-4d7b-bee6-52ae249c9854/horizontal/previews/clear/large.mp4?token=exp=1785772447~hmac=e2db690b098d09e0cb4ee0128ecd023077e79a2168c218ee1c0fb3cd79eae520',
      },
      {
        icon: "post",
        label: "Campus Feed",
        description: "See updates, announcements, and posts shared across your campus.",
        video: 'https://videocdn.cdnpk.net/videos/1e8ac744-3fc7-497c-ac9a-9793096a85d8/horizontal/previews/clear/large.mp4?token=exp=1785772692~hmac=6435914a521c58a963df3c577988363dd9d35a0bd223d49ac18c1521e05989e6',
      },
      {
        icon: "clubs",
        label: "Clubs",
        description: "Discover student clubs and become part of communities you love.",
        video: "https://videocdn.cdnpk.net/videos/ec6849b0-bbf0-53f5-9685-28fcf8309fd3/horizontal/previews/clear/large.mp4?token=exp=1785773802~hmac=b320b6367458ba1651063320c1eba4b67590536124816c65e9c76ea14621c2a8",
      },
      {
        icon: "network",
        label: "Networking",
        description: "Meet seniors, classmates, and students across departments.",
        video: "https://videocdn.cdnpk.net/videos/a266430c-29c3-5b67-8a6e-5f1bb63bd453/horizontal/previews/clear/large.mp4?token=exp=1785773920~hmac=a762475a6317f65709382eed0fc23492be3abf3f12f920a707ae300a4934eae8",
      }
    ]
  },
  {
    id: 'campus-network',
    tab: 'Campus Network',
    isNew: true,
    heading: 'Build meaningful connections across your campus.',
    description:
      'Connect with classmates, seniors, juniors, and club members. Discover people with shared interests and grow your campus network naturally.',
    links: [
      { label: 'MCP', href: 'https://www.magnific.com/mcp#from_element=home_tabs_mcp-api_mcp' },
      { label: 'API', href: 'https://www.magnific.com/api#from_element=home_tabs_mcp-api_api' },
    ],
    video: 'https://videocdn.cdnpk.net/videos/472d683e-edde-4c8a-8606-72edb82487b5/horizontal/previews/clear/large.mp4?token=exp=1785774896~hmac=401954b115e9139c20e31c5c606aa524c9b0c7f98500039be48dfb8584884ebc',
    features: [
      {
        icon: 'mcp',
        label: 'Student Profiles',
        description:
          'Explore student profiles, interests, and achievements. Discover people who share your passions across campus.',
      },
      {
        icon: 'images',
        label: 'Connections',
        description: 'Build meaningful connections with classmates, seniors, juniors, and students from every department.',
      },
      {
        icon: 'video',
        label: 'Communities',
        description:
          'Join interest-based communities, participate in discussions, and connect with students who share your goals.',
      },
      {
        icon: 'microphone',
        label: 'Club Network',
        description:
          'Discover student clubs, explore their activities, and become part of vibrant campus communities.',
      },
      {
        icon: 'resources',
        label: 'Campus Feed',
        description: 'Follow campus updates, announcements, and trending conversations from students and organizations alike.',
      },
    ],
  },
  {
    id: 'events',
    tab: 'Events',
    isNew: true,
    heading: 'Every event on campus. Never miss a moment.',
    description:
      'Discover workshops, hackathons, seminars, fests, competitions, and club activities. Stay informed, register with ease, and experience campus life like never before.',
    links: [
      {
        label: 'Explore Events',
      },
    ],
    video: 'https://videocdn.cdnpk.net/videos/efa450b3-a309-4365-8655-1870d82ab43c/horizontal/previews/clear/large.mp4?token=exp=1785775751~hmac=880bbdbbf2258bac5286daba52e5c6db0c40e3d413ce5b461c78b172be64ff75',
    features: [
      {
        icon: 'calendar',
        label: 'Upcoming Events',
        description:
          'Explore upcoming workshops, seminars, hackathons, competitions, and cultural events happening across your campus.',
      },
      {
        icon: 'ticket',
        label: 'Registrations',
        description:
          'Register for events in seconds, manage your participation, and keep track of everything you have joined.',
      },
      {
        icon: 'bell',
        label: 'Reminders',
        description:
          'Receive timely reminders before every event so you never miss important sessions or activities.',
      },
      {
        icon: 'location',
        label: 'Venues',
        description:
          'Find event locations, schedules, and essential details before you arrive on campus with confidence.',
      },
    ],
  },
  {
  id: 'clubs',
  tab: 'Clubs',
  isNew: true,
  heading: 'Discover clubs. Find your community.',
  description:
    'Explore student clubs across your campus, discover their activities, connect with members, and become part of communities that match your interests.',
  links: [
    {
      label: 'Explore Clubs',
    },
  ],
  video: 'https://videocdn.cdnpk.net/videos/72ea9882-f25f-499c-860c-d07fb8e04dbb/horizontal/previews/clear/large.mp4?token=exp=1785776153~hmac=83ed7e32eaf804b49f7363129c4a9ba9d64e28afca635bbd823f5fb71899915e',
  features: [
    {
      icon: 'compass',
      label: 'Discover Clubs',
      description:
        'Browse clubs from every category, explore their missions, and find communities that match your interests.',
    },
    {
      icon: 'users',
      label: 'Club Members',
      description:
        'Meet club members, connect with student leaders, and learn more about every community before joining.',
    },
    {
      icon: 'calendar',
      label: 'Club Activities',
      description:
        'Stay updated with workshops, competitions, meetings, and activities organized by your favorite clubs.',
    },
    {
      icon: 'add-user',
      label: 'Join Clubs',
      description:
        'Become a member in just a few clicks and start participating in exciting opportunities across campus.',
    },
  ],
},
  {
  id: 'chat',
  tab: 'Chat',
  isNew: true,
  heading: 'Conversations that keep campus connected.',
  description:
    'Chat with classmates, seniors, juniors, clubs, and communities. Stay connected through real-time conversations, group discussions, and meaningful campus interactions.',
  links: [
    {
      label: 'Start Chatting',
    },
  ],
  video: 'https://videocdn.cdnpk.net/videos/e717e56c-7578-5c65-85a6-15101b3ab1c1/horizontal/previews/clear/large.mp4?token=exp=1785776419~hmac=bf8cc2fff3e88ad5a71b2f57db4ee8bfe219cd4fd4c91c1a358dabb39064928e',
  features: [
    {
      icon: 'chat',
      label: 'Direct Messages',
      description:
        'Start private conversations with classmates, seniors, juniors, and friends from across your campus.',
    },
    {
      icon: 'users-group',
      label: 'Group Chats',
      description:
        'Create group conversations for clubs, events, projects, and communities to stay connected together.',
    },
    {
      icon: 'notification',
      label: 'Real-time Updates',
      description:
        'Receive instant message notifications, stay informed, and never miss important conversations again.',
    },
    {
      icon: 'shield-check',
      label: 'Safe Conversations',
      description:
        'Chat in a secure environment designed to help students communicate with confidence and respect.',
    },
  ],
},
]

const PLUGINS = [
  {
    key: 'figma',
    icon: 'figma',
    label: 'Figma',
    href: 'https://www.magnific.com/plugins/figma#from_element=home_tabs_plugins_figma',
  },
  {
    key: 'adobe',
    icon: 'adobe',
    label: 'Adobe Creative Cloud',
    entries: [
      {
        name: 'Illustrator',
        download: 'menu',
        href: 'https://www.magnific.com/plugins/illustrator#from_element=home_tabs_plugins_illustrator',
      },
      {
        name: 'Photoshop',
        download: 'single',
        href: 'https://www.magnific.com/plugins/photoshop#from_element=home_tabs_plugins_photoshop',
      },
      {
        name: 'After Effects',
        download: 'menu',
        href: 'https://www.magnific.com/plugins/after-effects#from_element=home_tabs_plugins_after-effects',
      },
      {
        name: 'Premiere Pro',
        download: 'single',
        href: 'https://www.magnific.com/plugins/premiere-pro#from_element=home_tabs_plugins_premiere-pro',
      },
      {
        name: 'InDesign',
        download: 'single',
        href: 'https://www.magnific.com/plugins/indesign#from_element=home_tabs_plugins_indesign',
      },
    ],
  },
  {
    key: 'final-cut-pro',
    icon: 'finalcut-pro',
    label: 'Final Cut Pro',
    download: 'macos',
    href: 'https://www.magnific.com/plugins/final-cut-pro#from_element=home_tabs_plugins_final-cut-pro',
  },
  {
    key: 'davinci-resolve',
    icon: 'davinci',
    label: 'DaVinci Resolve',
    download: 'menu',
    href: 'https://www.magnific.com/plugins/davinci-resolve#from_element=home_tabs_plugins_davinci-resolve',
  },
  {
    key: 'microsoft-office',
    icon: 'office',
    label: 'Microsoft Office',
    download: 'menu',
    href: 'https://www.magnific.com/plugins/microsoft-office#from_element=home_tabs_plugins_microsoft-office',
  },
]

const PILL =
  'inline-flex h-8 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

function LinkArrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-49 141 512 512"
      width="16"
      height="16"
      aria-hidden="true"
      className="transition-transform duration-300 group-hover:translate-x-1"
    >
      <path
        fill="currentColor"
        d="M-24 422h401.645l-72.822 72.822c-9.763 9.763-9.763 25.592 0 35.355 9.763 9.764 25.593 9.762 35.355 0l115.5-115.5a25 25 0 0 0 0-35.355l-115.5-115.5c-9.763-9.762-25.593-9.763-35.355 0-9.763 9.763-9.763 25.592 0 35.355l72.822 72.822H-24c-13.808 0-25 11.193-25 25S-37.808 422-24 422"
      />
    </svg>
  )
}

function Rule({ className = '' }) {
  return (
    <div className={`flex h-0.5 w-full ${className}`} aria-hidden="true">
      <div className="w-2/5 bg-white" />
      <div className="w-3/5 bg-white/20" />
    </div>
  )
}

function FeatureList({ features, active, onChange }) {
  const setActive = onChange
  return (
    <div className="relative hidden xl:static xl:block">
      <div className="scrollbar-none flex gap-0.5 overflow-x-auto xl:flex-col xl:gap-0 xl:overflow-visible">
        {features.map((feature, index) => {
          const selected = index === active
          return (
            <button
              key={feature.label}
              type="button"
              onClick={() => setActive(index)}
              onMouseEnter={() => setActive(index)}
              className={`shrink-0 rounded-full px-3 py-2 text-left transition-colors xl:w-full xl:gap-3 xl:rounded-none xl:px-0 xl:py-3 ${selected ? 'bg-white/10 text-white xl:bg-transparent' : 'text-white hover:text-white/80'
                }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <SpriteIcon
                    name={feature.icon}
                    className="inline-block size-4 shrink-0 fill-current xl:!size-5"
                  />
                  <span className="whitespace-nowrap font-alternate text-sm font-extrabold xl:whitespace-normal xl:text-base">
                    {feature.label}
                  </span>
                </div>
                <div
                  className={`hidden xl:grid xl:transition-all xl:duration-300 xl:ease-in-out ${selected ? 'xl:grid-rows-[1fr] xl:opacity-100' : 'xl:grid-rows-[0fr] xl:opacity-0'
                    }`}
                >
                  <div className="overflow-hidden">
                    <p className="mt-2 text-xs text-white/70 xl:text-sm">{feature.description}</p>
                    <Rule className="mt-4" />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DownloadControl({ kind }) {
  if (kind === 'menu') {
    return (
      <div className="inline-block">
        <button
          type="button"
          className={`justify-center ${PILL}`}
          aria-haspopup="menu"
          aria-expanded="false"
          aria-label="Download plugin"
        >
          <SpriteIcon name="download" className="inline-block size-4 fill-current" />
          <SpriteIcon name="arrow" className="inline-block size-4 fill-current transition-transform" />
        </button>
      </div>
    )
  }
  if (kind === 'macos') {
    return (
      <a href="#" download className={PILL}>
        <SpriteIcon name="apple" className="inline-block size-4 fill-current" />
        Download for macOS
      </a>
    )
  }
  return (
    <a href="#" download className={PILL} aria-label="Download plugin">
      <SpriteIcon name="download" className="inline-block size-4 fill-current" />
    </a>
  )
}

function MoreInfo({ href }) {
  return (
    <a href={href} className={PILL}>
      More info
      <SpriteIcon name="arrow-top-right" className="inline-block size-4 fill-current" />
    </a>
  )
}

function PluginList() {
  const [open, setOpen] = useState('figma')
  return (
    <div className="flex flex-col">
      {PLUGINS.map((group) => {
        const expanded = open === group.key
        return (
          <div key={group.key}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? '' : group.key)}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <SpriteIcon
                name={group.icon}
                className="inline-block size-4 shrink-0 fill-current text-white"
              />
              <span
                className={`font-alternate text-lg font-extrabold tracking-tight transition-colors text-white ${expanded ? '' : 'hover:text-white/80'
                  }`}
              >
                {group.label}
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
                {group.entries ? (
                  <div className="flex flex-col gap-2 pb-3">
                    {group.entries.map((entry) => (
                      <div key={entry.name} className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold tracking-tight text-white">
                          {entry.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          {entry.download ? <DownloadControl kind={entry.download} /> : null}
                          <MoreInfo href={entry.href} />
                        </div>
                      </div>
                    ))}
                    <Rule className="mt-2" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {group.download ? <DownloadControl kind={group.download} /> : null}
                      <MoreInfo href={group.href ?? '#'} />
                    </div>
                    <Rule />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CreativeSuiteSection() {
  const [activeTab, setActiveTab] = useState('campus-life')
  const [featureByPanel, setFeatureByPanel] = useState({})
  const listRef = useRef(null)
  const tabRefs = useRef({})
  const [indicator, setIndicator] = useState({ left: 6, width: 138 })

  useLayoutEffect(() => {
    const update = () => {
      const list = listRef.current
      const tab = tabRefs.current[activeTab]
      if (!list || !tab) return
      setIndicator({ left: tab.offsetLeft, width: tab.offsetWidth })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [activeTab])

  return (
    <section className="mx-auto w-full max-w-screen-2xl py-16 sm:py-20 lg:py-[12vh]" data-cy="section-tabs">
      <div className="mx-auto max-w-screen-xl px-8">
        <div className="mx-auto mb-10 w-full max-w-none px-0 text-center sm:px-0 lg:mb-14 lg:px-0 [&_p]:mx-auto">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <h2 className="mx-auto max-w-2xl font-alternate text-3xl font-bold leading-tight text-[#3f0808] lg:text-5xl">
                Built for every part of campus life
              </h2>
              <p className="mt-4 max-w-2xl text-base text-[#3f0808] lg:text-lg">
                Start your campus journey. Discover clubs, join events, build connections.
              </p>
            </div>
          </div>
        </div>
        <div className="relative mx-auto mb-6 max-w-fit overflow-hidden rounded-full">
          <div
            ref={listRef}
            role="tablist"
            className="scrollbar-none relative inline-flex max-w-full cursor-grab overflow-x-auto rounded-full bg-white p-1.5"
          >
            <span
              className="absolute inset-y-1.5 rounded-full bg-neutral-900 transition-[left,width] duration-150 ease-in-out"
              aria-hidden="true"
              style={{ left: indicator.left, width: indicator.width }}
            />
            {PANELS.map((panel) => {
              const selected = panel.id === activeTab
              return (
                <button
                  key={panel.id}
                  ref={(node) => {
                    tabRefs.current[panel.id] = node
                  }}
                  role="tab"
                  type="button"
                  id={`tab-${panel.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${panel.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(panel.id)}
                  className={`relative z-10 inline-flex items-center gap-2 whitespace-nowrap px-6 py-2.5 text-sm transition-colors duration-300 ${selected ? 'text-white' : 'text-neutral-900'
                    }`}
                >
                  {panel.tab}
                  {panel.isNew ? (
                    <span className="typo-body-2xs inline-flex h-4.5 w-fit items-center justify-center gap-1 rounded bg-[#FF58AE]/15 px-1.5 font-medium text-[#ff58ae]">
                      New
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8">
        <div className="rounded-2lg overflow-hidden bg-[#2a2320]">
          {PANELS.map((panel) => {
            const selected = panel.id === activeTab
            const featureIndex = featureByPanel[panel.id] ?? 0
            const mediaVideo = panel.features?.[featureIndex]?.video ?? panel.video
            return (
              <div
                key={panel.id}
                role="tabpanel"
                id={`panel-${panel.id}`}
                aria-labelledby={`tab-${panel.id}`}
                className={`${selected ? 'flex' : 'hidden'} transition-opacity duration-150 ease-in-out opacity-100`}
              >
                <div className="relative flex h-[650px] w-full flex-col">
                  {mediaVideo || panel.image ? (
                    <div className="absolute inset-0">
                      {mediaVideo ? (
                        <video
                          key={mediaVideo}
                          className="absolute inset-0 size-full object-cover opacity-100 transition-opacity duration-150 ease-in-out"
                          playsInline
                          loop
                          muted
                          autoPlay
                          preload="none"
                          aria-hidden="true"
                        >
                          <source src={mediaVideo} type="video/webm" />
                        </video>
                      ) : (
                        <img
                          src={panel.image.src}
                          srcSet={panel.image.srcSet}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          aria-hidden="true"
                          className="absolute inset-0 size-full object-cover opacity-100 transition-opacity duration-150 ease-in-out"
                        />
                      )}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[500px] bg-gradient-to-r from-[#2a2320] via-[#2a2320] via-40% to-transparent"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[400px] backdrop-blur-xl [-webkit-mask-image:linear-gradient(to_right,black,transparent)] [mask-image:linear-gradient(to_right,black,transparent)]"
                      />
                    </div>
                  ) : null}
                  <div
                    className={
                      panel.id === 'plugins'
                        ? 'relative z-10 flex h-full w-[400px] shrink-0 flex-col justify-between gap-2 p-10'
                        : 'flex w-full flex-1 flex-col justify-end gap-4 overflow-hidden p-8 pt-0 xl:relative xl:z-10 xl:h-full xl:w-[400px] xl:flex-initial xl:shrink-0 xl:justify-between xl:gap-5 xl:overflow-visible xl:p-10'
                    }
                  >
                    <div>
                      <h2
                        className={
                          panel.headingClassName ??
                          'font-alternate text-lg font-semibold leading-snug text-white xl:text-xl'
                        }
                      >
                        {panel.heading}
                      </h2>
                      <p
                        className={
                          panel.descriptionClassName ?? 'mt-2 text-sm leading-relaxed text-white/70'
                        }
                      >
                        {panel.description}
                      </p>
                      {panel.id === 'plugins' ? (
                        <a
                          href={panel.links[0].href}
                          className="group mt-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-white hover:underline"
                        >
                          Learn more
                          <SpriteIcon
                            name="right"
                            className="inline-block size-4 fill-current transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </a>
                      ) : (
                        <div className="mt-4">
                          <div className={panel.links.length > 1 ? 'mt-4 flex items-center gap-6' : ''}>
                            {panel.links.map((link) =>
                              link.href ? (
                                <a
                                  key={link.label}
                                  href={link.href}
                                  className="group inline-flex w-fit items-center gap-2 self-start text-sm font-medium text-white hover:underline"
                                >
                                  {link.label}
                                  <LinkArrow />
                                </a>
                              ) : (
                                <button
                                  key={link.label}
                                  type="button"
                                  className="group inline-flex w-fit items-center gap-2 self-start text-sm font-medium text-white hover:underline"
                                >
                                  {link.label}
                                  <LinkArrow />
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {panel.id === 'plugins' ? (
                      <PluginList />
                    ) : panel.features ? (
                      <FeatureList
                        features={panel.features}
                        active={featureIndex}
                        onChange={(index) =>
                          setFeatureByPanel((current) => ({ ...current, [panel.id]: index }))
                        }
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
