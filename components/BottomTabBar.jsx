"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";
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
  const [isMobile, setIsMobile] = useState(false);

  // 1) Sync with the dashboard feed scroll direction
  useEffect(() => {
    const onFeedScroll = (e) => {
      if (typeof e?.detail?.hidden === "boolean") {
        setHidden(e.detail.hidden);
      }
    };

    window.addEventListener("dashboard-feed-scroll", onFeedScroll);

    return () =>
      window.removeEventListener("dashboard-feed-scroll", onFeedScroll);
  }, []);

  // 2) Fallback: window scroll
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

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
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
    {
      href: "/dashboard",
      label: "Home",
      icon: "solar:home-smile-angle-linear",
      activeIcon: "solar:home-smile-angle-bold",
    },
    {
      href: "/dashboard/explore",
      label: "Explore",
      icon: "solar:magnifer-linear",
      activeIcon: "solar:magnifer-linear", // bold stroke when active
    },
    {
      href: "/dashboard/events",
      label: "Events",
      icon: "solar:calendar-line-duotone",
      activeIcon: "solar:calendar-bold",
    },
    {
      href: "/dashboard/chat",
      label: "Chat",
      icon: "solar:chat-line-linear",
      activeIcon: "solar:chat-line-bold",
    },
    {
      href: "/dashboard/Userprofile",
      label: "Profile",
      isProfile: true,
    },
  ];

  const avatar = session?.user?.image || "/Profilepic.png";
  const isChatRoot = pathname === "/dashboard/chat2" || pathname === "/dashboard/chat2/";
  const isRequestsRoute = pathname === "/dashboard/chat2/requests" || pathname.startsWith("/dashboard/chat2/requests/");
  const shouldHideOnChatRoute = isMobile && pathname?.startsWith("/dashboard/chat2") && !isChatRoot && !isRequestsRoute;
  const shouldHide = hidden || shouldHideOnChatRoute;

  return (
    <nav
      className={`bottom-tabbar${shouldHide ? " bottom-tabbar-hidden" : ""}`}
      aria-label="Primary"
    >
      {tabs.map(({ href, label, icon, activeIcon, isProfile }) => {
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
                  icon={active ? activeIcon : icon}
                  width={26}
                  height={26}
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