"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardEventsShell } from '@/components/DashboardEventsShell'
import '@/app/dashboard/dashboard.css'
import '@/components/events-pages.css'
import { SeekerDetailView, teamFinderApi, useTeamFinderFormId } from '../../_components/TeamFinderShared'

export default function SeekerDetailPage() {
  const { id } = useParams()
  const [seeker, setSeeker] = useState(null)

  const { formId, ready } = useTeamFinderFormId()

  useEffect(() => {
    if (!id || !ready) return
    fetch(teamFinderApi(formId), { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setSeeker((json.solo || []).find((item) => item.id === id) || null))
      .catch(console.error)
  }, [id, formId, ready])

  return <DashboardEventsShell><main className="min-h-full w-full bg-[#ffffff] text-[#0a0a0a]">{seeker && <SeekerDetailView seeker={seeker} />}</main></DashboardEventsShell>
}
