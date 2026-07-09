"use client"

import React from 'react'
import "./Sidebar.css"
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useMemo, useEffect } from "react";
import { usePathname } from 'next/navigation';
import { SignOutModal } from "./SignOutModal";
import { X, LogOut } from 'lucide-react'
import ReliableImage from './ReliableImage';
import FeedbackModal from './FeedbackModal';
import { Icon } from "@iconify/react";

const Sidebar = ({ isOpen = false, onClose }) => {
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState(true);
  const [showSignOutModal, setSignoutModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [userProfile, setUserProfile] = useState(null);
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/dashboard/clubs";
    }
    return pathname === path;
  };

  useEffect(() => {
    if (status !== 'authenticated') return;

    const loadProfile = async (attempt = 0) => {
      try {
        const res = await fetch('/api/user/me', { cache: 'no-store' });
        if (!res.ok) {
          if (attempt < 2) setTimeout(() => loadProfile(attempt + 1), 400);
          return;
        }
        const data = await res.json();
        if (data?.user) setUserProfile(data.user);
      } catch (error) {
        if (attempt < 2) {
          setTimeout(() => loadProfile(attempt + 1), 400);
          return;
        }
        console.error('Sidebar profile fetch failed:', error);
      }
    };

    loadProfile();
  }, [status]);

  const sidebarUser = useMemo(() => ({
    name: userProfile?.name || session?.user?.name || 'User',
    email: userProfile?.email || session?.user?.email || 'No email available',
    year: userProfile?.year || session?.user?.year || '_',
    image: userProfile?.img || session?.user?.image || '/Profilepic.png',
  }), [userProfile, session]);

  const menuItems = [
    {
      href: "/dashboard",
      label: "Home",
      icon: "solar:home-smile-angle-linear",
      activeIcon: "solar:home-smile-angle-bold",
    },
    {
      href: "/dashboard/my-clubs",
      label: "My Clubs",
      icon: "solar:user-linear",
      activeIcon: "solar:user-bold",
    },
    {
      href: "/dashboard/events",
      label: "Events",
      icon: "solar:calendar-line-duotone",
      activeIcon: "solar:calendar-bold",
    },
    {
      href: "/dashboard/chat2",
      label: "Chat",
      icon: "solar:chat-line-linear",
      activeIcon: "solar:chat-line-bold",
    },
  ];

  const settingsItems = [
    {
      href: "/dashboard/gethelp",
      label: "Get Help",
      icon: "weui:help-outlined",
      activeIcon: "weui:help-filled",
    },
    {
      label: "Feedback",
      icon: "solar:danger-triangle-linear",
      activeIcon: "solar:danger-triangle-bold",
      onClick: () => setShowFeedbackModal(true),
    },
  ];

  return (
    <div>
      <FeedbackModal open={showFeedbackModal} onOpenChange={setShowFeedbackModal} />

      {settings ? (
        <>
          <div>
            <header>
              <div className={`menu ${isOpen ? 'mobile-open' : ''}`}>
                <div className="menuhead">
                  <div className="logo">
                    <img src="/ULynk.svg" alt="ULynk Logo" />
                  </div>
                  <div className="menuhead-actions">
                    <button className="settings" onClick={() => setSettings(false)}>
                      <img src="/dashboard/Settings.svg" alt="settings" />
                    </button>
                    <button
                      className="mobile-sidebar-close-btn"
                      onClick={onClose}
                      type="button"
                      aria-label="Close menu"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="dashboard">
                  {menuItems.map(({ href, label, icon, activeIcon }) => {
                    const active = isActive(href);

                    return (
                      <Link key={href} href={href}>
                        <button
                          className={`dashbutton ${active ? "active" : ""}`}
                          onClick={onClose}
                        >
                          <Icon
                            icon={active ? activeIcon : icon}
                            width={22}
                            height={22}
                            style={{
                              color: active ? "#000" : "#707070",
                            }}
                          />
                          {label}
                        </button>
                      </Link>
                    );
                  })}

                  <div className="profile">
                    <div className="profback">
                      <img src="/Background.jpg" alt="Profile background" />
                    </div>
                    <div className="profpic">
                      <ReliableImage src={sidebarUser.image} fallbackSrc="/Profilepic.png" alt="Profile picture" loading="eager" decoding="async" />
                    </div>
                    <div className="profinfo">
                      <h2 className="username">{sidebarUser.name}</h2>
                      <div className="branch">{sidebarUser.email}</div>
                      <div className="year">{sidebarUser.year}</div>
                    </div>
                    <div className="post">
                      <Link href="/dashboard/Userprofile" className='userprofilelink'>
                        <button className='viewprofilebtn' onClick={onClose}>View Profile</button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          </div>
        </>
      ) : (
        <>
          <div>
            <header>
              <div className={`menu ${isOpen ? 'mobile-open' : ''}`}>
                <div className="menuhead">
                  <div className="logo">
                    <img src="/ULynk.svg" alt="ULynk Logo" />
                  </div>
                  <div className="menuhead-actions">
                    <div className="settings2" onClick={() => setSettings(true)}>
                      <img src="/myclubs/arrow.svg" alt="settings" />
                    </div>
                    <button
                      className="mobile-sidebar-close-btn"
                      onClick={onClose}
                      type="button"
                      aria-label="Close menu"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="dashboardsettings">
                  <div className="options">
                    {settingsItems.map(({ href, label, icon, activeIcon, onClick }) => {
                      const active = href && isActive(href);

                      const button = (
                        <button
                          className={`dashbutton ${active ? "active" : ""}`}
                          onClick={() => {
                            onClose?.();
                            onClick?.();
                          }}
                        >
                          <Icon
                            icon={active && activeIcon ? activeIcon : icon}
                            width={22}
                            height={22}
                            style={{
                              color: active ? "#000" : "#707070",
                            }}
                          />
                          {label}
                        </button>
                      );

                      return href ? (
                        <Link key={label} href={href}>
                          {button}
                        </Link>
                      ) : (
                        <React.Fragment key={label}>
                          {button}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="signout">
                    <button className="signoutb" onClick={() => setSignoutModal(true)}>
                      <LogOut width={20} height={20} />
                      Sign out
                    </button>
                    <SignOutModal
                      open={showSignOutModal}
                      onOpenChange={setSignoutModal}
                    />
                  </div>
                </div>
              </div>
            </header>
          </div>
        </>
      )}
    </div >
  )
}

export default Sidebar