"use client"

import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import { SeekersView, teamFinderHref, useInfiniteTeamFinder, useTeamFinderFormId } from '../_components/TeamFinderShared'

export default function MembersPage() {
  const { formId, ready } = useTeamFinderFormId()
  const listing = useInfiniteTeamFinder({ formId, kind: 'solo', ready })

  return <DashboardEventsShell><main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]"><SeekersView seekers={listing.items} {...listing} onRetry={listing.retry} onOpen={(id) => { window.location.href = teamFinderHref(`/dashboard/teamfinder/members/${id}`, formId) }} /></main></DashboardEventsShell>
}
