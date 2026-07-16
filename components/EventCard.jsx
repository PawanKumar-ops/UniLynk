"use client"
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export function EventCard({
    userAvatarUrl,
    userAvatarAlt = "User avatar",
    posterUrl,
    posterAlt = "Event poster",
    eventName,
    clubName,
    venue,
    bookingDay,
    bookingMonth,
    onClick,
}) {
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") setLightboxOpen(false);
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [lightboxOpen]);

    return (
        <div className="w-full">
            <div
                className="relative ml-[40px] bg-white h-[7em] rounded-2xl border border-[#dfe3e8] transition-all duration-[250ms] ease-in"
                onClick={onClick}
                onKeyDown={(event) => {
                    if (onClick && (event.key === "Enter" || event.key === " ")) onClick();
                }}
                role={onClick ? "button" : undefined}
                tabIndex={onClick ? 0 : undefined}
            >

                {/* user profile */}
                <div className="absolute left-[-2.5em] top-1/2 -translate-y-1/2 w-[82px] h-[82px] rounded-full overflow-hidden p-1 bg-white border-2 border-[#e5e7eb] flex items-center justify-center z-[2]">
                    <img
                        src={userAvatarUrl}
                        alt={userAvatarAlt}
                        className="w-full h-full object-cover rounded-full block"
                    />
                </div>

                {/* separator */}
                <div className="absolute top-[-0.5em] right-[5.5em] h-[calc(100%+1em)] w-[1.5em] flex flex-col">
                    <div
                        className="absolute top-[1em] left-[0.5em] h-[calc(100%-2em)] border-l border-dashed"
                        style={{ borderColor: "#33333385" }}
                    />
                    <div className="h-[1em] w-[1em] rounded-full bg-white border-b border-[#dfe3e8]" />
                    <div className="flex-1" />
                    <div className="h-[1em] w-[1em] rounded-full bg-white border-t border-[#dfe3e8]" />
                </div>

                {/* right cut-out */}
                <div className="absolute right-[-0.5em] top-[3em] h-[1em] w-[1em] rounded-full bg-white border-l border-[#dfe3e8]" />

                {/* info block — vertical accent bar + stacked type */}
                <div className="absolute left-[3.8em] right-[8.4em] top-[0.8em] bottom-[0.8em] flex flex-col justify-center">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full bg-[#f3f4f6] px-2 py-[2px] text-[0.6rem] font-medium text-[#6b7280]">
                            {clubName}
                        </span>
                    </div>

                    <h3
                        className="truncate text-[1.2rem] font-bold tracking-tight text-[#111827]"
                        title={eventName}
                    >
                        {eventName}
                    </h3>

                    <div className="mt-2 flex items-center gap-1 text-[0.72rem] text-[#6b7280]">
                        <Icon
                            icon="solar:map-point-linear"
                            className="h-3.5 w-3.5 shrink-0 text-[#6b7280]"
                        />

                        <span className="truncate">{venue}</span>
                    </div>
                </div>

                <div className="absolute right-[7.35rem] top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <span className="text-[0.62rem] font-semibold uppercase tracking-widest text-[#ef4444]">
                        {bookingMonth}
                    </span>

                    <span className="text-[1.45rem] font-black leading-none text-[#111827]">
                        {bookingDay}
                    </span>
                </div>

                {/* event poster */}
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        setLightboxOpen(true);
                    }}
                    aria-label="Open event poster"
                    className="group absolute right-[0.9em] top-[0.9em] bottom-[0.9em] w-[4.6em] rounded-lg overflow-hidden border border-[#e5e7eb] bg-white cursor-zoom-in transition-transform focus:outline-none focus:ring-2 focus:ring-[#808080]"
                >
                    <img
                        src={posterUrl}
                        alt={posterAlt}
                        className="w-full h-full object-cover block"
                    />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="pointer-events-none absolute bottom-[0.35em] left-1/2 -translate-x-1/2 text-[0.5rem] font-semibold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                    </span>
                </button>

            </div>

            {lightboxOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Event poster preview"
                    onClick={() => setLightboxOpen(false)}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
                >
                    <img
                        src={posterUrl}
                        alt={posterAlt}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-[92vw] max-h-[92vh] object-contain rounded-lg shadow-2xl"
                    />
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(false)}
                        aria-label="Close"
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-black text-xl leading-none flex items-center justify-center shadow-lg"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}

export default EventCard;
