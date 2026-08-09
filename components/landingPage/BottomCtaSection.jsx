import SpriteIcon from './SpriteIcon'

export default function BottomCtaSection() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#2a0505]"
      data-cy="section-bottom-cta"
    >
      <img
        src="https://res.cloudinary.com/m89jw24l/image/upload/v1786281670/man-standing-stone-hooker-valley-track-with-view-mount-cook-new-zealand_181624-12196.jpg"
        srcSet="https://res.cloudinary.com/m89jw24l/image/upload/v1786281670/man-standing-stone-hooker-valley-track-with-view-mount-cook-new-zealand_181624-12196.jpg"
        sizes="100vw"
        alt=""
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 size-full object-cover object-center"
      />
      <div className="relative mx-auto flex w-full max-w-screen-xl flex-col items-center px-8 py-24 text-center sm:py-32 lg:py-[20vh]">
        <h2 className="font-alternate text-5xl font-semibold leading-tight text-white md:text-6xl lg:text-7xl">
          Join Unilynk
        </h2>
        <a
          href="https://www.magnific.com/sign-up?client_id=magnific&lang=en#from_element=home_bottom_cta"
          className="mt-8 inline-flex h-10 items-center justify-center gap-2 text-nowrap rounded-lg bg-[#101010] px-6 py-3 text-base font-medium text-white transition duration-150 ease-in-out hover:bg-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffffff4c] active:outline-none"
        >
          Get Started
          <SpriteIcon name="right-small" className="inline-block size-4 fill-current" />
        </a>
      </div>
    </section>
  )
}
