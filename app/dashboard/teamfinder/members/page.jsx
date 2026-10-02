"use client"

import { useEffect, useState } from 'react'
import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import { SeekersView } from '../_components/TeamFinderShared'

export default function MembersPage() {
  const [seekers, setSeekers] = useState([])

  useEffect(() => {
    fetch('/api/forms/team-finder', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Could not load Team Finder')
        setSeekers(json.solo || [])
      })
      .catch((error) => { console.error(error); setSeekers([]) })
  }, [])

  return <DashboardEventsShell><main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]"><SeekersView seekers={seekers} onOpen={(id) => { window.location.href = `/dashboard/teamfinder/members/${id}` }} /></main></DashboardEventsShell>
}
