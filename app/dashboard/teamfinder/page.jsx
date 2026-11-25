"use client"

import { useState } from 'react'
import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import { TeamsView, teamFinderHref, useInfiniteTeamFinder, useTeamFinderFormId } from './_components/TeamFinderShared'

export default function TeamFinderPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const { formId, ready } = useTeamFinderFormId()
  const listing = useInfiniteTeamFinder({ formId, kind: 'team', ready, reloadKey })

  return <DashboardEventsShell><main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]"><TeamsView teams={listing.items} {...listing} onRetry={listing.retry} formId={formId} onSaved={() => setReloadKey((k) => k + 1)} onOpen={(id) => { window.location.href = teamFinderHref(`/dashboard/teamfinder/team/${id}`, formId) }} onFindMembers={() => { window.location.href = teamFinderHref('/dashboard/teamfinder/members', formId) }} /></main></DashboardEventsShell>
}
