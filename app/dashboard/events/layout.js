"use client"

import React, { Suspense } from 'react'
import Eventsheader from '@/components/eventsheader'

const DashboardLayout = ({ children }) => {
  return (
    <div className="events-container">
      <Suspense fallback={null}>
        <Eventsheader/>
      </Suspense>
      <main>
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout