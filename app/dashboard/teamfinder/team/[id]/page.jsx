"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import { TeamDetailView, useTeamFinderFormId } from '../../_components/TeamFinderShared'

export default function TeamDetailPage() {
  const { id } = useParams()
  const [team, setTeam] = useState(null)

  const { formId, ready } = useTeamFinderFormId()

  useEffect(() => {
    if (!id || !ready) return
    const params = new URLSearchParams({ kind: 'team', id: String(id), limit: '1' })
    if (formId) params.set('formId', formId)
    fetch(`/api/forms/team-finder?${params}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setTeam(json.items?.[0] || null))
      .catch(console.error)
  }, [id, formId, ready])

  return <DashboardEventsShell><main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]">{team && <TeamDetailView team={team} />}</main></DashboardEventsShell>
}
