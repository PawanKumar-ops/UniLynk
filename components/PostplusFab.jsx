"use client"

import React, { useEffect, useState } from 'react'
import "./PostplusFab.css"

const MOBILE_BOTTOM_TAB_QUERY = "(max-width: 768px)";

const PostplusFAB = ({ setIspost }) => {
    const [hiddenOnMobile, setHiddenOnMobile] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const mobileQuery = window.matchMedia(MOBILE_BOTTOM_TAB_QUERY);

        const syncMobileState = () => {
            if (!mobileQuery.matches) {
                setHiddenOnMobile(false);
            }
        };

        const onFeedScroll = (e) => {
            if (!mobileQuery.matches) return;

            if (typeof e?.detail?.hidden === "boolean") {
                setHiddenOnMobile(e.detail.hidden);
            }
        };

        let lastY = window.scrollY || 0;
        const onScroll = () => {
            if (!mobileQuery.matches) return;

            const y = window.scrollY || 0;
            if (y > lastY && y > 60) setHiddenOnMobile(true);
            else if (y < lastY) setHiddenOnMobile(false);
            lastY = y;
        };

        syncMobileState();
        mobileQuery.addEventListener("change", syncMobileState);
        window.addEventListener("dashboard-feed-scroll", onFeedScroll);
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            mobileQuery.removeEventListener("change", syncMobileState);
            window.removeEventListener("dashboard-feed-scroll", onFeedScroll);
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    return (
        <div>
            <button
                className={`fab${hiddenOnMobile ? " fab-mobile-hidden" : ""}`}
                onClick={(e) => { setIspost(true); }}
            >
                <span className="plus">+</span>
                <div className="fabtextcont">
                    <span className="text">POST</span>
                </div>
            </button>
        </div>
    )
}

export default PostplusFAB
