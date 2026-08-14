"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

function formatDate(value) {
    if (!value) return "Date TBA";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date TBA";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function EventDetails({ eventId }) {
    const router = useRouter();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;

        const getCachedEvent = () => {
            if (typeof window === "undefined") return null;

            const keys = [`unilynk:event:${eventId}`, `unilynk:form:${eventId}`];
            for (const storage of [sessionStorage, localStorage]) {
                for (const key of keys) {
                    try {
                        const cached = storage.getItem(key);
                        if (cached) return JSON.parse(cached);
                    } catch (error) {
                        console.warn("Could not read cached event:", error);
                    }
                }
            }

            return null;
        };

        const cacheEvent = (data) => {
            if (!data || typeof window === "undefined") return;
            try {
                const eventJson = JSON.stringify(data);
                sessionStorage.setItem(`unilynk:event:${eventId}`, eventJson);
                localStorage.setItem(`unilynk:event:${eventId}`, eventJson);
            } catch (error) {
                console.warn("Could not cache event details:", error);
            }
        };

        const loadEvent = async () => {
            const cachedEvent = getCachedEvent();
            if (cachedEvent && !cancelled) setEvent(cachedEvent);

            try {
                const response = await fetch(`/api/forms/${eventId}`, { cache: "no-store" });
                if (!response.ok) throw new Error("Unable to load event");
                const data = await response.json();
                cacheEvent(data);
                if (!cancelled) setEvent(data);
            } catch (error) {
                console.error("Failed to load event details:", error);

                if (!cachedEvent) {
                    try {
                        const response = await fetch("/api/forms/publics", { cache: "no-store" });
                        const data = response.ok ? await response.json() : [];
                        const fallbackEvent = Array.isArray(data)
                            ? data.find((item) => (item?._id?.toString?.() || item?.id?.toString?.()) === eventId)
                            : null;
                        if (fallbackEvent) {
                            cacheEvent(fallbackEvent);
                            if (!cancelled) setEvent(fallbackEvent);
                        }
                    } catch (fallbackError) {
                        console.error("Failed to load fallback event details:", fallbackError);
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadEvent();
        return () => { cancelled = true; };
    }, [eventId]);

    const information = useMemo(() => {
        const points = Array.isArray(event?.moreInformation)
            ? event.moreInformation.filter((point) => typeof point === "string" && point.trim())
            : [];
        return points;
    }, [event]);

    const title = event?.title || "Untitled Event";
    const clubName = event?.clubId?.clubName || event?.createdBy || "UniLynk";
    const image = event?.image || event?.clubId?.logo || "";
    const clubLogo = event?.clubId?.logo || "";

    if (loading) return null;
    if (!event) {
        return <div className="p-6 text-sm text-[#8a8a8e]">Loading event details...</div>;
    }

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f5f5f7" }}>
            <style>{`
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
            <div style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", position: "relative", overflow: "hidden" }}>
                <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto" }}>




                  


                    <header
                        className="sticky top-0 z-50 mb-5 flex h-[54px] items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
                        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
                    >
                        {/* Left */}
                        <div
                            className="flex items-center"
                            style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
                        >
                            <button
                                onClick={() => router.back()}
                                className="mr-6 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5"
                            >
                                <ArrowLeft size={20} strokeWidth={2.2} />
                            </button>

                            <div>
                                <h1 className="truncate text-[20px] font-bold leading-5 text-black">
                                    {title}
                                </h1>

                                {/* <p className="mt-0.5 text-[13px] leading-4 text-[#536471]">
                                    {club.members.toLocaleString()} members
                                </p> */}
                            </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-1.5">
                            {/* Add Members */}
                            <div className="group relative">
                                <button
                                    onClick={() => router.push("/dashboard/teamfinder")}
                                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5"
                                >
                                    <Icon
                                        icon="hugeicons:user-search-02"
                                        className="text-[21px] text-[#171717]"
                                    />
                                </button>

                                <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                                    Team Finder
                                </div>
                            </div>

                        </div>
                    </header>




                    <div className="px-[14px]">
                        <div style={{ backgroundColor: "#f7f7f9", borderRadius: "28px", overflow: "visible", position: "relative" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#ebebed", borderRadius: "999px", padding: "6px 13px 6px 7px" }}>
                                    <div style={{ width: "20px", height: "20px", backgroundColor: "#1c1c1e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <div className="w-[20px] h-[20px] rounded-full overflow-hidden bg-white flex items-center justify-center">
                                            {clubLogo && <img src={clubLogo} alt={`${clubName} logo`} className="w-full h-full object-cover rounded-full block" />}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#1c1c1e" }}>{clubName}</span>
                                </div>
                            </div>
                            <div style={{ margin: "0 10px", borderRadius: "20px", overflow: "hidden", height: "250px", border: "1px solid #e6e6e6" }}>
                                {image && <img src={image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                            <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
                                <div style={{ backgroundColor: "#2c2c2e", color: "#ffffff", border: "3px solid #fff", borderRadius: "999px", padding: "7px 22px", fontSize: "13px", fontWeight: 500, margin: "12px 0 -16px" }}>{formatDate(event.date)}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: "30px 14px 16px" }}>
                        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1c1c1e", lineHeight: 1.2, margin: 0 }}>{title}</h1>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                            <span style={{ fontSize: "13px", color: "#888", fontWeight: 400 }}>By</span>
                            <span style={{ fontSize: "13px", color: "#1c1c1e", fontWeight: 500 }}>{clubName}</span>
                        </div>
                        <div style={{ marginTop: "22px" }}>
                            <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#1c1c1e", margin: "0 0 8px" }}>About</h4>
                            <p style={{ fontSize: "13px", color: "#8a8a8e", lineHeight: 1.65, margin: 0, fontWeight: 400 }}>{event.description || "No description available."}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px", marginBottom: "12px" }}>
                            <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#1c1c1e", margin: 0 }}>More Information</h4>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "120px" }}>
                            {information.map((point, index) => <div key={index} style={{ backgroundColor: "#f2f2f4", borderRadius: "999px", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontSize: "13px", fontWeight: 500, color: "#1c1c1e" }}>{point}</span></div>)}
                        </div>
                    </div>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingTop: "64px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "22px", background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 28%, rgba(255,255,255,0.95) 55%, #ffffff 72%)", pointerEvents: "none" }}>
                    <button onClick={() => router.push(`/FormPreview/${event._id}`)} style={{ width: "100%", backgroundColor: "#1c1c1e", color: "#ffffff", border: "none", borderRadius: "999px", padding: "17px", fontSize: "16px", fontWeight: 600, cursor: "pointer", pointerEvents: "auto" }}>Apply Now</button>
                </div>
            </div>
        </div>
    );
}
