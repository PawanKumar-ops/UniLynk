"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import { TeamDetailView } from '../../_components/TeamFinderShared'

export default function TeamDetailPage() {
  const { id } = useParams()
  const [team, setTeam] = useState(null)

  useEffect(() => {
    if (!id) return
    fetch('/api/forms/team-finder', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setTeam((json.teams || []).find((item) => item.id === id) || null))
      .catch(console.error)
  }, [id])

  return <DashboardEventsShell><main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]">{team && <TeamDetailView team={team} />}</main></DashboardEventsShell>
}
