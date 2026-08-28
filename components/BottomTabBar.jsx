"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";

const BottomTabBar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Sync with dashboard feed scroll direction
  useEffect(() => {
    const onFeedScroll = (e) => {
      if (typeof e?.detail?.hidden === "boolean") {
        setHidden(e.detail.hidden);
      }
    };

    window.addEventListener("dashboard-feed-scroll", onFeedScroll);

    return () => {
      window.removeEventListener("dashboard-feed-scroll", onFeedScroll);
    };
  }, []);

  // Fallback scroll behavior
  useEffect(() => {
    let lastY = window.scrollY || 0;

    const onScroll = () => {
      const currentY = window.scrollY || 0;

      if (currentY > lastY && currentY > 60) {
        setHidden(true);
      } else if (currentY < lastY) {
        setHidden(false);
      }

      lastY = currentY;
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Detect mobile
  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateViewport();

    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
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
      activeIcon: "solar:magnifer-linear",
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
    {
      href: "/dashboard/Userprofile",
      label: "Profile",
      isProfile: true,
    },
  ];

  const avatar = session?.user?.image || "/Profilepic.png";

  const isChatRoot =
    pathname === "/dashboard/chat2" ||
    pathname === "/dashboard/chat2/";

  const isRequestsRoute =
    pathname === "/dashboard/chat2/requests" ||
    pathname?.startsWith("/dashboard/chat2/requests/");

  const shouldHideOnChatRoute =
    isMobile &&
    pathname?.startsWith("/dashboard/chat2") &&
    !isChatRoot &&
    !isRequestsRoute;

  const shouldHide = hidden || shouldHideOnChatRoute;

  return (
    <nav
      aria-label="Primary"
      className={`fixed inset-x-0 bottom-0 z-50 h-[96px] pointer-events-none transition-all duration-300 ease-out md:hidden ${
        shouldHide
          ? "translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      {/* Premium bottom-to-top fade */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white via-white/[0.96] via-[42%] to-white/0" />

      {/* Navigation icons */}
      <div className="absolute inset-x-0 bottom-0 flex h-[68px] items-center justify-between px-7 pb-[calc(env(safe-area-inset-bottom)+5px)] pointer-events-auto">
        {tabs.map(({ href, label, icon, activeIcon, isProfile }) => {
          const active = isActive(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center outline-none transition-all duration-200 active:scale-[0.94]"
            >
              {/* Active premium floating pill */}
              {active && (
                <span className="absolute left-1/2 top-1/2 h-[44px] w-[52px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-white via-[#fdfdfd] to-[#f4f4f4] shadow-[0_1px_1px_rgba(255,255,255,0.9)_inset,0_0_0_1px_rgba(0,0,0,0.055),0_3px_10px_rgba(0,0,0,0.08)]" />
              )}

              <span className="relative z-10 flex items-center justify-center">
                {isProfile ? (
                  <img
                    src={avatar}
                    alt=""
                    className={`h-[25px] w-[25px] rounded-full object-cover transition-all duration-200 ${
                      active ? "scale-[1.03]" : "opacity-70"
                    }`}
                  />
                ) : (
                  <Icon
                    icon={active ? activeIcon : icon}
                    width={24}
                    height={24}
                    className={`transition-all duration-200 ${
                      active
                        ? "scale-[1.03] text-black"
                        : "text-black/65"
                    }`}
                  />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;