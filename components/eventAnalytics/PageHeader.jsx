import Link from 'next/link'
import { SectionLabel } from './ui'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  backTo,
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {backTo && (
          <Link
            href={backTo}
            className="mt-1.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-panel text-ink transition hover:bg-forest hover:text-white"
            aria-label="Back to overview"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
        <div>
          <SectionLabel>{eyebrow}</SectionLabel>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold leading-none tracking-tight text-ink sm:text-[34px]">
            {title}
          </h1>
          <p className="mt-2 text-[14px] text-ink-3">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  )
}
