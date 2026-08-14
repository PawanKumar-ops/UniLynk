import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import confetti from 'canvas-confetti'

// canvas-confetti's "realistic" recipe: several staggered bursts with varied
// particle counts, spread, velocity and gravity so the fall looks natural.
function firePremiumConfetti() {
  const defaults = {
    spread: 70,
    ticks: 180,
    gravity: 0.9,
    decay: 0.93,
    startVelocity: 28,
    scalar: 0.85,
    zIndex: 100,
  };

  // Initial center burst
  confetti({
    ...defaults,
    particleCount: 55,
    origin: { x: 0.5, y: 0.35 },
    spread: 100,
    startVelocity: 34,
  });

  // Left burst
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 45,
      origin: { x: 0.12, y: 0.45 },
      angle: 55,
      spread: 55,
      startVelocity: 32,
    });
  }, 120);

  // Right burst
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 45,
      origin: { x: 0.88, y: 0.45 },
      angle: 125,
      spread: 55,
      startVelocity: 32,
    });
  }, 220);

  // Small finishing burst
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 30,
      origin: { x: 0.5, y: 0.25 },
      spread: 120,
      startVelocity: 20,
      scalar: 0.7,
    });
  }, 420);
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

function Ticket({ ticket, exportRef }) {
  const barcodeRef = useRef(null)
  const eventName = ticket?.eventName || 'HackVerse 2026'
  const venueLine = ticket?.venueLine || 'Main Auditorium · Tech Park, Bengaluru'
  const date = ticket?.date || '12 Aug'
  const time = ticket?.time || '14:35'
  const teamValue = ticket?.teamValue || '4'
  const registeredAt = ticket?.registeredAt || '05 Aug'
  const participantName = ticket?.participantName || 'Megafry MR'
  const clubName = ticket?.isTeamEvent ? (ticket?.clubName || 'Code Ninjas') : ''
  const rollNo = ticket?.rollNo || '21BCE1234'
  const registrationId = ticket?.registrationId || '43596885365490358'
  const clubLogo = ticket?.clubLogo

  useEffect(() => {
    if (!barcodeRef.current || !registrationId) return
    JsBarcode(barcodeRef.current, registrationId, {
      displayValue: false,
      margin: 0,
      width: 1.6,
      height: 48,
      background: '#ffffff',
      lineColor: '#000000',
    })
  }, [registrationId])
  return (
    // Wrapper carries the shadow: clip-path on the ticket itself would crop a
    // box-shadow, so drop-shadow filters here trace the exact notched outline —
    // a hairline edge + soft depth make the white card visible on white.
    <div
      ref={exportRef}
      className="mx-auto w-full max-w-[25rem]"
      style={{
        filter:
  'drop-shadow(0 8px 18px rgba(0,0,0,0.06)) drop-shadow(0 28px 65px rgba(0,0,0,0.12))',
      }}
    >
    <div
      className="bg-[#ffffff] text-[#000000]"
      style={{ borderRadius: '2rem', clipPath: ticketClip, WebkitClipPath: ticketClip }}
    >
      <div className="px-8 pt-9 pb-5 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          {/* Club logo */}
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f5f5f5] text-xs font-semibold tracking-wide text-[#737373]">
            {clubLogo ? <img src={clubLogo} alt={ticket?.clubName || 'Club'} className="h-full w-full rounded-full object-cover" /> : 'CLUB'}
          </span>
          {/* Three horizontal dots, echoing the plane glyph's tone. */}
          <span className="flex items-center gap-1.5 text-[#d4d4d4]" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          {/* Company / host logo */}
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f5f5f5] text-xs font-semibold tracking-wide text-[#737373]">
            <img src="/ULynk.svg" alt="ULynk" className="h-full w-full rounded-full object-contain" />
          </span>
        </div>

        <div className="mt-8">
          <span className="text-[0.65rem] font-semibold uppercase leading-relaxed tracking-[0.12em] text-[#a3a3a3]">
            Event
          </span>
          <p className="text-lg font-medium leading-tight">{eventName}</p>
          <p className="mt-1 text-xs text-[#a3a3a3]">{venueLine}</p>
        </div>

        <dl className="mt-7 grid grid-cols-4 gap-x-1 border-t border-[#f5f5f5] pt-6 text-center">
          {[
            ['Date', date],
            ['Time', time],
            [ticket?.isTeamEvent ? 'Team' : 'Type', teamValue],
            ['Reg. Date', registeredAt],
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
          {clubName ? (
            <>
              <span>{clubName}</span>
              <span className="h-1 w-1 rounded-full bg-[#d4d4d4]" />
            </>
          ) : null}
          <span>{participantName}</span>
        </p>
      </div>

      <div className="grid gap-3 border-t-2 border-dashed border-[#e5e5e5] px-10 pt-5 pb-8 text-center">
        <span className="text-xs tracking-[0.1em] text-[#a3a3a3]">Roll No · {rollNo}</span>
        <svg ref={barcodeRef} className="h-12 w-full rounded-sm text-[#000000]" style={barcode} aria-hidden="true" />
        <span className="text-sm tracking-[0.2em] text-[#737373]">{registrationId}</span>
      </div>
    </div>
    </div>
  )
}

export default function EventTicket({ open, onClose, ticket }) {
  const [internalOpen, setInternalOpen] = useState(open ?? false)
  const [downloading, setDownloading] = useState(false)
  const isOpen = open ?? internalOpen
  const closeModal = () => {
    setInternalOpen(false)
    onClose?.()
  }
  const exportRef = useRef(null)

  useEffect(() => {
    setInternalOpen(open ?? false)
  }, [open])

  // Celebrate whenever the modal opens.
  useEffect(() => {
  if (isOpen) firePremiumConfetti()
}, [isOpen])

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
      pdf.save(`event-ticket-${ticket?.registrationId || 'registration'}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Off-screen export node: padding leaves room for the drop-shadow so the
          captured PDF shows the ticket's edge just like the modal. */}
      <div className="pointer-events-none fixed left-[-9999px] top-0" aria-hidden="true">
        <div ref={exportRef} className="bg-[#ffffff] p-16">
          <div className="pointer-events-none fixed left-[-9999px] top-0" aria-hidden="true">
  <div ref={exportRef} className="bg-[#ffffff] p-16">
    <Ticket ticket={ticket} />
  </div>
</div>
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        {/* Backdrop */}
        <div
  onClick={closeModal}
  className="absolute inset-0 bg-[rgba(0,0,0,0.42)] backdrop-blur-[5px]"
  style={{
    animation: 'ticket-fade 450ms ease-out both',
  }}
/>

        {/* Panel: bottom drawer on mobile, centered dialog on desktop */}
        <div
  role="dialog"
  aria-modal="true"
  className="relative w-full max-w-[27rem] rounded-t-[28px] bg-[#ffffff] p-5 pb-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:rounded-[30px] sm:p-8"
  style={{
    animation:
      'ticket-panel-in 650ms cubic-bezier(0.16, 1, 0.3, 1) both',
    willChange: 'transform, opacity',
  }}
>
          {/* Grab handle — mobile drawer affordance */}
          <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-[#e5e5e5] sm:hidden" />

          <div
  style={{
    animation:
      'ticket-premium-in 800ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both',
    transformOrigin: '50% 70%',
    willChange: 'transform, opacity',
  }}
>
  <Ticket ticket={ticket} />
</div>

          <div
  className="mt-7 flex gap-3"
  style={{
    animation:
      'ticket-actions-in 550ms cubic-bezier(0.16, 1, 0.3, 1) 420ms both',
  }}
>
            <button
              onClick={closeModal}
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
    </>
  )
}

<style jsx global>{`
  @keyframes ticket-panel-in {
    0% {
      opacity: 0;
      transform: translateY(35px) scale(0.96);
    }

    60% {
      opacity: 1;
    }

    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes ticket-premium-in {
    0% {
      opacity: 0;
      transform:
        translateY(55px)
        scale(0.88)
        rotateX(8deg)
        rotateZ(-1.2deg);
      filter: blur(3px);
    }

    45% {
      opacity: 1;
      filter: blur(0);
    }

    72% {
      transform:
        translateY(-5px)
        scale(1.015)
        rotateX(0deg)
        rotateZ(0.25deg);
    }

    100% {
      opacity: 1;
      transform:
        translateY(0)
        scale(1)
        rotateX(0)
        rotateZ(0);
      filter: blur(0);
    }
  }

  @keyframes ticket-actions-in {
    0% {
      opacity: 0;
      transform: translateY(14px);
    }

    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes ticket-fade {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ticket-panel-in {
      from,
      to {
        opacity: 1;
        transform: none;
      }
    }

    @keyframes ticket-premium-in {
      from,
      to {
        opacity: 1;
        transform: none;
        filter: none;
      }
    }

    @keyframes ticket-actions-in {
      from,
      to {
        opacity: 1;
        transform: none;
      }
    }
  }
`}</style>