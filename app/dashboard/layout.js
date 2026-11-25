"use client"

import React, { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import BottomTabBar from '@/components/BottomTabBar'
import DesktopNoticeModal from '@/components/DesktopNoticeModal'
import DashboardHomeLoading from '@/components/DashboardHomeLoading'
import './DashboardLayout.css'

const DESKTOP_NOTICE_STORAGE_KEY = 'unilynk-desktop-notice-next-display-at';
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_IN_MS = 7 * ONE_DAY_IN_MS;
const MOBILE_AND_TABLET_QUERY = '(max-width: 1024px)';

const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopNoticeOpen, setDesktopNoticeOpen] = useState(false);
  const [homeNavigationPending, setHomeNavigationPending] = useState(false);
  const homeNavigationTimer = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setMobileSidebarOpen(true);
    window.addEventListener('open-mobile-sidebar', handler);
    return () => window.removeEventListener('open-mobile-sidebar', handler);
  }, []);

  useEffect(() => {
    const startHomeNavigation = () => {
      setHomeNavigationPending(true);
      window.clearTimeout(homeNavigationTimer.current);
      homeNavigationTimer.current = window.setTimeout(() => {
        setHomeNavigationPending(false);
      }, 15000);
    };
    window.addEventListener('dashboard-home-navigation-start', startHomeNavigation);
    return () => {
      window.removeEventListener('dashboard-home-navigation-start', startHomeNavigation);
      window.clearTimeout(homeNavigationTimer.current);
    };
  }, []);

  useEffect(() => {
    if (pathname === '/dashboard') {
      setHomeNavigationPending(false);
      window.clearTimeout(homeNavigationTimer.current);
    }
  }, [pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_AND_TABLET_QUERY);

    const updateDesktopNotice = () => {
      if (!mediaQuery.matches) {
        setDesktopNoticeOpen(false);
        return;
      }

      const nextDisplayAt = Number(
        window.localStorage.getItem(DESKTOP_NOTICE_STORAGE_KEY),
      );
      setDesktopNoticeOpen(!Number.isFinite(nextDisplayAt) || nextDisplayAt <= Date.now());
    };

    updateDesktopNotice();
    mediaQuery.addEventListener('change', updateDesktopNotice);
    return () => mediaQuery.removeEventListener('change', updateDesktopNotice);
  }, []);

  const postponeDesktopNotice = (duration) => {
    window.localStorage.setItem(
      DESKTOP_NOTICE_STORAGE_KEY,
      String(Date.now() + duration),
    );
    setDesktopNoticeOpen(false);
  };

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
      {homeNavigationPending && (
        <div className="dashboard-home-nav-loading" aria-live="polite">
          <div className="dashboard-home-nav-toggle" aria-hidden="true"><span /></div>
          <div className="dashboard-home-nav-feed"><DashboardHomeLoading /></div>
        </div>
      )}

      {/* Mobile-only bottom navigation (X / Twitter style) */}
      <BottomTabBar />
      <DesktopNoticeModal
        open={desktopNoticeOpen}
        onContinue={() => postponeDesktopNotice(ONE_WEEK_IN_MS)}
        onRemindLater={() => postponeDesktopNotice(ONE_DAY_IN_MS)}
      />
    </div>
  )
}

export default DashboardLayout
