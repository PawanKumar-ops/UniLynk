import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import confetti from 'canvas-confetti'

// canvas-confetti's "realistic" recipe: several staggered bursts with varied
// particle counts, spread, velocity and gravity so the fall looks natural.
function fireRealisticConfetti() {
  const count = 200
  const origin = { y: 0.7 }
  const fire = (particleRatio, opts) => {
    confetti({
      origin,
      spread: 60,
      startVelocity: 45,
      ticks: 220,
      particleCount: Math.floor(count * particleRatio),
      ...opts,
    })
  }

  fire(0.25, { spread: 26, startVelocity: 55 })
  fire(0.2, { spread: 60 })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
  fire(0.1, { spread: 120, startVelocity: 45 })
}

// Preserves the original ticket silhouette: the two concave notches carved into
// the left and right edges where the stub tears off.
const ticketClip =
  'shape(from 0 0, line to 100% 0, line to 100% calc(100% - 11.5rem), arc by 0 3rem of 1.5rem ccw, line to 100% 100%, line to 0 100%, line to 0 calc(100% - 8.5rem), arc by 0 -3rem of 1.5rem ccw, close)'

// Three overlaid stripe patterns give the barcode an irregular, real feel.
const barcode = {
  backgroundImage: [
    'repeating-linear-gradient(to right, currentColor 0, currentColor 2px, transparent 2px, transparent 6px)',
    'repeating-linear-gradient(to right, currentColor 0, currentColor 4px, transparent 4px, transparent 11px)',
    'repeating-linear-gradient(to right, currentColor 0, currentColor 2px, transparent 2px, transparent 9px)',
  ].join(', '),
}

function Ticket({ ref }) {
  return (
    // Wrapper carries the shadow: clip-path on the ticket itself would crop a
    // box-shadow, so drop-shadow filters here trace the exact notched outline —
    // a hairline edge + soft depth make the white card visible on white.
    <div
      ref={ref}
      className="mx-auto w-full max-w-[25rem]"
      style={{
        filter:
          'drop-shadow(0 6px 16px rgba(0,0,0,0.05)) drop-shadow(0 18px 50px rgba(0,0,0,0.07))',
      }}
    >
    <div
      className="bg-[#ffffff] text-[#000000]"
      style={{ borderRadius: '2rem', clipPath: ticketClip, WebkitClipPath: ticketClip }}
    >
      <div className="px-8 pt-9 pb-5 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          {/* Club logo — swap the initials for an <img> when the asset is ready. */}
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5] text-xs font-semibold tracking-wide text-[#737373]">
            CLUB
          </span>
          {/* Three horizontal dots, echoing the plane glyph's tone. */}
          <span className="flex items-center gap-1.5 text-[#d4d4d4]" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          {/* Company / host logo */}
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5] text-xs font-semibold tracking-wide text-[#737373]">
            CO
          </span>
        </div>

        <div className="mt-8">
          <span className="text-[0.65rem] font-semibold uppercase leading-relaxed tracking-[0.12em] text-[#a3a3a3]">
            Event
          </span>
          <p className="text-lg font-medium leading-tight">HackVerse 2026</p>
          <p className="mt-1 text-xs text-[#a3a3a3]">Main Auditorium · Tech Park, Bengaluru</p>
        </div>

        <dl className="mt-7 grid grid-cols-4 gap-x-1 border-t border-[#f5f5f5] pt-6 text-center">
          {[
            ['Date', '12 Aug'],
            ['Time', '14:35'],
            ['Team', '4'],
            ['Reg. Date', '05 Aug'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="whitespace-nowrap text-[0.6rem] font-semibold uppercase leading-relaxed tracking-[0.06em] text-[#a3a3a3]">
                {label}
              </dt>
              <dd className="mt-1 whitespace-nowrap text-base font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-7 flex items-center justify-center gap-2 pt-5 text-xs tracking-[0.1em] text-[#a3a3a3]">
          <span>Code Ninjas</span>
          <span className="h-1 w-1 rounded-full bg-[#d4d4d4]" />
          <span>Megafry MR</span>
        </p>
      </div>

      <div className="grid gap-3 border-t-2 border-dashed border-[#e5e5e5] px-10 pt-5 pb-8 text-center">
        <span className="text-xs tracking-[0.1em] text-[#a3a3a3]">Roll No · 21BCE1234</span>
        <div className="h-12 rounded-sm text-[#000000]" style={barcode} aria-hidden="true" />
        <span className="text-sm tracking-[0.2em] text-[#737373]">43596885365490358</span>
      </div>
    </div>
    </div>
  )
}

export default function App() {
  const [open, setOpen] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const exportRef = useRef(null)

  // Celebrate whenever the modal opens (including on first load).
  useEffect(() => {
    if (open) fireRealisticConfetti()
  }, [open])

  const handleDownload = async () => {
    const node = exportRef.current
    if (!node || downloading) return
    setDownloading(true)
    try {
      // Capture the padded export wrapper (not the ticket alone) so the
      // drop-shadow that defines the ticket's edge isn't clipped away, and give
      // it a white ground so the edge reads exactly like it does in the modal.
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      })
      const img = new Image()
      img.src = dataUrl
      await img.decode()

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      // The export node is the ticket plus p-16 padding for shadow room.
      // Scaling the image to nearly the full page width makes the ticket itself
      // fill most of the page while keeping small margins.
      const w = pageW * 0.98
      const h = (img.height / img.width) * w
      const x = (pageW - w) / 2
      const y = (pageH - h) / 2
      pdf.addImage(dataUrl, 'PNG', x, y, w, h)
      pdf.save('boarding-pass-ZRH-OSL.pdf')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#000000]">
      {/* Off-screen export node: padding leaves room for the drop-shadow so the
          captured PDF shows the ticket's edge just like the modal. */}
      <div className="pointer-events-none fixed left-[-9999px] top-0" aria-hidden="true">
        <div ref={exportRef} className="bg-[#ffffff] p-16">
          <Ticket />
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center p-6">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-[#000000] px-6 py-3 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#262626]"
        >
          Show boarding pass
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-[2px]"
            style={{ animation: 'ticket-fade 0.2s ease-out' }}
          />

          {/* Panel: bottom drawer on mobile, centered dialog on desktop */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-[27rem] rounded-t-3xl bg-[#ffffff] p-5 pb-8 shadow-2xl sm:origin-center sm:scale-[0.88] sm:rounded-3xl sm:p-8"
            style={{
              animation: 'ticket-drawer 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Grab handle — mobile drawer affordance */}
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-[#e5e5e5] sm:hidden" />

            <Ticket />

            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-[#e5e5e5] bg-[#ffffff] px-6 py-3 text-sm font-medium text-[#000000] transition-colors hover:bg-[#fafafa]"
              >
                Done
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 rounded-full bg-[#000000] px-6 py-3 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#262626] disabled:opacity-60"
              >
                {downloading ? 'Preparing…' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
