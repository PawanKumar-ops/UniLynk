"use client"

import { useState } from "react";
import FaqsSection from "./FaqsSection";

const useGuide = [
    {
        title: "Built for students",
        body: "UniLynk was created with a deep understanding of the challenges students face in navigating campus life. The goal is simple — bring everything students need into one place.",
        alt: "Built for students",
        img: "https://img.magnific.com/free-photo/group-friends-studying-together-helping-each-other_1262-14944.jpg?t=st=1786345319~exp=1786348919~hmac=ff588ff6409d9fa95691c4e3ea9362b8eac125d7e10225c944923a47316cc56b&w=1480",
        reverse: true,
    },
    {
        title: "A more connected campus",
        body: "UniLynk helps students connect with peers, discover clubs, and stay updated with campus activities — making it easier to be involved, informed, and engaged.",
        alt: "Connected campus",
        img: "https://img.magnific.com/free-photo/architecture-independence-palace-ho-chi-minh-city_181624-21243.jpg?t=st=1786345390~exp=1786348990~hmac=259a2fe7a5419b29bffad7ec80893f7964b0da834c5a814b8accd05052e19db5&w=1480",
        reverse: false,
    },
    {
        title: "Simplifying everyday student life",
        body: "From asking for help to exploring opportunities and staying in touch with your campus community, UniLynk is designed to make student life smoother and more accessible.",
        alt: "Student life simplified",
        img: "https://img.magnific.com/free-photo/student-online-young-guy-checked-shirt-with-glasses-studying-computer-looking-screen_140725-164806.jpg?t=st=1786345453~exp=1786349053~hmac=8ac5a65388dc8c51f8e0c17d586045db11e8d3fd2b818bd5749f12fe6051c954&w=1480",
        reverse: true,
    },
];


const features = [
    {
        icon: <IconApi />,
        title: "Student connections",
        body: "Connect with peers across your campus, build networks, and stay engaged with your community.",
    },
    {
        icon: <IconSso />,
        title: "Clubs & communities",
        body: "Explore and join clubs, discover like-minded people, and be part of active campus groups.",
    },
    {
        icon: <IconSecurity />,
        title: "Events & activities",
        body: "Stay updated with campus events, workshops, and activities happening around you.",
    },
    {
        icon: <IconLicense />,
        title: "Ask for help",
        body: "Get support from fellow students for academics, guidance, or everyday campus needs.",
    },
    {
        icon: <IconSettings />,
        title: "Seamless experience",
        body: "Everything you need in one place, designed to make campus life simple and accessible.",
    },
    {
        icon: <IconLogo />,
        title: "Built for campus",
        body: "Designed specifically for students to connect, collaborate, and grow within their campus environment.",
    },
];

function IconApi() {
    return (
        <svg viewBox="0 0 24 24" className="inline-block size-4 fill-current" aria-hidden="true">
            <path d="M8.5 8.5 5 12l3.5 3.5M15.5 8.5 19 12l-3.5 3.5M13.5 6l-3 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconSso() {
    return (
        <svg viewBox="0 0 24 24" className="inline-block size-4 fill-current" aria-hidden="true">
            <path d="M12 3a4 4 0 0 1 4 4v3H8V7a4 4 0 0 1 4-4Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <rect x="5" y="10" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}
function IconSecurity() {
    return (
        <svg viewBox="0 0 24 24" className="inline-block size-4 fill-current" aria-hidden="true">
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconLicense() {
    return (
        <svg viewBox="0 0 24 24" className="inline-block size-4 fill-current" aria-hidden="true">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="14.5" cy="16" r="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
    );
}
function IconSettings() {
    return (
        <svg viewBox="0 0 24 24" className="inline-block size-4 fill-current" aria-hidden="true">
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}
function IconLogo() {
    return (
        <svg viewBox="0 0 24 24" className="inline-block size-4 fill-current" aria-hidden="true">
            <path d="M3 20V6.5c0-.75.9-1.1 1.4-.5L12 14l7.6-8c.5-.6 1.4-.25 1.4.5V20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconFold({ className }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function Field({ label, children }) {
    return (
        <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <label className="font-semibold leading-relaxed text-[#1a1214]/75 text-xs">
                        {label}
                    </label>
                </div>
                {children}
            </div>
        </div>
    );
}

const inputWrap =
    "flex w-full items-center border bg-[#f4f3ef] px-3 border-[#1a1214]/[0.14] transition-colors hover:border-[#6b7280] focus-within:border-[#6b7280] focus-within:shadow-[inset_0_0_0_1px_#6b7280] h-10 gap-3 rounded-lg text-sm";
const inputCls =
    "min-w-0 grow border-none bg-transparent outline-none text-[#1a1214] placeholder:text-[#1a1214]/45";
const selectCls =
    "group flex h-10 w-full appearance-none items-center rounded-lg border bg-[#f4f3ef] border-[#1a1214]/[0.14] pl-4 pr-10 text-sm text-[#1a1214]/45 transition-colors outline-none hover:border-[#6b7280] focus:border-[#6b7280] focus:shadow-[inset_0_0_0_1px_#6b7280]";

export default function EnterpriseFeatures() {
    const [open, setOpen] = useState(null);

    return (
        <div className="bg-[#F4F3EF] -mt-[1px]">
            <section className="mx-auto flex max-w-screen-xl flex-col gap-36 px-5 pb-20 md:gap-48 md:px-8">
                {/* Use guide */}
                <div className="flex flex-col gap-16">
                    <div className="flex w-full min-w-0 flex-1 flex-col gap-[1.125rem] text-center items-center">
                        <div className="flex flex-col gap-3 text-center items-center">
                            <h2 className=" text-3xl font-extrabold leading-tight text-[#2a0f12] min-[480px]:text-4xl min-[480px]:leading-none md:text-5xl">
                                Designed to simplify campus life and keep students connected
                            </h2>
                        </div>
                        <p className="max-w-screen-sm text-sm leading-relaxed text-[#2a0f12] sm:text-base xl:text-lg xl:leading-normal 2xl:text-xl">
                            Designed to simplify campus life and keep students connected every day

                        </p>
                    </div>
                    <div className="flex flex-col gap-8 md:gap-11 xl:gap-16">
                        {useGuide.map((row) => (
                            <div
                                key={row.title}
                                className="relative mx-auto grid grid-cols-1 items-center justify-center gap-8 md:max-w-screen-xl xl:gap-28 sm:grid-cols-2 max-w-full sm:items-stretch sm:gap-12 md:gap-14 lg:gap-20"
                            >
                                <div className={row.reverse ? "order-none sm:order-1" : ""}>
                                    <div className="relative w-full overflow-hidden aspect-square rounded-[0.875rem]">
                                        <img
                                            alt={row.alt}
                                            loading="lazy"
                                            decoding="async"
                                            sizes="100vw"
                                            src={row.img}
                                            className="absolute inset-0 h-full w-full object-cover rounded-[0.875rem]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-col items-start justify-center gap-10 self-stretch sm:h-full">
                                        <div className="flex flex-col items-start gap-4">
                                            <h3 className=" text-2xl font-extrabold leading-tight tracking-tight text-[#2a0f12] min-[480px]:text-3xl md:text-4xl md:leading-none">
                                                {row.title}
                                            </h3>
                                        </div>
                                        <div className="space-y-3 text-sm leading-relaxed text-[#2a0f12] sm:text-base">
                                            {row.body}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Full control feature grid */}
                <div className="flex flex-col gap-16">
                    <div className="flex w-full min-w-0 flex-1 flex-col gap-[1.125rem] text-left items-start">
                        <div className="flex flex-col gap-3 text-left items-start">
                            <h2 className="text-3xl font-extrabold leading-tight text-[#2a0f12] min-[480px]:text-4xl min-[480px]:leading-none md:text-5xl">
                                Everything you need for campus life
                            </h2>
                        </div>
                        <p className="max-w-screen-sm text-sm leading-relaxed text-[#2a0f12] sm:text-base xl:text-lg xl:leading-normal 2xl:text-xl">
                            A unified platform designed to help students connect, discover, and navigate campus life effortlessly.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-3 lg:grid-cols-3">
                        {features.map((f) => (
                            <div key={f.title} className="flex items-start gap-4">
                                <span className="flex shrink-0 items-center justify-center rounded-lg size-8 border border-[#1a1214]/[0.14] text-[#2a0f12]">
                                    {f.icon}
                                </span>
                                <div className="flex flex-col gap-1 text-[#2a0f12] min-w-0 flex-1">
                                    <p className="font-medium text-base leading-relaxed lg:text-lg lg:leading-normal xl:text-xl">
                                        {f.title}
                                    </p>
                                    <p className="text-sm leading-relaxed lg:text-base xl:text-lg xl:leading-normal">
                                        {f.body}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* About College */}
                <section className="mx-auto max-w-screen-2xl">
                    <div className="flex flex-col items-center justify-center gap-3 px-5 text-[#1a1214]/60 md:px-0">
                        <header className="relative mx-auto mb-12 max-w-screen-lg">
                            <h2 className="text-center text-4xl font-normal text-[#1a1214] md:text-balance lg:text-5xl">
                                Built for NIT Kurukshetra
                            </h2>
                            <p className="mt-4 text-center text-lg font-normal leading-relaxed text-[#1a1214]/60 md:text-balance">
                                Live at NIT Kurukshetra. Connecting students, all in one place.
                            </p>
                        </header>
                        <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">

                            <div key="NIT Kurukshetra" className="h-[150px]">
                                <img
                                    alt="NIT Kurukshetra"
                                    loading="lazy"
                                    width={150}
                                    height={150}
                                    decoding="async"
                                    className="h-full object-contain"
                                    src="https://res.cloudinary.com/m89jw24l/image/upload/v1786346101/NITLOGO.webp"
                                />
                            </div>

                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section
                    id="contact"
                    className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16"
                >
                    <div className="flex w-full min-w-0 flex-1 flex-col gap-[1.125rem] text-left items-start">
                        <div className="flex flex-col gap-3 text-left items-start">
                            <h2 className="text-3xl font-extrabold leading-tight text-[#2a0f12] min-[480px]:text-4xl min-[480px]:leading-none md:text-5xl">
                                Let’s connect
                            </h2>
                        </div>

                        <p className="max-w-screen-sm text-sm leading-relaxed text-[#2a0f12] sm:text-base xl:text-lg xl:leading-normal 2xl:text-xl">
                            Have feedback, questions, or need help? Fill out the form and we’ll get back to you as soon as possible.
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => e.preventDefault()}
                        className="grid w-full grid-cols-4 gap-x-4 gap-y-6 rounded-[0.875rem] bg-white p-5 md:p-8"
                    >
                        <div className="col-span-4">
                            <Field label="Reason">
                                <div className="relative">
                                    <select className={selectCls} defaultValue="">
                                        <option value="" disabled>
                                            Select a reason
                                        </option>
                                        <option value="feedback">Feedback</option>
                                        <option value="support">Need help</option>
                                        <option value="bug">Report an issue</option>
                                        <option value="feature">Suggest a feature</option>
                                        <option value="other">Something else</option>
                                    </select>

                                    <IconFold className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 fill-current text-[#1a1214]/60" />
                                </div>
                            </Field>
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                            <Field label="First name">
                                <div className={inputWrap}>
                                    <input type="text" className={inputCls} placeholder="Yash" name="firstName" />
                                </div>
                            </Field>
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                            <Field label="Last name">
                                <div className={inputWrap}>
                                    <input type="text" className={inputCls} placeholder="Sharma" name="lastName" />
                                </div>
                            </Field>
                        </div>

                        <div className="col-span-4">
                            <Field label="Subject">
                                <div className={inputWrap}>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        placeholder="subject..."
                                        name="subject"
                                    />
                                </div>
                            </Field>
                        </div>

                        <div className="col-span-4">
                            <Field label="Email">
                                <div className={inputWrap}>
                                    <input
                                        type="email"
                                        className={inputCls}
                                        placeholder="name@company.com"
                                        name="email"
                                    />
                                </div>
                            </Field>
                        </div>

                        <div className="col-span-4">
                            <Field label="Phone (optional)">
                                <div className="grid grid-cols-4 gap-x-4 gap-y-2">

                                    <div className="col-span-4 sm:col-span-3">
                                        <div className={inputWrap}>
                                            <input
                                                type="tel"
                                                className={inputCls}
                                                placeholder="Phone number"
                                                name="phoneWithoutPrefix"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Field>
                        </div>

                        <div className="col-span-4">
                            <Field label="Message">
                                <textarea
                                    rows={5}
                                    className="flex w-full border bg-[#f4f3ef] px-3 border-[#1a1214]/[0.14] transition-colors text-[#1a1214] placeholder:text-[#1a1214]/45 hover:border-[#6b7280] outline-none focus:border-[#6b7280] focus:shadow-[inset_0_0_0_1px_#6b7280] grow gap-3 rounded-lg text-sm resize-none items-start py-2.5 leading-relaxed min-h-[146px]"
                                    placeholder="Tell us what you need. Please be as detailed as you can."
                                    name="description"
                                />
                            </Field>
                        </div>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 font-medium transition duration-150 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 active:outline-none text-nowrap h-12 px-6 text-base bg-[#1a1a1a] text-white hover:bg-black active:bg-black rounded-lg col-span-4 w-full"
                        >
                            Submit
                        </button>
                    </form>
                </section>

                {/* FAQ */}
                <FaqsSection />
            </section>
        </div>
    );
}
