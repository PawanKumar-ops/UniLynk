import { useState } from 'react'

const PLUS_PATH =
  'M413 372H232V191c0-13.807-11.193-25-25-25s-25 11.193-25 25v181H1c-13.807 0-25 11.193-25 25s11.193 25 25 25h181v181c0 13.807 11.193 25 25 25s25-11.193 25-25V422h181c13.807 0 25-11.193 25-25s-11.193-25-25-25'
const MINUS_PATH =
  'M413 422H1c-13.807 0-25-11.193-25-25s11.193-25 25-25h412c13.807 0 25 11.193 25 25s-11.193 25-25 25'

const FAQS = [
  {
    question: 'Is Magnific the same as Freepik?',
    answer: (
      <>
        Freepik is now Magnific. Same team, same technology, redesigned as a full AI creative platform
        for images, video, audio, 3D, collaborative tools, and 250M+ assets. Want to know more about
        it?{' '}
        <a
          href="https://www.magnific.com/company/about-us#from_element=home_faqs"
          className="font-medium text-[#ff3ea5] underline"
        >
          Meet Magnific →
        </a>
      </>
    ),
  },
  {
    question: 'I have a magnific.ai subscription—what happens now?',
    answer: (
      <>
        Your upscaler stays at{' '}
        <a
          href="https://magnific.ai/legacy"
          className="font-medium text-[#ff3ea5] underline"
        >
          magnific.ai
        </a>{' '}
        with no disruption to your current subscription. Your plan runs until it expires. What's new
        is that Magnific is now a much bigger platform at magnific.com—the same upscaler, 40+ AI
        models, audio tools, collaborative Spaces, and 250M+ stock assets, all in one place.
      </>
    ),
  },
  {
    question: 'Will stock content still be available, or is everything now AI-based?',
    answer:
      'Both. Magnific brings together the full 250M+ stock library—photos, vectors, illustrations, icons, 3D, video, audio, templates, mockups, and fonts—alongside a complete suite of AI creative tools. Everything in one place.',
  },
  {
    question: 'I already have a Magnific paid plan. What happens to it?',
    answer:
      'Nothing changes. Your plan, price, billing cycle, and payment method stay exactly as they are. You keep access to everything your plan includes.',
  },
  {
    question: 'Who owns the content I create?',
    answer:
      'You do. Everything you generate belongs to you. Magnific never trains on your data, and all content comes with a full commercial AI license.',
  },
]

function ToggleIcon({ path, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-49 141 512 512"
      width="16"
      height="16"
      aria-hidden="true"
      className={className}
    >
      <path fill="currentColor" d={path} />
    </svg>
  )
}

export default function FaqsSection() {
  const [open, setOpen] = useState(null)

  return (
    <section className="bg-[#f4f3ef] py-16 lg:py-24" data-cy="section-faqs">
      <div className="mx-auto w-full max-w-screen-xl px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-20">
          <div className="flex shrink-0 flex-col gap-6 lg:w-[300px]">
            <h2 className="font-alternate text-3xl font-bold leading-tight text-[#3f0808] lg:text-4xl">
              Answers to your top questions
            </h2>
            <a
              href="https://www.magnific.com/ai/support?form=true#from_element=home_faqs"
              className="inline-flex w-fit rounded-lg border border-[#dcd8d2] px-5 py-2.5 text-sm font-medium text-[#3f0808] no-underline transition-colors duration-200 hover:bg-[#3f0808]/5"
            >
              Contact support
            </a>
          </div>
          <ul className="flex flex-1 flex-col gap-2">
            {FAQS.map((faq, index) => {
              const expanded = open === index
              const state = expanded ? 'open' : 'closed'
              const panelId = `faq-panel-${index}`
              return (
                <li key={faq.question}>
                  <div data-state={state}>
                    <button
                      type="button"
                      aria-controls={panelId}
                      aria-expanded={expanded}
                      data-state={state}
                      onClick={() => setOpen(expanded ? null : index)}
                      className="group flex w-full items-center justify-between gap-4 rounded-none bg-[#ffffff] px-6 py-5 text-left text-base font-medium"
                    >
                      <span className="text-[#3f0808]">{faq.question}</span>
                      <span className="shrink-0">
                        <ToggleIcon
                          path={PLUS_PATH}
                          className="text-[#ff3ea5] group-data-[state=open]:hidden"
                        />
                        <ToggleIcon
                          path={MINUS_PATH}
                          className="hidden text-[#ff3ea5] group-data-[state=open]:block"
                        />
                      </span>
                    </button>
                    <div
                      data-state={state}
                      id={panelId}
                      className="overflow-hidden bg-[#ffffff] data-[state=closed]:hidden data-[state=open]:animate-accordion-down"
                    >
                      <div className="px-6 pb-5 text-sm leading-relaxed text-neutral-600">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
