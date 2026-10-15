"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import BottomCtaSection from '@/components/landingPage/BottomCtaSection'
import CreativeSuiteSection from '@/components/landingPage/CreativeSuiteSection'
import FaqsSection from '@/components/landingPage/FaqsSection'
import HeroSection from '@/components/landingPage/HeroSection'
import SiteFooter from '@/components/landingPage/SiteFooter'
import SiteHeader from '@/components/landingPage/SiteHeader'
import StartSimpleSection from '@/components/landingPage/StartSimpleSection'
import TeamPlansSection from '@/components/landingPage/TeamPlansSection'
import UseCasesSection from '@/components/landingPage/UseCasesSection'
import SocietiesSection from '@/components/landingPage/SocietiesSection'
import './index.css'

function RegistrationSuccessModal() {
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setIsOpen(true)
    }
  }, [searchParams])

  const handleClose = () => {
    setIsOpen(false)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('registered')
      window.history.replaceState(null, '', url.pathname + url.search)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative w-full max-w-[360px] sm:max-w-[390px] rounded-3xl bg-white p-6 md:p-7 shadow-2xl border border-gray-100 flex flex-col items-center text-center font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition hover:bg-gray-100"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="h-14 w-14 rounded-full bg-black text-white flex items-center justify-center mb-4 shadow-sm">
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Club Registered!
            </h2>

            <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed max-w-[290px]">
              Your club application has been submitted successfully and is now live on UniLynk.
            </p>

            <button
              onClick={handleClose}
              className="mt-6 w-full py-3 px-5 rounded-full bg-black hover:bg-gray-800 text-white font-semibold text-sm transition-all active:scale-[0.98] shadow-md"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f4f3ef]">
      <SiteHeader />
      <HeroSection />
      <SocietiesSection />
      <CreativeSuiteSection />
      <StartSimpleSection />
      <TeamPlansSection />
      <UseCasesSection />
      <FaqsSection />
      <BottomCtaSection />
      <SiteFooter />
      <Suspense fallback={null}>
        <RegistrationSuccessModal />
      </Suspense>
    </main>
  )
}

