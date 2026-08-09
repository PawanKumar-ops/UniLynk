import SpriteIcon from './SpriteIcon'
import { Icon } from '@iconify/react'

const CARDS = [
  {
    title: 'Everything happening on campus in one place',
    description:
      'Discover clubs, events, and opportunities from one platform designed for every student.',
    image: 'https://res.cloudinary.com/m89jw24l/image/upload/v1786280635/old-masters-picture-gallery-dresden-night_1398-2646.jpg',
  },
  {
    title: 'Built for students, clubs, and communities',
    description:
      'Manage clubs, organize events, and build stronger campus communities with ease.',
    image: 'https://res.cloudinary.com/m89jw24l/image/upload/v1786280959/high-angle-man-working-late-night_23-2150280984.jpg',
  },
]

const FEATURES = [
  [
    {
      icon: 'license',
      title: 'Verified students',
      description: 'A trusted community where every member belongs to your campus.',
    },
    {
      icon: 'security',
      title: 'Privacy first',
      description: 'Your profile, conversations, and activity stay secure and protected.',
    },
    {
      icon: 'settings',
      title: 'Club management',
      description: 'Manage members, announcements, events, and requests from one place.',
    },
  ],
  [
    {
      icon: 'shield',
      title: 'Safe community',
      description: 'Reporting, moderation, and verification help keep the campus welcoming.',
    },
    {
      icon: 'headphones',
      title: 'Always connected',
      description: 'Stay updated with instant notifications for chats, clubs, and events.',
    },
    {
      icon: 'users',
      title: 'Grow together',
      description: 'Meet classmates, join communities, and build lasting campus connections.',
    },
  ],
]

const QUOTES = [
  {
    logo: 'UNILYNK',
    icon: 'fa6-solid:user-group',
    quote:
      '“UniLynk has become the central hub for campus life. Students discover clubs, events, communities, and opportunities from one unified platform.”',
    name: 'Student Council',
    role: 'NIT Kurukshetra',
  },
  {
    logo: 'CAMPUS CLUBS',
    icon: 'solar:buildings-3-bold',
    quote:
      '“Managing clubs is now effortless. Member requests, announcements, and event registrations happen in one place without relying on scattered social platforms.”',
    name: 'Club Coordinator',
    role: 'Student Organizations',
  },
  {
    logo: 'STUDENT LIFE',
    icon: 'solar:chat-line-bold',
    quote:
      '“UniLynk keeps students connected every day. Whether it is finding teammates, joining communities, or attending events, everything starts here.”',
    name: 'Campus Ambassador',
    role: 'UniLynk Community',
  },
]

export default function TeamPlansSection() {
  return (
    <section className="w-full bg-[#0b0b0b]" data-cy="section-team-plans">
      <div className="mx-auto w-full max-w-screen-xl px-8 py-16 sm:py-20 lg:py-[200px]">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-16">
          <div className="flex flex-col gap-16 pb-8">
            <h3 className="max-w-2xl font-alternate text-5xl font-extrabold leading-none tracking-tight text-[#ffffff] lg:text-7xl">
              Connecting every part of campus, beautifully
            </h3>
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col">
                  <p className="font-sans text-xl font-semibold leading-snug tracking-tight text-[#ffffff] md:text-3xl">
                    Students
                  </p>
                  <p className="text-base leading-normal text-[#ffffff99] md:text-lg">
                    Discover communities, attend events, connect with classmates, and explore everything
                    your campus has to offer through one seamless student platform.
                  </p>
                </div>
                <a
                  href="/LoginPage"
                  className="inline-flex h-12 w-fit items-center justify-center rounded-lg bg-[#ffffff] px-6 text-base font-medium text-[#0b0b0b] transition-colors hover:bg-[#e0e0e0]"
                >
                  Get Started
                </a>
              </div>
              <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col">
                  <p className="font-sans text-xl font-semibold leading-snug tracking-tight text-[#ffffff] md:text-3xl">
                    Clubs
                  </p>
                  <p className="text-base leading-normal text-[#ffffff99] md:text-lg">
                    For clubs and campus organizations managing members, events, announcements, and
                    applications. Everything you need to organize, engage, and grow your student
                    community from one place.
                  </p>
                </div>
                <a
                  href="/NewClubForm"
                  className="inline-flex h-12 w-fit items-center justify-center rounded-lg border border-[#ffffff33] px-6 text-base font-medium text-[#ffffff] transition-colors hover:bg-[#ffffff]/5"
                >
                  Create Club
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
                Built for every student
              </h4>
              <p className="font-sans text-base font-normal leading-normal text-[#ffffff99] md:text-lg md:leading-normal">
                Everything you need to connect, discover, and make the most of campus life.
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
                <div className="flex items-center gap-3">
                  <Icon
                    icon={item.icon}
                    className="h-7 w-7 text-[#c4c4c4]"
                  />

                  <span className="font-sans text-[28px] font-extrabold tracking-[-0.04em] text-[#c4c4c4]">
                    {item.logo}
                  </span>
                </div>
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
