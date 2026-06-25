"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Compass, Calendar, MessageCircle, User } from "lucide-react";
import "./BottomTabBar.css";

/**
 * X / Twitter style bottom tab bar (mobile only).
 * - Hides on scroll-down, shows on scroll-up
 * - Listens to a custom "dashboard-feed-scroll" event dispatched by DashboardClient
 *   (so it stays in sync with the top header hide/show), and also falls back to
 *   window scroll for pages that scroll the window instead of an internal feed.
 */
const BottomTabBar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [hidden, setHidden] = useState(false);

  // 1) Sync with the dashboard feed scroll direction
  useEffect(() => {
    const onFeedScroll = (e) => {
      if (typeof e?.detail?.hidden === "boolean") {
        setHidden(e.detail.hidden);
      }
    };
    window.addEventListener("dashboard-feed-scroll", onFeedScroll);
    return () => window.removeEventListener("dashboard-feed-scroll", onFeedScroll);
  }, []);

  // 2) Fallback: window scroll (for pages without an internal scrollable feed)
  useEffect(() => {
    let lastY = window.scrollY || 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (y > lastY && y > 60) setHidden(true);
      else if (y < lastY) setHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/dashboard/clubs";
    }
    if (path === "/dashboard/Userprofile") {
      return pathname?.startsWith("/dashboard/Userprofile");
    }
    return pathname === path;
  };

  const tabs = [
    { href: "/dashboard",            label: "Home",    Icon: Home },
    { href: "/dashboard/explore",    label: "Explore", Icon: Compass },
    { href: "/dashboard/events",     label: "Events",  Icon: Calendar },
    { href: "/dashboard/chat",       label: "Chat",    Icon: MessageCircle },
    { href: "/dashboard/Userprofile",label: "Profile", Icon: User, isProfile: true },
  ];

  const avatar = session?.user?.image || "/Profilepic.png";

  return (
    <nav
      className={`bottom-tabbar${hidden ? " bottom-tabbar-hidden" : ""}`}
      aria-label="Primary"
    >
      {tabs.map(({ href, label, Icon, isProfile }) => {
        const active = isActive(href);
        return (
          <Link key={href} href={href} className="bottom-tab" aria-label={label}>
            <span className={`bottom-tab-inner${active ? " active" : ""}`}>
              {isProfile ? (
                <img
                  src={avatar}
                  alt=""
                  className={`bottom-tab-avatar${active ? " active" : ""}`}
                />
              ) : (
                <Icon
                  size={26}
                  strokeWidth={active ? 2.4 : 2}
                  className="bottom-tab-icon"
                />
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
