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
        description: "Never miss workshops, fests, hackathons, and club activities."
      },
      {
        icon: "post",
        label: "Campus Feed",
        description: "See updates, announcements, and posts shared across your campus."
      },
      {
        icon: "clubs",
        label: "Clubs",
        description: "Discover student clubs and become part of communities you love."
      },
      {
        icon: "network",
        label: "Networking",
        description: "Meet seniors, classmates, and students across departments."
      }
    ]
  },
  {
    id: 'mcp-api',
    tab: 'MCP & API',
    isNew: true,
    heading: 'The models, assets, and workflows that run Magnific, now yours',
    description:
      'Connect via MCP and use Magnific from any AI agent. Or go deeper with the API. Both run on credits, like the rest of your plan.',
    links: [
      { label: 'MCP', href: 'https://www.magnific.com/mcp#from_element=home_tabs_mcp-api_mcp' },
      { label: 'API', href: 'https://www.magnific.com/api#from_element=home_tabs_mcp-api_api' },
    ],
    video: 'https://media.magnific.com/home/relaunch/media/tabs/videos/developer-api.webm',
    features: [
      {
        icon: 'mcp',
        label: 'MCP',
        description:
          'All of Magnific in your workspace, through MCP. Use it from Claude, ChatGPT, Cursor, and more.',
      },
      {
        icon: 'images',
        label: 'Image API',
        description: 'Generate images with multi-image references. Every leading model.',
      },
      {
        icon: 'video',
        label: 'Video API',
        description:
          'Static image to dynamic video with motion control. Built for ads, content, and film.',
      },
      {
        icon: 'microphone',
        label: 'Audio API',
        description:
          'Text to speech, voice cloning, lip sync, and sound generation. Every audio output from one endpoint.',
      },
      {
        icon: 'resources',
        label: 'Stock API',
        description: 'Access 250M+ licensed assets directly from your stack.',
      },
    ],
  },
  {
    id: 'agents',
    tab: 'Agents',
    isNew: true,
    heading: 'Design the agent. Direct the work.',
    description:
      'Feed it your brand book, your references, your workflow. The agent learns your world and works the way you do.',
    links: [
      {
        label: 'Build your agent',
        href: 'https://www.magnific.com/agents#from_element=home_tabs_agents',
      },
    ],
    image: {
      src: 'https://media.magnific.com/home/relaunch/media/tabs/images/agents-2x.webp',
      srcSet:
        'https://media.magnific.com/home/relaunch/media/tabs/images/agents-1x.webp 1x, https://media.magnific.com/home/relaunch/media/tabs/images/agents-2x.webp 2x',
    },
    features: [
      {
        icon: 'book',
        label: 'Knowledge bases',
        description:
          'Upload your brand book, references, and manuals. The agent starts from your world, not a blank slate.',
      },
      {
        icon: 'code-block',
        label: 'Skills as files',
        description: 'Drop a skill as a markdown file. Your rulebook, applied every time.',
      },
      {
        icon: 'history',
        label: 'Memory that sticks',
        description: 'Remembers your preferences and project conventions across every session.',
      },
      {
        icon: 'play',
        label: 'Operates the canvas',
        description:
          'Not a chat beside your work. It wires nodes, picks models, and runs tasks inside your space.',
      },
    ],
  },
  {
    id: 'plugins',
    tab: 'Plugins',
    isNew: true,
    heading: 'Magnific, where you already create.',
    headingClassName:
      'font-alternate text-lg font-extrabold leading-tight tracking-tight text-white xl:text-xl',
    description:
      'Generate, upscale, and edit with Magnific, without ever leaving your editor. Install the plugin and start creating where you already work.',
    descriptionClassName: 'mt-2 text-sm leading-relaxed text-white/70 xl:hidden',
    links: [
      { label: 'Learn more', href: 'https://www.magnific.com/plugins#from_element=home_tabs_plugins' },
    ],
  },
  {
    id: 'stock',
    tab: 'Stock',
    heading: "The world's creative library. Ready to use.",
    description:
      '250M+ photos, vectors, icons, and templates. Licensed for commercial use, connected to every workflow on Magnific.',
    links: [{ label: 'More info', href: 'https://www.magnific.com/stock#from_element=home_tabs_stock' }],
    video: 'https://media.magnific.com/home/relaunch/media/tabs/videos/stock.webm',
    features: [
      { icon: 'photo', label: 'Photos', description: 'Millions of high-quality images.' },
      {
        icon: 'vector',
        label: 'Vectors & illustrations',
        description: 'Editable Photoshop files with every layer intact.',
      },
      {
        icon: 'psd',
        label: 'PSD',
        description: 'Editable Photoshop files with every layer intact.',
      },
      {
        icon: 'template',
        label: 'Templates',
        description: 'Pro-designed templates for every format and brand.',
      },
      {
        icon: 'video',
        label: 'Video',
        description: '4K clips for ads, social, and film. References for AI generation.',
      },
      {
        icon: 'icons',
        label: 'Icons',
        description: 'Consistent icon sets for UI, brand, and presentations.',
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
                One place to create anything
              </h2>
              <p className="mt-4 max-w-2xl text-base text-[#3f0808] lg:text-lg">
                Pick your starting point. Every tool, every model, every format.
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
