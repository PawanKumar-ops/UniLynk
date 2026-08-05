import { useState } from 'react'

const PLUS_PATH =
  'M413 372H232V191c0-13.807-11.193-25-25-25s-25 11.193-25 25v181H1c-13.807 0-25 11.193-25 25s11.193 25 25 25h181v181c0 13.807 11.193 25 25 25s25-11.193 25-25V422h181c13.807 0 25-11.193 25-25s-11.193-25-25-25'
const MINUS_PATH =
  'M413 422H1c-13.807 0-25-11.193-25-25s11.193-25 25-25h412c13.807 0 25 11.193 25 25s-11.193 25-25 25'

const FAQS = [
  {
    question: 'Who can join UniLynk?',
    answer:
      'UniLynk is designed for verified students and campus organizations. Sign in with your college email to access clubs, events, communities, and other campus features.',
  },
  {
    question: 'Can anyone create a club on UniLynk?',
    answer:
      'Yes. Students can submit a club registration request. Once approved by the campus administrator, the club becomes visible for students to discover and join.',
  },
  {
    question: 'How do I join clubs and attend events?',
    answer:
      'Browse clubs and upcoming events, open the page that interests you, and join or register in just a few clicks. You will receive updates and announcements automatically.',
  },
  {
    question: 'Is my personal information secure?',
    answer:
      'Absolutely. Your account, messages, and personal information are protected using secure authentication and privacy-focused practices designed for student communities.',
  },
  {
    question: 'Is UniLynk free for students?',
    answer:
      'Yes. Students can join, explore clubs, discover events, connect with classmates, and participate in campus communities without paying any subscription fee.',
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
