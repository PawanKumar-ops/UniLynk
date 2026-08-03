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
                Start simple.
                <br />
                Scale when you're ready
              </h2>
              <p className="mt-4 max-w-2xl text-base text-[#3f0808] lg:text-lg">
                From a single tool to a complete workflow, at your own pace.
              </p>
            </div>
            <div className="lg:shrink-0">
              <a
                href="https://www.magnific.com/sign-up?client_id=magnific&lang=en#from_element=home_start_simple"
                className="group inline-flex w-fit items-center gap-2 rounded-lg bg-[#101010] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#1a1a1a]"
              >
                Start creating
                <LinkArrow />
              </a>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[403px_391px_391px] xl:grid-rows-[318px_512px] xl:justify-center">
          <article className="rounded-2lg relative flex flex-col gap-6 overflow-hidden bg-[#e3e3e3] text-[#1a1a1a] xl:row-span-2">
            <header className="flex flex-col gap-4 p-8 md:p-10">
              <h3 className="font-alternate text-lg font-bold leading-tight tracking-tight md:text-xl lg:text-2xl">
                Every tool, ready to go
              </h3>
              <p className="font-sans text-sm font-normal leading-normal lg:text-base">
                Every tool, ready to go. Image, video, audio, 3D—thirty tools, no setup. Open what you
                need, make what you want.
              </p>
            </header>
            <img
              src="https://media.magnific.com/home/relaunch/media/useCases/card-alltools-3-2x.webp?w=930&h=1090"
              alt=""
              className="mt-auto h-auto w-full xl:ml-5 xl:h-[551px] xl:w-[470px] xl:max-w-none xl:self-start"
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
                Your entire creative process on one node-based canvas
              </h3>
              <p className="font-sans text-sm font-normal leading-normal text-[#c5c5c5] lg:text-base">
                All your tools. All your workflows. One infinite, node-based canvas. Branch ideas,
                compare versions, work with your team, all in Spaces.
              </p>
            </div>
            <img
              src="https://media.magnific.com/home/relaunch/media/useCases/card-yourentire-2x.webp?w=2860&h=1252"
              alt=""
              className="relative aspect-video w-full object-cover object-left xl:aspect-auto xl:h-[293px] xl:w-auto xl:max-w-none xl:flex-none xl:self-center"
              loading="lazy"
            />
          </article>
          <article className="rounded-2lg relative flex flex-col gap-6 overflow-hidden bg-[#3f0808]">
            <header className="flex flex-col gap-4 p-8 md:p-10">
              <h3 className="font-alternate text-lg font-bold leading-tight tracking-tight text-[#e3e3e3] md:text-xl lg:text-2xl">
                One place, whole team
              </h3>
              <p className="font-sans text-sm font-normal leading-normal text-[#E3C2C2] lg:text-base">
                Organize brand assets, generated content, and workflows with Projects. Your team works
                together, your work stays together.
              </p>
            </header>
            <img
              src="https://media.magnific.com/home/relaunch/media/useCases/card-oneplace-2x.webp?w=2000"
              alt=""
              className="h-auto w-full xl:ml-12 xl:h-[180px] xl:w-[585px] xl:max-w-none xl:self-start"
              loading="lazy"
            />
          </article>
          <article className="rounded-2lg relative min-h-[450px] overflow-hidden">
            <img
              src="https://media.magnific.com/home/relaunch/media/useCases/card-workflow-2x.webp?w=477"
              alt=""
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
            <header className="relative z-10 flex flex-col gap-4 p-8 md:p-10">
              <h3 className="font-alternate text-lg font-bold leading-tight tracking-tight text-neutral-50 md:text-xl lg:text-2xl">
                Workflow in one click
              </h3>
              <p className="font-sans text-sm font-normal leading-normal text-[#BEDBEA] lg:text-base">
                Save any complex on-brand workflow as an App. The next person runs it in one click.
              </p>
            </header>
          </article>
        </div>
      </div>
    </section>
  )
}
