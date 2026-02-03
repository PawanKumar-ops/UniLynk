"use client"

import React from 'react'
import Eventsheader from '@/components/eventsheader'

const DashboardLayout = ({ children }) => {
  return (
    <div className="events-container">
      <Eventsheader/>
      <main>
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout