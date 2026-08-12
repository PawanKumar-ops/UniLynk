"use client"
import EnterpriseFeatures from "@/components/landingPage/EnterpriseFeatures";
import "../index.css"
import SiteHeader from "@/components/landingPage/SiteHeader";
import SiteFooter from "@/components/landingPage/SiteFooter";

export default function About() {
    return (
        <div className="min-h-screen bg-[#0a0a0b]">
            {/* Navigation */}
            <SiteHeader />

            {/* Hero */}
            <section className="relative flex min-h-[650px] flex-col overflow-hidden bg-[#0a0a0b] py-10 lg:min-h-[730px] lg:py-20">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="pointer-events-none absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover"
                >
                    <source src="https://res.cloudinary.com/m89jw24l/video/upload/v1786341392/about-hero.mp4" type="video/mp4" />
                </video>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-black/50"
                />
                <div className="relative z-[1] mx-auto flex w-full max-w-screen-2xl flex-1 flex-col justify-center px-5 sm:px-10 lg:px-20">
                    <div className="flex max-w-2xl flex-col gap-6">
                        <h1 className="font-alternate text-4xl leading-[1.15] tracking-tight text-[#ffffff] sm:text-5xl lg:text-[55px]">
                            UniLynk is the all-in-one platform for campus life
                        </h1>
                        <p className="text-lg leading-relaxed text-[#f0f0f1] lg:text-2xl">
                            Connect with students, explore clubs, discover events, and get help within your campus — all in one place.
                        </p>
                        <a
                            href="./LoginPage"
                            className="flex items-center justify-center gap-2 text-nowrap h-12 rounded-lg bg-[#fafafa] px-6 text-base font-medium text-[#0f0f10] transition duration-150 ease-in-out hover:bg-[#f0f0f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 active:bg-[#e4e4e6] active:outline-none w-fit"
                        >
                            Discover Unilynk
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="-49 141 512 512"
                                width="16"
                                height="16"
                                aria-hidden="true"
                                className="h-[1em] w-[1em] fill-current text-sm"
                            >
                                <path d="M-24 422h401.645l-72.822 72.822c-9.763 9.763-9.763 25.592 0 35.355 9.763 9.764 25.593 9.762 35.355 0l115.5-115.5a25 25 0 0 0 0-35.355l-115.5-115.5c-9.763-9.762-25.593-9.763-35.355 0-9.763 9.763-9.763 25.592 0 35.355l72.822 72.822H-24c-13.808 0-25 11.193-25 25S-37.808 422-24 422" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* Press guidelines + Spokespeople */}
            <div className="bg-[#F4F3EF]">
                <section className="py-36 px-5 text-[#2a0f12] md:py-48">
                    <div className="mx-auto flex max-w-screen-lg flex-col items-center gap-8 text-center">
                        <h2 className=" text-4xl font-extrabold leading-none -tracking-wide md:text-6xl">
                            About UniLynk
                        </h2>
                        <div className="space-y-6 text-xl md:text-2xl">
                            <p className="opacity-70">
                                UniLynk is a student-first platform built to simplify campus life. From joining clubs and discovering events to asking for help and connecting with peers, UniLynk brings everything together in one seamless experience.
                            </p>

                            <p className="opacity-70">
                                Our mission is to make every student more connected, informed, and empowered by creating a space where opportunities, communities, and conversations thrive.
                            </p>

                        </div>
                    </div>
                </section>
            </div>

            <EnterpriseFeatures />
            <SiteFooter />
        </div>
    );
}
