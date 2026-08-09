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

export default function StartSimpleSection() {
  return (
    <section className="w-full py-16 sm:py-20 lg:py-[12vh]" data-cy="section-start-simple">
      <div className="mx-auto w-full max-w-screen-xl px-8">
        <div className="mx-auto mb-10 w-full max-w-none px-0 sm:px-0 lg:mb-14 lg:px-0">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <h2 className="max-w-2xl font-alternate text-3xl font-bold leading-tight text-[#3f0808] lg:text-5xl">
                Find your people.
                <br />
                Build your campus
              </h2>
              <p className="mt-4 max-w-2xl text-base text-[#3f0808] lg:text-lg">
                Discover clubs, events and students—all in one place, built for your campus.
              </p>
            </div>
            <div className="lg:shrink-0">
              <a
                href="https://www.magnific.com/sign-up?client_id=magnific&lang=en#from_element=home_start_simple"
                className="group inline-flex w-fit items-center gap-2 rounded-lg bg-[#101010] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#1a1a1a]"
              >
                Explore Campus
                <LinkArrow />
              </a>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[403px_391px_391px] xl:grid-rows-[318px_512px] xl:justify-center">
          <article className="rounded-2lg relative flex flex-col gap-6 overflow-hidden bg-[#e3e3e3] text-[#1a1a1a] xl:row-span-2">
            <header className="flex flex-col gap-4 p-8 md:p-10">
              <h3 className="font-alternate text-lg font-bold leading-tight tracking-tight md:text-xl lg:text-2xl">
                Everything on campus
              </h3>
              <p className="font-sans text-sm font-normal leading-normal lg:text-base">
                Discover clubs, events, communities and opportunities. Everything happening on your campus, all in one place.
              </p>
            </header>
            <img
              src="https://res.cloudinary.com/m89jw24l/image/upload/v1786280274/high-angle-laptop-books-assortment_23-2149765847.jpg"
              alt=""
              className="mt-auto rounded-t-2xl h-auto w-full xl:ml-5 xl:h-[551px] xl:w-[470px] xl:max-w-none xl:self-start"
              loading="lazy"
            />
          </article>
          <article className="rounded-2lg relative flex flex-col overflow-hidden bg-[#101010] xl:col-span-2 xl:flex-row xl:items-stretch">
            <img
              src="https://media.magnific.com/home/relaunch/media/useCases/spaces-bg.svg"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute inset-0 size-full object-cover"
            />
            <div className="relative flex flex-col gap-4 p-8 md:p-10 xl:max-w-[400px] xl:shrink-0">
              <h3 className="font-alternate text-lg font-bold leading-tight tracking-tight text-[#e3e3e3] md:text-xl lg:text-2xl">
                Everything you need without switching tabs
              </h3>
              <p className="font-sans text-sm font-normal leading-normal text-[#c5c5c5] lg:text-base">
                Every update. Every conversation. One familiar
                experience. Explore faster,
                stay informed, work naturally,
                without leaving the app.
              </p>
            </div>
            <img
              src="https://res.cloudinary.com/m89jw24l/image/upload/v1786279956/authentic-book-club-scene_23-2150104609.jpg"
              alt=""
              className="relative rounded-2xl aspect-video w-full object-cover object-left xl:aspect-auto xl:h-[293px] xl:w-auto xl:max-w-none xl:flex-none xl:self-center"
              loading="lazy"
            />
          </article>
          <article className="rounded-2lg relative flex flex-col gap-6 overflow-hidden bg-[#3f0808]">
            <header className="flex flex-col gap-4 p-8 md:p-10">
              <h3 className="font-alternate text-lg font-bold leading-tight tracking-tight text-[#e3e3e3] md:text-xl lg:text-2xl">
                Built for every community
              </h3>
              <p className="font-sans text-sm font-normal leading-normal text-[#E3C2C2] lg:text-base">
                Bring people together,
                share important moments, and build
                stronger connections. Every member stays
                in sync, every update stays visible.
              </p>
            </header>
            <img
              src="https://res.cloudinary.com/m89jw24l/image/upload/v1786280034/paper-dolls-against-sky_23-2148144531.jpg"
              alt=""
              className="h-auto rounded-2xl w-full xl:ml-12 xl:h-[180px] xl:w-[585px] xl:max-w-none xl:self-start"
              loading="lazy"
            />
          </article>
          <article className="rounded-2lg relative min-h-[450px] overflow-hidden">
            <img
              src="https://res.cloudinary.com/m89jw24l/image/upload/v1786278936/man-doing-extreme-tricks-long-shot.jpg"
              alt=""
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
            <header className="relative z-10 flex flex-col gap-4 p-8 md:p-10">
              <h3 className="font-alternate text-lg font-bold leading-tight tracking-tight text-neutral-50 md:text-xl lg:text-2xl">
                Always within reach
              </h3>
              <p className="font-sans text-sm font-normal leading-normal text-[#DCE8F2] lg:text-base">
                Open any discussion,
                find what matters instantly. The next
                message reaches everyone
                without missing a beat.
              </p>
            </header>
          </article>
        </div>
      </div>
    </section>
  )
}
