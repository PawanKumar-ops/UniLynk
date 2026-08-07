"use client"
import { useEffect, useState } from 'react'
import { Inter, Bricolage_Grotesque } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

const bricolage = Bricolage_Grotesque({
    subsets: ["latin"],
    weight: ["600", "700"],
});

/* ------------------------------------------------------------------ *
 * Promo carousel (left panel)
 * ------------------------------------------------------------------ */

const SLIDE_DURATION = 7000

const slides = [
    {
        key: 'spaces',
        label: 'Spaces',
        title: 'Build together, faster',
        body: 'Node-based workflows on an infinite canvas.',
        image: 'https://mkt.cdnpk.net/web-app/media/magnific-spaces.webp',
        alt: 'Build together, faster',
    },
    {
        key: 'image',
        label: 'Image',
        title: 'From idea to final image',
        body: 'A complete image workflow: generation, editing, and upscaling with professional control.',
        image: 'https://mkt.cdnpk.net/web-app/media/magnific-image.webp',
        alt: 'From idea to final image',
    },
    {
        key: 'video',
        label: 'Video',
        title: 'Direct every frame',
        body: 'Video creation and editing with full creative control, start to finish.',
        image:
            'https://images.unsplash.com/photo-1562350683-774f43c5bdca?w=1400&h=1800&fit=crop&auto=format',
        alt: 'Direct every frame',
    },
    {
        key: 'audio',
        label: 'Audio',
        title: 'Generate audio for your projects',
        body: 'Generation of music, voiceovers, and sound effects with the quality your work needs.',
        image: 'https://mkt.cdnpk.net/web-app/media/magnific-audio.webp',
        alt: 'Generate audio for your projects',
    },
    {
        key: '3d',
        label: '3D',
        title: 'Generate in 3D',
        body: 'Models, scenes, and environments ready for any of your projects.',
        image: 'https://mkt.cdnpk.net/web-app/media/magnific-3d.webp',
        alt: 'Generate in 3D',
    },
]

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */

function MagnificMark() {
    return (
        <svg
            className="h-11 w-11 text-[#0b0b0c]"
            viewBox="0 0 44 44"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M26.4003 6.84445L22 17.6336L17.602 6.84445H8.80145L0.000932151 38.1333C-0.117031 38.1333 11.0005 38.1333 11.0005 38.1333L22 24.1066L32.9995 38.1333C32.9995 38.1333 44.117 38.1333 43.9991 38.1333L35.2008 6.84445H26.4003Z"
                fill="currentColor"
            />
        </svg>
    )
}

function GoogleMark() {
    return (
        <svg className="size-[18px] shrink-0" viewBox="0 0 48 48" aria-hidden="true">
            <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
        </svg>
    )
}

function AppleMark() {
    return (
        <svg
            className="size-4 shrink-0"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M13.62 12.36c-.24.55-.52 1.06-.85 1.53-.45.64-.82 1.08-1.1 1.32-.43.4-.9.6-1.39.61-.36 0-.79-.1-1.29-.31-.5-.21-.95-.31-1.37-.31-.44 0-.91.1-1.41.31-.5.21-.91.32-1.22.33-.48.02-.95-.19-1.42-.62-.31-.26-.7-.71-1.16-1.37-.5-.7-.92-1.51-1.24-2.43C.79 10.42.55 9.45.55 8.5c0-1.09.24-2.03.71-2.82.37-.64.86-1.14 1.48-1.51.61-.37 1.27-.56 1.99-.57.39 0 .89.12 1.52.36s1.03.36 1.21.36c.13 0 .58-.14 1.34-.42.72-.26 1.33-.37 1.83-.33 1.36.11 2.38.65 3.06 1.62-1.22.74-1.82 1.78-1.81 3.11.01 1.04.39 1.9 1.13 2.59.33.32.71.56 1.12.74-.09.26-.18.51-.29.74zM10.74.32c0 .81-.3 1.58-.89 2.28-.71.84-1.58 1.32-2.51 1.25-.01-.1-.02-.21-.02-.32 0-.78.34-1.62.94-2.31C8.56.87 8.98.61 9.45.4c.47-.21.93-.32 1.36-.34.01.09.02.18.02.27z" />
        </svg>
    )
}

function SsoMark() {
    return (
        <svg
            className="h-4 shrink-0"
            viewBox="0 0 13 16"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M5.82187 10.0938C5.62187 10.0938 5.42187 10.0188 5.27187 9.86563L3.325 7.92813C3.01875 7.625 3.01875 7.12813 3.32188 6.82188C3.625 6.51563 4.12187 6.51562 4.42812 6.81875L5.82813 8.2125L8.51875 5.56563C8.825 5.2625 9.32188 5.26562 9.625 5.575C9.92813 5.88125 9.925 6.37813 9.61563 6.68125L6.375 9.86875C6.21875 10.0187 6.01875 10.0938 5.82187 10.0938Z" />
            <path d="M6.4375 15.6875C6.30625 15.6875 6.17812 15.6562 6.05937 15.5906L4.275 14.6062C1.6375 13.15 0 10.3719 0 7.35625V2.34375C0 1.99375 0.234375 1.68438 0.571875 1.59063L6.22813 0.028125C6.36563 -0.009375 6.50938 -0.009375 6.64375 0.028125L12.3 1.59063C12.6375 1.68438 12.8719 1.99375 12.8719 2.34375V7.35625C12.8719 10.3687 11.2344 13.1469 8.59688 14.6062L6.8125 15.5906C6.69688 15.6562 6.56875 15.6875 6.4375 15.6875ZM1.5625 2.94062V7.35938C1.5625 9.80313 2.89063 12.0594 5.03125 13.2406L6.4375 14.0156L7.84375 13.2406C9.98438 12.0594 11.3125 9.80625 11.3125 7.35938V2.94062L6.4375 1.59375L1.5625 2.94062Z" />
        </svg>
    )
}

function MagnificLegacyMark() {
    return (
        <svg
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient
                    id="magnific-footer-link-magnific-gradient"
                    x1="2"
                    y1="16.5"
                    x2="18"
                    y2="16.5"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#41D1A5" />
                    <stop offset="0.33" stopColor="#FFD84A" />
                    <stop offset="0.66" stopColor="#FF8A5B" />
                    <stop offset="1" stopColor="#7B61FF" />
                </linearGradient>
            </defs>
            <path d="M10 1.5L19 17.5H1L10 1.5Z" fill="url(#magnific-footer-link-magnific-gradient)" />
            <path d="M10 5.25L15.3 14.75H4.7L10 5.25Z" className="fill-[#ffffff]" />
        </svg>
    )
}

function EyeOffIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M2 2l12 12M8 3.5c-3.5 0-6.31 2.42-7.5 4.5.55.96 1.59 2.16 3 3.05M5.5 8a2.5 2.5 0 0 1 4-2M10.5 8a2.5 2.5 0 0 1-4 2m2-6.5c3.5 0 6.31 2.42 7.5 4.5-.55.96-1.59 2.16-3 3.05"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
            />
        </svg>
    )
}

function EyeIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M8 3.5c-3.5 0-6.31 2.42-7.5 4.5 1.19 2.08 4 4.5 7.5 4.5s6.31-2.42 7.5-4.5C14.31 5.92 11.5 3.5 8 3.5Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
            />
            <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.3" />
        </svg>
    )
}

/* ------------------------------------------------------------------ *
 * Shared pieces
 * ------------------------------------------------------------------ */

const inputClass =
    'h-10 w-full rounded-lg border border-[rgba(0,0,0,0.14)] bg-[#ffffff] px-3 text-sm font-normal text-[#17181a] placeholder:text-[#8b9098] focus:border-[#17181a] focus:outline-none focus:ring-2 focus:ring-[rgba(23,24,26,0.2)] disabled:opacity-60'

const defaultButtonClass =
    'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#f4f5f6] px-4 text-sm font-medium text-nowrap text-[#17181a] transition duration-150 ease-in-out hover:bg-[#eceef0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,0,0,0.24)] active:bg-[#e2e5e8] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-[#f4f5f6]'

const secondaryButtonClass =
    'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#17181a] px-4 text-sm font-medium text-nowrap text-[#ffffff] transition duration-150 ease-in-out hover:bg-[#26282b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,0,0,0.24)] active:bg-[#000000] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-[#17181a]'

/**
 * Provider button. On hover the label collapses away (grid 1fr → 0fr, so the
 * remaining content re-centers itself) while the mark eases up in scale — the
 * button box itself never changes size.
 */
function SocialButton({
    icon,
    label,
    variant = 'default',
}) {
    return (
        <button
            type="button"
            aria-label={label}
            className={`group relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-medium text-nowrap text-[#17181a] transition-[background-color,box-shadow] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,0,0,0.24)] ${variant === 'outline'
                ? 'border border-[rgba(0,0,0,0.1)] bg-white hover:bg-[#f4f5f6]'
                : 'bg-[#f4f5f6] hover:bg-[#eceef0]'
                }`}
        >
            <span className="inline-flex items-center">
                <span className="inline-flex shrink-0 items-center transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.45] group-active:scale-[1.32]">
                    {icon}
                </span>
                <span className="grid grid-cols-[1fr] transition-[grid-template-columns] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:grid-cols-[0fr]">
                    <span className="overflow-hidden">
                        <span className="block pl-2 opacity-100 transition-opacity duration-200 ease-out group-hover:opacity-0">
                            {label}
                        </span>
                    </span>
                </span>
            </span>
        </button>
    )
}

function PromoPanel() {
    const [active, setActive] = useState(0)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        setProgress(0)
        const started = Date.now()
        const tick = window.setInterval(() => {
            const ratio = Math.min(1, (Date.now() - started) / SLIDE_DURATION)
            setProgress(ratio * 100)
            if (ratio >= 1) setActive((i) => (i + 1) % slides.length)
        }, 50)
        return () => window.clearInterval(tick)
    }, [active])

    const slide = slides[active]

    return (
        <div className="relative h-full w-full overflow-hidden bg-[#0b0b0c]">
            <div className="absolute inset-0">
                {slides.map((s, i) => (
                    <img
                        key={s.key}
                        src={s.image}
                        alt={s.alt}
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out ${i === active ? 'opacity-100' : 'opacity-0'
                            }`}
                    />
                ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-6 bg-gradient-to-b from-transparent via-black/50 to-black/95 px-8 pt-20 pb-8 text-left">
                <div className="flex w-full flex-col gap-2">
                    <h2 className={`m-0 ${bricolage.className} text-2xl leading-[1.2] font-bold tracking-[-1px] text-white`}>
                        {slide.title}
                    </h2>
                    <p className="m-0 text-xs font-medium text-white/70">{slide.body}</p>
                </div>

                <div className="-mb-1 -ml-2 flex w-full gap-2">
                    {slides.map((s, i) => (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => setActive(i)}
                            aria-label={s.label}
                            aria-current={i === active}
                            className="flex h-auto w-20 flex-col items-stretch gap-2 rounded-md bg-transparent px-2 py-1 text-left text-xs font-medium text-white transition duration-150 ease-in-out hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 active:bg-white/20"
                        >
                            <span className="truncate text-2xs font-medium tracking-wide text-white uppercase">
                                {s.label}
                            </span>
                            <span className="block h-1 w-full overflow-hidden rounded-full bg-white/25">
                                <span
                                    className="block h-full bg-white"
                                    style={{
                                        width: i === active ? `${progress}%` : '0%',
                                        transition: i === active ? 'width 50ms linear' : 'none',
                                    }}
                                />
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function BackButton({ onClick }) {
    return (
        <div className="absolute top-6 left-6 flex">
            <button
                type="button"
                onClick={onClick}
                className="flex h-8 items-center justify-center gap-2 rounded-lg bg-transparent px-4 text-xs leading-relaxed font-medium text-nowrap text-[#17181a] transition duration-150 ease-in-out hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,0,0,0.24)] active:bg-black/10"
            >
                <svg
                    className="size-4 shrink-0"
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <polyline points="10 12 6 8 10 4" />
                </svg>
                <span>Back</span>
            </button>
        </div>
    )
}

const OTP_LENGTH = 6

/** Six single-character boxes that behave like one field: auto-advance, backspace
 *  steps back, arrows move, and a pasted code fills every box at once. */
function OtpField({ value, onChange }) {
    const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('')

    const focusBox = (index) => {
        const el = document.getElementById(`mg-otp-${index}`)
        el?.focus()
        el?.select()
    }

    const setDigit = (index, digit) => {
        const next = digits.map((d, i) => (i === index ? digit || ' ' : d)).join('')
        onChange(next.replace(/ +$/, ''))
    }

    return (
        <div className="flex w-full gap-2">
            {digits.map((digit, i) => (
                <input
                    key={i}
                    id={`mg-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${i + 1}`}
                    maxLength={1}
                    value={digit.trim()}
                    onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '')
                        if (!raw) {
                            setDigit(i, '')
                            return
                        }
                        setDigit(i, raw.slice(-1))
                        if (i < OTP_LENGTH - 1) focusBox(i + 1)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit.trim() && i > 0) {
                            e.preventDefault()
                            setDigit(i - 1, '')
                            focusBox(i - 1)
                        }
                        if (e.key === 'ArrowLeft' && i > 0) focusBox(i - 1)
                        if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) focusBox(i + 1)
                    }}
                    onPaste={(e) => {
                        e.preventDefault()
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
                        if (!pasted) return
                        onChange(pasted)
                        focusBox(Math.min(pasted.length, OTP_LENGTH - 1))
                    }}
                    className={`h-12 w-full min-w-0 rounded-lg border border-[rgba(0,0,0,0.14)] bg-[#ffffff] text-center ${bricolage.className} text-lg font-bold text-[#17181a] tabular-nums transition duration-150 ease-in-out focus:border-[#17181a] focus:ring-2 focus:ring-[rgba(23,24,26,0.2)] focus:outline-none`}
                />
            ))}
        </div>
    )
}

function PasswordField({
    label,
    value,
    onChange,
    maxLength,
}) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="flex w-full flex-col gap-1">
            <label className="text-xs font-medium text-[#5b5f66]">{label}</label>
            <div className="relative w-full">
                <input
                    className={`${inputClass} pr-10`}
                    type={visible ? 'text' : 'password'}
                    name="password"
                    maxLength={maxLength}
                    minLength={6}
                    autoComplete="off"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <button
                    type="button"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    onClick={() => setVisible((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8b9098] hover:text-[#17181a]"
                >
                    {visible ? <EyeIcon /> : <EyeOffIcon />}
                </button>
            </div>
        </div>
    )
}

function FooterLinks({
    children,
    showRecaptchaInside = true,
}) {
    return (
        <div className="flex flex-col items-center gap-6 text-xs font-medium text-[#797f88]">
            {children}
            <a
                href="https://magnific.ai/legacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-[#5b5f66] hover:underline"
            >
                <MagnificLegacyMark />
                <span>
                    Looking for <span className="underline">magnific.ai</span>
                </span>
            </a>
            <button type="button" className="hover:underline">
                Cookies Settings
            </button>
            {showRecaptchaInside && (
                <p className="text-center text-xs font-medium text-[#797f88]">
                    This site is protected by reCAPTCHA
                </p>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ *
 * App — sign-up, sign-up password, log-in, log-in password, verify code
 * ------------------------------------------------------------------ */

export default function App() {
    const [view, setView] = useState('sign-up')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [noNews, setNoNews] = useState(false)
    const [stayLoggedIn, setStayLoggedIn] = useState(false)
    const [code, setCode] = useState('')
    // Where the verification step was entered from, so Back returns there.
    const [verifyOrigin, setVerifyOrigin] = useState('sign-up-password')
    const [verifyReason, setVerifyReason] = useState('sign-up')

    const goto = (next) => {
        setPassword('')
        setView(next)
    }

    const startVerification = (reason, origin) => {
        setCode('')
        setVerifyReason(reason)
        setVerifyOrigin(origin)
        setView('verify')
    }

    return (
        <div className={`${inter.className} flex h-screen w-screen overflow-hidden bg-[#ffffff] p-2 text-sm text-[#17181a] antialiased`}>
            <div className="relative hidden h-full overflow-hidden rounded-[14px] lg:flex lg:w-1/2">
                <PromoPanel />
            </div>

            <div
                className="relative flex h-full w-full flex-col overflow-y-auto rounded-[14px] lg:w-1/2"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "transparent transparent",
                }}
            >
                <div className="relative flex w-full flex-1 flex-col items-center justify-center px-6 py-10">
                    {view === 'verify' ? (
                        <BackButton onClick={() => setView(verifyOrigin)} />
                    ) : (
                        (view === 'sign-up-password' || view === 'log-in-password') && (
                            <BackButton onClick={() => goto(view === 'sign-up-password' ? 'sign-up' : 'log-in')} />
                        )
                    )}

                    <div className="flex w-full max-w-[27rem] flex-col items-stretch gap-9">
                        <a
                            href="https://magnific.com/"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Magnific"
                            className="mx-auto"
                        >
                            <MagnificMark />
                        </a>

                        {/* ---------------- Sign up (email step) ---------------- */}
                        {view === 'sign-up' && (
                            <div className="flex w-full flex-col gap-6 text-[#17181a]">
                                <header className="flex flex-col gap-2 text-center">
                                    <h1 className={`${bricolage.className} text-3xl leading-tight font-bold tracking-[-1px] text-[#17181a]`}>
                                        Create an account
                                    </h1>
                                </header>

                                <p className="-mb-4 text-center text-xs font-medium text-[#5b5f66]">
                                    Sign up with
                                </p>

                                <div className="flex flex-col gap-2">
                                    <SocialButton
                                        variant="outline"
                                        icon={<GoogleMark />}
                                        label="Continue with Google"
                                    />
                                    <SocialButton icon={<AppleMark />} label="Continue with Apple" />
                                </div>

                                <div className="flex w-full items-center gap-2 text-xs font-medium text-[#5b5f66]">
                                    <span className="h-px flex-1 bg-[rgba(0,0,0,0.1)]" />
                                    <span>Or continue with email</span>
                                    <span className="h-px flex-1 bg-[rgba(0,0,0,0.1)]" />
                                </div>

                                <form
                                    className="flex w-full flex-col gap-3"
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        goto('sign-up-password')
                                    }}
                                >
                                    <input
                                        className={inputClass}
                                        type="text"
                                        name="email"
                                        autoComplete="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={email.trim().length === 0}
                                        className={defaultButtonClass}
                                    >
                                        Continue
                                    </button>
                                </form>

                                <label className="flex items-start gap-2 text-xs font-medium text-[#797f88]">
                                    <input
                                        type="checkbox"
                                        name="disable-news"
                                        checked={noNews}
                                        onChange={(e) => setNoNews(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-[rgba(0,0,0,0.14)] bg-[#ffffff] text-[#17181a] focus:ring-2 focus:ring-[rgba(23,24,26,0.4)]"
                                    />
                                    <span>I do not wish to receive news and promotions from Magnific by email.</span>
                                </label>

                                <p className="text-center text-xs leading-normal font-normal text-[#797f88] [&_a]:text-[#5b5f66] [&_a:hover]:underline">
                                    By continuing, you agree to Magnific&rsquo;s{' '}
                                    <a
                                        href="https://www.magnific.com/legal/terms-of-use"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Terms of Use
                                    </a>{' '}
                                    and{' '}
                                    <a href="https://www.magnific.com/legal/privacy" target="_blank" rel="noreferrer">
                                        Privacy Policy.
                                    </a>
                                </p>

                                <FooterLinks>
                                    <div className="leading-normal font-normal text-[#797f88]">
                                        <p>
                                            Already have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => goto('log-in')}
                                                className="text-[#5b5f66] hover:underline"
                                            >
                                                Log in
                                            </button>
                                        </p>
                                    </div>
                                </FooterLinks>
                            </div>
                        )}

                        {/* ---------------- Sign up (password step) ---------------- */}
                        {view === 'sign-up-password' && (
                            <div className="flex w-full flex-col gap-6 text-[#17181a]">
                                <header className="flex flex-col gap-2 text-center">
                                    <h1 className={`${bricolage.className} text-3xl leading-tight font-bold tracking-[-1px] text-[#17181a]`}>
                                        Create an account
                                    </h1>
                                </header>

                                <div className="flex w-full flex-col gap-4">
                                    <form
                                        className="flex flex-col gap-4"
                                        onSubmit={(e) => {
                                            e.preventDefault()
                                            startVerification('sign-up', 'sign-up-password')
                                        }}
                                    >
                                        <div className="flex w-full flex-col gap-1">
                                            <label className="text-xs font-medium text-[#5b5f66]">Email</label>
                                            <input
                                                className={inputClass}
                                                type="text"
                                                name="email"
                                                autoComplete="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>

                                        <PasswordField
                                            label="Password"
                                            value={password}
                                            onChange={setPassword}
                                            maxLength={30}
                                        />

                                        <button
                                            type="submit"
                                            disabled={password.length < 6}
                                            className={secondaryButtonClass}
                                        >
                                            Sign up
                                        </button>
                                    </form>
                                </div>

                                <p className="text-center text-xs leading-normal font-normal text-[#797f88] [&_a]:text-[#5b5f66] [&_a:hover]:underline">
                                    By clicking the &ldquo;Sign up&rdquo; button, you are creating a Magnific account
                                    and therefore you agree to Magnific&rsquo;s{' '}
                                    <a
                                        href="https://www.magnific.com/legal/terms-of-use"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Terms of Use
                                    </a>{' '}
                                    and{' '}
                                    <a href="https://www.magnific.com/legal/privacy" target="_blank" rel="noreferrer">
                                        Privacy Policy.
                                    </a>
                                </p>

                                <FooterLinks>
                                    <div className="leading-normal font-normal text-[#797f88]">
                                        <p>
                                            Already have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => goto('log-in')}
                                                className="text-[#5b5f66] hover:underline"
                                            >
                                                Log in
                                            </button>
                                        </p>
                                    </div>
                                </FooterLinks>
                            </div>
                        )}

                        {/* ---------------- Log in (email step) ---------------- */}
                        {view === 'log-in' && (
                            <div className="flex w-full flex-col gap-6 text-[#17181a]">
                                <header className="flex flex-col gap-2 text-center">
                                    <h1 className={`${bricolage.className} text-3xl leading-tight font-bold tracking-tight text-[#17181a]`}>
                                        Welcome to Magnific
                                    </h1>
                                </header>

                                <p className="-mb-4 text-center text-xs font-medium text-[#5b5f66]">
                                    Log in with
                                </p>

                                <div className="flex flex-col gap-2">
                                    <SocialButton
                                        variant="outline"
                                        icon={<GoogleMark />}
                                        label="Continue with Google"
                                    />
                                    <SocialButton icon={<AppleMark />} label="Continue with Apple" />
                                    <SocialButton icon={<SsoMark />} label="Continue with SSO" />
                                </div>

                                <div className="flex w-full items-center gap-2 text-xs font-medium text-[#5b5f66]">
                                    <span className="h-px flex-1 bg-[rgba(0,0,0,0.1)]" />
                                    <span>Or continue with email</span>
                                    <span className="h-px flex-1 bg-[rgba(0,0,0,0.1)]" />
                                </div>

                                <form
                                    className="flex w-full flex-col gap-3"
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        goto('log-in-password')
                                    }}
                                >
                                    <input
                                        className={inputClass}
                                        type="text"
                                        name="email"
                                        autoComplete="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={email.trim().length === 0}
                                        className={defaultButtonClass}
                                    >
                                        Continue
                                    </button>
                                </form>

                                <FooterLinks>
                                    <div className="leading-normal font-normal text-[#797f88]">
                                        <p>
                                            Don&rsquo;t you have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => goto('sign-up')}
                                                className="text-[#5b5f66] hover:underline"
                                            >
                                                Sign up
                                            </button>
                                        </p>
                                    </div>
                                </FooterLinks>
                            </div>
                        )}

                        {/* ---------------- Log in (password step) ---------------- */}
                        {view === 'log-in-password' && (
                            <div className="flex w-full flex-col gap-6 text-[#17181a]">
                                <header className="flex flex-col gap-2 text-center">
                                    <h1 className={`${bricolage.className} text-3xl leading-tight font-bold tracking-tight text-[#17181a]`}>
                                        Welcome to Magnific
                                    </h1>
                                </header>

                                <div className="flex w-full flex-col gap-4">
                                    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                                        <div className="flex w-full flex-col gap-1">
                                            <label className="text-xs font-medium text-[#5b5f66]">Email</label>
                                            <input
                                                className={inputClass}
                                                type="text"
                                                name="email"
                                                autoComplete="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>

                                        <PasswordField
                                            label="Password"
                                            value={password}
                                            onChange={setPassword}
                                            maxLength={60}
                                        />

                                        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#5b5f66]">
                                            <input
                                                type="checkbox"
                                                name="keep-signed"
                                                checked={stayLoggedIn}
                                                onChange={(e) => setStayLoggedIn(e.target.checked)}
                                                className="h-4 w-4 rounded border-[rgba(0,0,0,0.14)] bg-[#ffffff] text-[#17181a] focus:ring-2 focus:ring-[rgba(23,24,26,0.4)]"
                                            />
                                            <span>Stay logged in</span>
                                        </label>

                                        <button
                                            type="submit"
                                            disabled={password.length < 6}
                                            className={secondaryButtonClass}
                                        >
                                            Log in
                                        </button>
                                    </form>

                                    <div className="text-center text-xs font-medium text-[#797f88]">
                                        <button
                                            type="button"
                                            onClick={() => startVerification('reset', 'log-in-password')}
                                            className="text-[#5b5f66] hover:underline"
                                        >
                                            I forgot my password
                                        </button>
                                    </div>
                                </div>

                                <FooterLinks showRecaptchaInside={false}>
                                    <div className="leading-normal font-normal text-[#797f88]">
                                        <p>
                                            Don&rsquo;t you have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => goto('sign-up')}
                                                className="text-[#5b5f66] hover:underline"
                                            >
                                                Sign up
                                            </button>
                                        </p>
                                    </div>
                                </FooterLinks>

                                <p className="text-center text-xs font-medium text-[#797f88]">
                                    This site is protected by reCAPTCHA
                                </p>
                            </div>
                        )}

                        {/* ---------------- Verification code ---------------- */}
                        {view === 'verify' && (
                            <div className="flex w-full flex-col gap-6 text-[#17181a]">
                                <header className="flex flex-col gap-2 text-center">
                                    <h1 className={`${bricolage.className} text-3xl leading-tight font-bold tracking-tight text-[#17181a]`}>
                                        {verifyReason === 'reset' ? 'Reset your password' : 'Verify your email'}
                                    </h1>
                                    <p className="text-xs leading-normal font-medium text-[#5b5f66]">
                                        We sent a 6-digit code to{' '}
                                        <span className="text-[#17181a]">{email.trim() || 'your email'}</span>. Enter it
                                        below to continue.
                                    </p>
                                </header>

                                <div className="flex w-full flex-col gap-4">
                                    <form className="flex w-full flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                                        <div className="flex w-full flex-col gap-1">
                                            <label className="text-xs font-medium text-[#5b5f66]">Verification code</label>
                                            <OtpField value={code} onChange={setCode} />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={code.length < OTP_LENGTH}
                                            className={secondaryButtonClass}
                                        >
                                            {verifyReason === 'reset' ? 'Continue' : 'Verify email'}
                                        </button>
                                    </form>

                                    <div className="text-center text-xs font-medium text-[#797f88]">
                                        Didn&rsquo;t get the code?{' '}
                                        <button
                                            type="button"
                                            onClick={() => setCode('')}
                                            className="text-[#5b5f66] hover:underline"
                                        >
                                            Send it again
                                        </button>
                                    </div>
                                </div>

                                <FooterLinks showRecaptchaInside={false}>
                                    <div className="leading-normal font-normal text-[#797f88]">
                                        <p>
                                            Wrong email?{' '}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    goto(verifyOrigin === 'sign-up-password' ? 'sign-up' : 'log-in')
                                                }
                                                className="text-[#5b5f66] hover:underline"
                                            >
                                                Start over
                                            </button>
                                        </p>
                                    </div>
                                </FooterLinks>

                                <p className="text-center text-xs font-medium text-[#797f88]">
                                    This site is protected by reCAPTCHA
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
