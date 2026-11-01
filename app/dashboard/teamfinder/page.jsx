"use client"

import { useEffect, useState } from 'react'
import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import { TeamsView, teamFinderApi, teamFinderHref, useTeamFinderFormId } from './_components/TeamFinderShared'

export default function TeamFinderPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const { formId, ready } = useTeamFinderFormId()

  useEffect(() => {
    if (!ready) return
    setLoading(true)
    fetch(teamFinderApi(formId), { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Could not load Team Finder')
        setTeams(json.teams || [])
      })
      .catch((error) => { console.error(error); setTeams([]) })
      .finally(() => setLoading(false))
  }, [formId, ready, reloadKey])

  return <DashboardEventsShell><main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]"><TeamsView teams={teams} loading={loading} formId={formId} onSaved={() => setReloadKey((k) => k + 1)} onOpen={(id) => { window.location.href = teamFinderHref(`/dashboard/teamfinder/team/${id}`, formId) }} onFindMembers={() => { window.location.href = teamFinderHref('/dashboard/teamfinder/members', formId) }} /></main></DashboardEventsShell>
}
