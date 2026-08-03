"use client"

import BottomCtaSection from '@/components/landingPage/BottomCtaSection'
import CreativeSuiteSection from '@/components/landingPage/CreativeSuiteSection'
import FaqsSection from '@/components/landingPage/FaqsSection'
import HeroSection from '@/components/landingPage/HeroSection'
import SiteFooter from '@/components/landingPage/SiteFooter'
import SiteHeader from '@/components/landingPage/SiteHeader'
import StartSimpleSection from '@/components/landingPage/StartSimpleSection'
import TeamPlansSection from '@/components/landingPage/TeamPlansSection'
import UseCasesSection from '@/components/landingPage/UseCasesSection'
import './index.css'

export default function App() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f4f3ef]">
      <SiteHeader />
      <HeroSection />
      <CreativeSuiteSection />
      <StartSimpleSection />
      <TeamPlansSection />
      <UseCasesSection />
      <FaqsSection />
      <BottomCtaSection />
      <SiteFooter />
    </main>
  )
}
