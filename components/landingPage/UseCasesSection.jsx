const FILL = {
  position: 'absolute',
  height: '100%',
  width: '100%',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  color: 'transparent',
}

const CARDS = [
  {
    title: 'Campus Events',
    description:
      'Discover upcoming events, workshops, and activities happening across your campus.',
    image: 'https://res.cloudinary.com/m89jw24l/image/upload/v1786281142/close-up-recording-video-with-smartphone-concert-toned-picture_1153-6815.jpg',
  },
  {
    title: 'Student Clubs',
    description:
      'Join communities, meet like-minded students, and grow through shared interests.',
    image: 'https://res.cloudinary.com/m89jw24l/image/upload/v1786281290/colleagues-working-together-full-shot_23-2149739303.jpg',
  },
  {
    title: 'Campus Network',
    description:
      'Connect with classmates, share updates, and build meaningful campus relationships.',
    image: 'https://res.cloudinary.com/m89jw24l/image/upload/v1786281327/brown-white-concrete-building-blue-sky-daytime_246466-17.jpg',
  },
]

export default function UseCasesSection() {
  return (
    <section
      className="mx-auto w-full max-w-screen-xl px-8 py-16 sm:py-20 lg:py-[12vh]"
      data-cy="section-use-cases"
    >
      <div className="mx-auto mb-10 w-full max-w-none px-0 sm:px-0 lg:mb-14 lg:px-0">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <h2 className="max-w-2xl font-alternate text-3xl font-bold leading-tight text-[#3f0808] lg:text-5xl">
              Everything you need for campus life
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#3f0808] lg:text-lg">
              Discover clubs, attend events, connect with students, and stay updated through one unified platform designed for campus life.
            </p>
          </div>
          <div className="lg:shrink-0">
            <a
              href="https://www.magnific.com/sign-up?client_id=magnific&lang=en#from_element=home_use_cases"
              className="group inline-flex w-fit items-center gap-2 rounded-lg bg-[#101010] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#1a1a1a]"
            >
              Explore now
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
            </a>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.title}
            className="rounded-2lg relative flex aspect-[3/4] flex-col justify-end overflow-hidden p-6"
          >
            <img
              alt={card.title}
              loading="lazy"
              decoding="async"
              className="object-cover"
              style={FILL}
              src={card.image}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            <div className="relative">
              <h3 className="font-alternate text-lg font-bold leading-tight tracking-tight text-white md:text-xl lg:text-2xl">
                {card.title}
              </h3>
              <p className="mt-2 font-sans text-sm font-normal leading-normal text-white/70 lg:text-base">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2lg relative mt-4 flex aspect-[21/9] flex-col justify-end overflow-hidden p-6 md:aspect-[3/1]">
        <video
          loop
          playsInline
          muted
          autoPlay
          preload="none"
          poster="https://res.cloudinary.com/m89jw24l/image/upload/v1786282215/videoframe_5538.png"
          className="absolute inset-0 size-full object-cover"
        >
          <source
            src="https://res.cloudinary.com/m89jw24l/video/upload/v1786281826/1103252_1080p_Endurance_1280x720.mp4"
            type="video/webm"
          />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="relative">
          <h3 className="font-alternate text-lg font-bold leading-tight tracking-tight text-white md:text-xl lg:text-2xl">
            Campus Life
          </h3>
          <p className="mt-2 max-w-lg font-sans text-sm font-normal leading-normal text-white/70 lg:text-base">
            Experience the energy of your campus through communities, events, and unforgettable student moments.
          </p>
        </div>
      </div>
    </section>
  )
}
