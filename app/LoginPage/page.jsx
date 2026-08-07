"use client"
import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { Icon } from '@iconify/react';

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
        key: "Clubs",
        label: "Clubs",
        title: "Connect with your campus",
        body: "Join clubs, discover communities, and meet students who share your interests.",
        image: "https://img.magnific.com/free-photo/close-up-young-colleagues-having-meeting_23-2149060255.jpg?t=st=1786106934~exp=1786110534~hmac=45cb14fd2ee4256900ea2877af3144d2a95f541db28846d2b3c4f496ed19f5a7&w=1480",
        alt: "Campus clubs",
    },
    {
        key: "events",
        label: "Events",
        title: "Never miss an opportunity",
        body: "Discover workshops, hackathons, fests, and campus events all in one place.",
        image: "https://img.magnific.com/free-photo/team-programmers-talking-about-algorithm-running-laptop-screen-pointing-source-code-while-sitting-desk-software-developers-collaborating-data-coding-group-project_482257-33548.jpg?t=st=1786107109~exp=1786110709~hmac=921a643ef98c4e07af62e0ce718e0f9b6e1b9e31ac228b5a7a1107f8dc4b87be&w=1480",
        alt: "Campus events",
    },
    {
        key: "network",
        label: "Network",
        title: "Build your student network",
        body: "Connect with seniors, alumni, and classmates to learn, collaborate, and grow.",
        image: "https://img.magnific.com/free-photo/smiling-business-leader-greeting-partner_1262-3306.jpg?t=st=1786107039~exp=1786110639~hmac=d66b811c582f81f464e895f4d91e585474748b1815ce5acb67c2bd79016d8be7&w=1480",
        alt: "Student networking",
    },
    {
        key: "posts",
        label: "Posts",
        title: "Share what matters",
        body: "Post updates, ask questions, share achievements, and stay connected with your campus community.",
        image: "SignInTransitions/PostBannerTransition.png",
        alt: "Campus posts",
    },
    {
        key: "help",
        label: "Get Help",
        title: "Help is always nearby",
        body: "Ask questions, seek guidance, and get support from seniors and fellow students whenever you need it.",
        image: "https://img.magnific.com/free-photo/i-can-handle-multi-tasks-cropped-shot-successful-girl-typing-keyboard-making-notes-while-looking-computer-screen-studying-new-business-graphic-there-is-no-time-rest_176420-8700.jpg?t=st=1786107326~exp=1786110926~hmac=741ab8f3aa1d1a6d727c5a4021c02ecc617281ed7ccbb98b248adbd7a77aff74&w=1480",
        alt: "Student help",
    },
];

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */

function UnilynkMark() {
    return (
        <img src="ULynk.svg" alt="" className='h-11 w-11' />
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
    onClick,
    disabled = false,
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
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
            {showRecaptchaInside && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#797f88]">
                    <Icon
                        icon="solar:lock-linear"
                        className="h-3.5 w-3.5 shrink-0 text-[#797f88]"
                    />
                    <span>Your data is encrypted and handled securely.</span>
                </div>
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
    const [verificationToken, setVerificationToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [status, setStatus] = useState({ type: '', message: '' })
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const goto = (next) => {
        setPassword('')
        setCode('')
        setStatus({ type: '', message: '' })
        setView(next)
    }

    const startVerification = (reason, origin) => {
        setCode('')
        setStatus({ type: '', message: '' })
        setVerifyReason(reason)
        setVerifyOrigin(origin)
        setView('verify')
    }

    const showStatus = (type, message) => setStatus({ type, message })

    const requestOtp = async (purpose, origin) => {
        setLoading(true)
        showStatus('', '')
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Unable to send code.')
            startVerification(purpose === 'reset' ? 'reset' : 'sign-up', origin)
            showStatus('success', data.message || 'Verification code sent.')
        } catch (error) {
            showStatus('error', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCredentialsLogin = async () => {
        setLoading(true)
        showStatus('', '')
        const result = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/Onboarding' })
        setLoading(false)
        if (result?.error) {
            showStatus('error', 'Invalid email or password.')
            return
        }
        showStatus('success', 'Login successful. Redirecting...')
        router.push('/Onboarding')
    }

    const handleVerifyCode = async () => {
        setLoading(true)
        showStatus('', '')
        try {
            const purpose = verifyReason === 'reset' ? 'reset' : 'register'
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: code, purpose }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Unable to verify code.')
            setVerificationToken(data.verificationToken)
            if (verifyReason === 'reset') {
                setNewPassword('')
                setConfirmPassword('')
                setView('reset-password')
                showStatus('success', 'Code verified. Choose a new password.')
                return
            }
            const registerRes = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, verificationToken: data.verificationToken }),
            })
            const registerData = await registerRes.json()
            if (!registerRes.ok) throw new Error(registerData.error || 'Unable to create account.')
            const loginResult = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/Onboarding' })
            if (loginResult?.error) throw new Error('Account created, but automatic login failed. Please log in.')
            showStatus('success', 'Account created. Redirecting...')
            router.push('/Onboarding')
        } catch (error) {
            showStatus('error', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            showStatus('error', 'Passwords do not match.')
            return
        }
        setLoading(true)
        showStatus('', '')
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: newPassword, verificationToken }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Unable to reset password.')
            setPassword(newPassword)
            showStatus('success', 'Password reset. Redirecting...')
            const loginResult = await signIn('credentials', { email, password: newPassword, redirect: false, callbackUrl: '/Onboarding' })
            if (loginResult?.error) {
                goto('log-in-password')
                showStatus('success', 'Password reset. Please log in with your new password.')
                return
            }
            router.push('/Onboarding')
        } catch (error) {
            showStatus('error', error.message)
        } finally {
            setLoading(false)
        }
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
                            href="./"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Unilynk"
                            className="mx-auto"
                        >
                            <UnilynkMark />
                        </a>

                        {status.message && (
                            <div className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${status.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`} role="status" aria-live="polite">
                                {status.message}
                            </div>
                        )}

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
                                        icon={<Icon icon="selfhst:google" />}
                                        label="Continue with Google"
                                        onClick={() => signIn('google', { callbackUrl: '/Onboarding' })}
                                        disabled={loading}
                                    />
                                    <SocialButton icon={<Icon icon="selfhst:github-dark" />} label="Continue with Github" onClick={() => signIn('github', { callbackUrl: '/Onboarding' })} disabled={loading} />
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
                                    <span>I agree to receive occasional emails about Unilynk updates. I can unsubscribe anytime.</span>
                                </label>

                                <p className="text-center text-xs leading-normal font-normal text-[#797f88] [&_a]:text-[#5b5f66] [&_a:hover]:underline">
                                    By continuing, you agree to Unilynk&rsquo;s{' '}
                                    <a
                                        href="./Terms-of-use"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Terms of Use
                                    </a>{' '}
                                    and{' '}
                                    <a href="./Privacy-Policy" target="_blank" rel="noreferrer">
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
                                            requestOtp('register', 'sign-up-password')
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
                                            disabled={password.length < 8 || loading}
                                            className={secondaryButtonClass}
                                        >
                                            {loading ? 'Sending code...' : 'Sign up'}
                                        </button>
                                    </form>
                                </div>

                                <p className="text-center text-xs leading-normal font-normal text-[#797f88] [&_a]:text-[#5b5f66] [&_a:hover]:underline">
                                    By clicking the &ldquo;Sign up&rdquo; button, you are creating a Unilynk account
                                    and therefore you agree to Unilynk&rsquo;s{' '}
                                    <a
                                        href="./Terms-of-use"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Terms of Use
                                    </a>{' '}
                                    and{' '}
                                    <a href="./Privacy-Policy" target="_blank" rel="noreferrer">
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
                                        Welcome to Unilynk
                                    </h1>
                                </header>

                                <p className="-mb-4 text-center text-xs font-medium text-[#5b5f66]">
                                    Log in with
                                </p>

                                <div className="flex flex-col gap-2">
                                    <SocialButton
                                        variant="outline"
                                        icon={<Icon icon="selfhst:google" />}
                                        label="Continue with Google"
                                        onClick={() => signIn('google', { callbackUrl: '/Onboarding' })}
                                        disabled={loading}
                                    />
                                    <SocialButton icon={<Icon icon="selfhst:github-dark" />} label="Continue with Github" onClick={() => signIn('github', { callbackUrl: '/Onboarding' })} disabled={loading} />
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
                                        Welcome to Unilynk
                                    </h1>
                                </header>

                                <div className="flex w-full flex-col gap-4">
                                    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleCredentialsLogin() }}>
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
                                            disabled={password.length < 8 || loading}
                                            className={secondaryButtonClass}
                                        >
                                            {loading ? 'Logging in...' : 'Log in'}
                                        </button>
                                    </form>

                                    <div className="text-center text-xs font-medium text-[#797f88]">
                                        <button
                                            type="button"
                                            onClick={() => requestOtp('reset', 'log-in-password')}
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

                                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#797f88]">
                                    <Icon
                                        icon="solar:lock-linear"
                                        className="h-3.5 w-3.5 shrink-0 text-[#797f88]"
                                    />
                                    <span>Your data is encrypted and handled securely.</span>
                                </div>
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
                                    <form className="flex w-full flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleVerifyCode() }}>
                                        <div className="flex w-full flex-col gap-1">
                                            <label className="text-xs font-medium text-[#5b5f66]">Verification code</label>
                                            <OtpField value={code} onChange={setCode} />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={code.length < OTP_LENGTH || loading}
                                            className={secondaryButtonClass}
                                        >
                                            {loading ? 'Verifying...' : (verifyReason === 'reset' ? 'Continue' : 'Verify email')}
                                        </button>
                                    </form>

                                    <div className="text-center text-xs font-medium text-[#797f88]">
                                        Didn&rsquo;t get the code?{' '}
                                        <button
                                            type="button"
                                            onClick={() => requestOtp(verifyReason === 'reset' ? 'reset' : 'register', verifyOrigin)}
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

                                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#797f88]">
                                    <Icon
                                        icon="solar:lock-linear"
                                        className="h-3.5 w-3.5 shrink-0 text-[#797f88]"
                                    />
                                    <span>Your data is encrypted and handled securely.</span>
                                </div>
                            </div>
                        )}

                        {view === 'reset-password' && (
                            <div className="flex w-full flex-col gap-6 text-[#17181a]">
                                <header className="flex flex-col gap-2 text-center">
                                    <h1 className={`${bricolage.className} text-3xl leading-tight font-bold tracking-tight text-[#17181a]`}>Create new password</h1>
                                </header>
                                <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleResetPassword() }}>
                                    <PasswordField label="New password" value={newPassword} onChange={setNewPassword} maxLength={72} />
                                    <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} maxLength={72} />
                                    <button type="submit" disabled={newPassword.length < 8 || confirmPassword.length < 8 || loading} className={secondaryButtonClass}>
                                        {loading ? 'Resetting...' : 'Reset password'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
