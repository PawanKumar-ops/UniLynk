import SpriteIcon from './SpriteIcon'

const CARDS = [
  {
    title: 'All the AI tools in a single place',
    description:
      'Access multiple top-performing generative models from a single platform. Choose models via the admin panel.',
    image: 'https://media.magnific.com/home/relaunch/media/teams/ai-tools.webp?w=1252&h=694',
  },
  {
    title: 'Unlimited users, flexible credits',
    description:
      'Scale freely with no seat limits. Pay based on how many credits you use—not how many people use them.',
    image: 'https://media.magnific.com/home/relaunch/media/teams/unlimited-users.webp?w=1252&h=694',
  },
]

const FEATURES = [
  [
    {
      icon: 'license',
      title: 'Legal indemnification',
      description: 'Full legal protection for AI-generated content used commercially.',
    },
    {
      icon: 'security',
      title: 'Security & compliance',
      description: 'GDPR, ISO/IEC 27001, and SOC 2. Procurement-ready from day one.',
    },
    {
      icon: 'settings',
      title: 'Admin control',
      description: 'Users, permissions, credits, and model access—one dashboard, total visibility.',
    },
  ],
  [
    {
      icon: 'shield',
      title: 'You own everything',
      description: 'Every asset belongs to you. We never train on your data.',
    },
    {
      icon: 'headphones',
      title: 'Dedicated support',
      description: 'A real team, from onboarding through to day-to-day.',
    },
    {
      icon: 'users',
      title: 'Scale without limits',
      description: 'Flexible credits, parallel generations, and no seat restrictions.',
    },
  ],
]

const QUOTES = [
  {
    logo: 'https://media.magnific.com/home/relaunch/media/hero/companies/rga.svg',
    alt: 'RGA',
    width: 106,
    height: 32,
    logoClass: 'h-5',
    quote:
      "“Best-in-class models and workflow tools through a single unified interface. Magnific has been a key unlock as we've woven AI into our workflows, end to end.”",
    name: 'Nick Coronges',
    role: 'CTO at R/GA',
  },
  {
    logo: 'https://media.magnific.com/home/relaunch/media/hero/companies/deliveryhero.svg',
    alt: 'Delivery Hero',
    width: 103,
    height: 32,
    logoClass: 'h-6',
    quote:
      '“At Delivery Hero, we are highly satisfied with Magnific. It consistently delivers high-quality, reliable results while streamlining workflows and enhancing efficiency.”',
    name: 'Javier Romero',
    role: 'Global Head of Content, Marketing at Delivery Hero',
  },
  {
    logo: 'https://media.magnific.com/home/relaunch/media/hero/companies/jobandtalent.svg',
    alt: 'Job & Talent',
    width: 106,
    height: 32,
    logoClass: 'h-6',
    quote:
      '“Magnific is a key part of our marketing stack. It helps us create high-quality content at scale as we expand our AI-native workforce platform powering our global staffing marketplace.”',
    name: 'Juan Urdiales',
    role: 'Co-Founder and Co-CEO, Job&Talent',
  },
]

export default function TeamPlansSection() {
  return (
    <section className="w-full bg-[#0b0b0b]" data-cy="section-team-plans">
      <div className="mx-auto w-full max-w-screen-xl px-8 py-16 sm:py-20 lg:py-[200px]">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-16">
          <div className="flex flex-col gap-16 pb-8">
            <h3 className="max-w-2xl font-alternate text-5xl font-extrabold leading-none tracking-tight text-[#ffffff] lg:text-7xl">
              Team plans built for creative work at scale
            </h3>
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col">
                  <p className="font-sans text-xl font-semibold leading-snug tracking-tight text-[#ffffff] md:text-3xl">
                    Business
                  </p>
                  <p className="text-base leading-normal text-[#ffffff99] md:text-lg">
                    For creative teams and agencies ready to move faster and produce more. Shared
                    credits, collaborative workflows, and access to every AI model—without the
                    complexity of enterprise procurement.
                  </p>
                </div>
                <a
                  href="https://www.magnific.com/pricing?view=business#from_element=home_team_plans"
                  className="inline-flex h-12 w-fit items-center justify-center rounded-lg bg-[#ffffff] px-6 text-base font-medium text-[#0b0b0b] transition-colors hover:bg-[#e0e0e0]"
                >
                  Learn more
                </a>
              </div>
              <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col">
                  <p className="font-sans text-xl font-semibold leading-snug tracking-tight text-[#ffffff] md:text-3xl">
                    Enterprise
                  </p>
                  <p className="text-base leading-normal text-[#ffffff99] md:text-lg">
                    For organizations where creative output is mission-critical. Full legal
                    indemnification, enterprise-grade security, unlimited users, custom SSO, and a
                    dedicated team from day one.
                  </p>
                </div>
                <a
                  href="https://www.magnific.com/enterprise#contact"
                  className="inline-flex h-12 w-fit items-center justify-center rounded-lg border border-[#ffffff33] px-6 text-base font-medium text-[#ffffff] transition-colors hover:bg-[#ffffff]/5"
                >
                  Talk to the team
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row">
            {CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2lg flex flex-1 flex-col overflow-hidden bg-[#161616]"
              >
                <div className="flex shrink-0 flex-col gap-4 p-8 md:p-12">
                  <h4 className="font-alternate text-xl font-extrabold leading-tight tracking-tight text-[#ffffff] md:text-3xl md:leading-tight">
                    {card.title}
                  </h4>
                  <p className="font-sans text-base font-normal leading-normal text-[#ffffff99] md:text-lg md:leading-normal">
                    {card.description}
                  </p>
                </div>
                <div className="mt-auto w-full pl-8 md:pl-12">
                  <div className="relative aspect-video w-full overflow-hidden rounded-tl-xl">
                    <img
                      alt={card.title}
                      loading="lazy"
                      decoding="async"
                      className="rounded-tl-xl object-cover"
                      style={{
                        position: 'absolute',
                        height: '100%',
                        width: '100%',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        color: 'transparent',
                      }}
                      src={card.image}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2lg flex flex-col gap-12 bg-[#161616] p-8 md:p-12">
            <div className="flex flex-col gap-4">
              <h4 className="font-alternate text-xl font-extrabold leading-tight tracking-tight text-[#ffffff] md:text-3xl md:leading-tight">
                Enterprise features built for scale
              </h4>
              <p className="font-sans text-base font-normal leading-normal text-[#ffffff99] md:text-lg md:leading-normal">
                Security, compliance, and admin control for teams of any size.
              </p>
            </div>
            <div className="flex flex-col gap-8">
              {FEATURES.map((row, index) => (
                <div key={index} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {row.map((feature) => (
                    <div key={feature.title} className="rounded-2lg flex flex-1 gap-4">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#3a3a3a] text-white">
                        <SpriteIcon
                          name={feature.icon}
                          className="inline-block size-4 fill-current"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 text-lg leading-normal">
                        <p className="font-sans font-normal text-[#ffffff]">
                          {feature.title}
                        </p>
                        <p className="font-sans font-normal text-[#ffffff99]">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6 xl:flex-row">
            {QUOTES.map((item) => (
              <div key={item.name} className="rounded-2lg flex flex-1 flex-col gap-4 p-8">
                <img
                  src={item.logo}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  className={`w-auto self-start object-contain ${item.logoClass}`}
                  loading="lazy"
                />
                <p className="font-alternate text-xl font-normal leading-tight text-[#ffffff99]">
                  {item.quote}
                </p>
                <div className="flex flex-col font-sans text-sm leading-relaxed text-[#ffffffd9]">
                  <p className="font-semibold">{item.name}</p>
                  <p className="font-normal">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
