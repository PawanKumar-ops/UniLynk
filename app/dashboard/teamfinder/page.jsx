"use client"

import { useEffect, useState } from 'react'
import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import { TeamsView } from './_components/TeamFinderShared'

export default function TeamFinderPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/forms/team-finder', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Could not load Team Finder')
        setTeams(json.teams || [])
      })
      .catch((error) => { console.error(error); setTeams([]) })
      .finally(() => setLoading(false))
  }, [])

  return <DashboardEventsShell><main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]"><TeamsView teams={teams} loading={loading} onOpen={(id) => { window.location.href = `/dashboard/teamfinder/team/${id}` }} onFindMembers={() => { window.location.href = '/dashboard/teamfinder/members' }} /></main></DashboardEventsShell>
}
