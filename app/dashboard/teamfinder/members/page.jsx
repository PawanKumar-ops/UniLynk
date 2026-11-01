"use client"

import { useEffect, useState } from 'react'
import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import { SeekersView, teamFinderApi, teamFinderHref, useTeamFinderFormId } from '../_components/TeamFinderShared'

export default function MembersPage() {
  const [seekers, setSeekers] = useState([])

  const { formId, ready } = useTeamFinderFormId()

  useEffect(() => {
    if (!ready) return
    fetch(teamFinderApi(formId), { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Could not load Team Finder')
        setSeekers(json.solo || [])
      })
      .catch((error) => { console.error(error); setSeekers([]) })
  }, [formId, ready])

  return <DashboardEventsShell><main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]"><SeekersView seekers={seekers} onOpen={(id) => { window.location.href = teamFinderHref(`/dashboard/teamfinder/members/${id}`, formId) }} /></main></DashboardEventsShell>
}
