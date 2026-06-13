"use client"

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import './DashboardLayout.css'

const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileSidebarOpen(true);
    window.addEventListener('open-mobile-sidebar', handler);
    return () => window.removeEventListener('open-mobile-sidebar', handler);
  }, []);

  return (
    <div className="dashboard-container">
      {mobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout