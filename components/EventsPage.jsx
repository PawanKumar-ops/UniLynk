"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket,
  ArrowRight,
  X,
} from "lucide-react";
import ReliableImage from "@/components/ReliableImage";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import EventCard from "@/components/EventCard";
import { TopBar } from "./TopBarEvents";
import { Icon } from "@iconify/react";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";

const PAGE_SIZE = 10;

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

function formatDate(value) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "Time TBA";
  if (/^\d{2}:\d{2}/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time TBA";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDateParts(value) {
  if (!value) return { day: "TBA", month: "" };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "TBA", month: "" };

  return {
    day: date.toLocaleDateString("en-US", { day: "numeric" }),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

function getEventId(event) {
  return event?._id?.toString?.() || event?.id?.toString?.() || "";
}

function getEventImage(event) {
  return event?.image || event?.clubId?.logo || DEFAULT_EVENT_IMAGE;
}

function Modal({ open, onClose, children, className = "" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full overflow-hidden rounded-t-3xl border pb-[env(safe-area-inset-bottom)] sm:max-w-[calc(100%-2rem)] sm:rounded-2xl sm:pb-0 border-[var(--border)] bg-[var(--background)] shadow-lg ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
          type="button"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

/*
 * Ticket scale per viewport width. Mirrored in CSS (ticketStyles) so the very first
 * paint — including server-rendered HTML — is already at the final size, with no jump.
 */
const TICKET_SCALES = [
  { maxWidth: 340, scale: 0.7 },
  { maxWidth: 400, scale: 0.78 },
  { maxWidth: 640, scale: 0.86 },
];

function getBaseTicketScale(viewportWidth) {
  return TICKET_SCALES.find((bp) => viewportWidth <= bp.maxWidth)?.scale ?? 1;
}

/* EventCard and TicketSkeleton are both 7em tall. */
const TICKET_HEIGHT_EM = 7;

const ticketStyles = `
  .ticket-fit { --ticket-scale: 1; position: relative; width: 100%; min-width: 0; height: calc(${TICKET_HEIGHT_EM}em * var(--ticket-scale)); }
  .ticket-fit-inner { width: calc(100% / var(--ticket-scale)); transform: scale(var(--ticket-scale)); transform-origin: top left; }
  ${[...TICKET_SCALES]
    .reverse()
    .map((bp) => `@media (max-width: ${bp.maxWidth}px) { .ticket-fit { --ticket-scale: ${bp.scale}; } }`)
    .join("\n  ")}
  .ticket-fit-inner.ticket-fit-overlay { transform: none; }
  .events-scroll-x { scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .events-scroll-x::-webkit-scrollbar { display: none; }
`;

/*
 * Shrinks a ticket uniformly, so the EventCard design (including its circular
 * cut-outs) stays identical — just smaller. Sizing comes from CSS; JS only
 * steps in if the content is still too wide for the column.
 */
function TicketFit({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [override, setOverride] = useState(null); // { scale, width } when CSS sizing isn't enough
  const [overlayOpen, setOverlayOpen] = useState(false);

  // EventCard renders its poster lightbox with `position: fixed`. A transformed
  // ancestor would trap it inside the ticket, so drop the transform while it's open.
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const sync = () => setOverlayOpen(Boolean(inner.querySelector('[role="dialog"]')));
    const observer = new MutationObserver(sync);
    observer.observe(inner, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const containerWidth = outer.clientWidth;
      if (!containerWidth) return;
      const layoutWidth = containerWidth / getBaseTicketScale(window.innerWidth);

      const previousWidth = inner.style.width;
      inner.style.width = `${layoutWidth}px`;
      const contentWidth = inner.scrollWidth;
      inner.style.width = previousWidth;

      // The right cut-out intentionally sits 0.5em outside the card — don't count it as overflow.
      const tolerance = parseFloat(getComputedStyle(inner).fontSize) * 0.75;
      if (contentWidth > layoutWidth + tolerance) {
        const scale = containerWidth / contentWidth;
        setOverride((prev) =>
          prev && prev.width === contentWidth && prev.scale === scale ? prev : { scale, width: contentWidth }
        );
      } else {
        setOverride((prev) => (prev ? null : prev));
      }
    };

    measure(); // synchronous: runs before the first paint
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="ticket-fit"
      style={override ? { "--ticket-scale": override.scale } : undefined}
    >
      <div
        ref={innerRef}
        className={`ticket-fit-inner${overlayOpen ? " ticket-fit-overlay" : ""}`}
        style={override ? { width: `${override.width}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function SkeletonPulse({ className = "" }) {
  return (
    <div
      className={`skeleton-pulse relative overflow-hidden rounded-md bg-[var(--muted)] ${className}`}
    >
      <div className="skeleton-shimmer absolute inset-0 -translate-x-full" />
    </div>
  );
}

/* Placeholder that mirrors EventCard's geometry: avatar, info, dashed separator with cuts, date, poster. */
function TicketSkeleton() {
  return (
    <div className="w-full">
      <div className="relative ml-[40px] h-[7em] rounded-2xl border border-[#dfe3e8] bg-white">
        {/* user profile */}
        <div className="absolute left-[-2.5em] top-1/2 z-[2] flex h-[82px] w-[82px] -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 border-[#e5e7eb] bg-white p-1">
          <SkeletonPulse className="h-full w-full rounded-full" />
        </div>

        {/* separator */}
        <div className="absolute right-[5.5em] top-[-0.5em] flex h-[calc(100%+1em)] w-[1.5em] flex-col">
          <div
            className="absolute left-[0.5em] top-[1em] h-[calc(100%-2em)] border-l border-dashed"
            style={{ borderColor: "#33333385" }}
          />
          <div className="h-[1em] w-[1em] rounded-full border-b border-[#dfe3e8] bg-white" />
          <div className="flex-1" />
          <div className="h-[1em] w-[1em] rounded-full border-t border-[#dfe3e8] bg-white" />
        </div>

        {/* right cut-out */}
        <div className="absolute right-[-0.5em] top-[3em] h-[1em] w-[1em] rounded-full border-l border-[#dfe3e8] bg-white" />

        {/* info block */}
        <div className="absolute bottom-[0.8em] left-[3.8em] right-[8.4em] top-[0.8em] flex flex-col justify-center gap-2">
          <SkeletonPulse className="h-4 w-20 rounded-full" />
          <SkeletonPulse className="h-6 w-4/5 max-w-[260px]" />
          <SkeletonPulse className="h-3 w-2/5 max-w-[140px]" />
        </div>

        {/* date */}
        <div className="absolute right-[7.35rem] top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5">
          <SkeletonPulse className="h-2.5 w-6" />
          <SkeletonPulse className="h-6 w-7" />
        </div>

        {/* event poster */}
        <div className="absolute bottom-[0.9em] right-[0.9em] top-[0.9em] w-[4.6em] overflow-hidden rounded-lg border border-[#e5e7eb]">
          <SkeletonPulse className="absolute inset-0 rounded-none" />
        </div>
      </div>
    </div>
  );
}

function EventsPageSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-5 pb-6 sm:gap-8">
      <style>{ticketStyles}</style>
      <style>{`
        @keyframes skeleton-shimmer {
          100% { transform: translateX(100%); }
        }
        .skeleton-pulse {
          animation: pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.35) 50%,
            transparent 100%
          );
          animation: skeleton-shimmer 1.8s infinite;
        }
        .dark .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 50%,
            transparent 100%
          );
        }
      `}</style>

      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <SkeletonPulse className="h-3 w-28 sm:w-32" />
          <SkeletonPulse className="h-7 w-40 sm:h-8 sm:w-48" />
        </div>
        <SkeletonPulse className="h-9 w-28 rounded-full sm:h-10 sm:w-36" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)]">
        <div className="relative h-60 w-full sm:h-64">
          <SkeletonPulse className="absolute inset-0 rounded-none" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 sm:p-6">
          <SkeletonPulse className="h-6 w-28 rounded-full" />
          <SkeletonPulse className="h-8 w-3/4 max-w-md" />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-4 w-36" />
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:flex">
            <SkeletonPulse className="h-10 rounded-full sm:w-32" />
            <SkeletonPulse className="h-10 rounded-full sm:w-32" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-hidden sm:flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-9 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <TicketFit key={i}>
            <TicketSkeleton />
          </TicketFit>
        ))}
      </div>
    </div>
  );
}


export function EventsPage() {
  const router = useRouter();
  const [active, setActive] = useState("All");
  const [details, setDetails] = useState(null);
  const loadMoreRef = useRef(null);

  const {
    data,
    isPending: loading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["events-feed", active],
    queryFn: async ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (pageParam) params.set("cursor", pageParam);
      if (active !== "All") params.set("genre", active);
      const res = await fetch(`/api/forms/feed?${params}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    staleTime: 5 * 60 * 1000, // reuse cached events for 5 minutes
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const events = useMemo(
    () => data?.pages.flatMap((page) => page?.events || []) ?? [],
    [data]
  );

  const appliedEvents = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      map[getEventId(event)] = Boolean(event.applied);
    });
    return map;
  }, [events]);

  // Genre list comes from the first page of the unfiltered feed and is cached separately.
  const firstPageGenres = data?.pages?.[0]?.genres;
  const [genres, setGenres] = useState([]);
  useEffect(() => {
    if (active === "All" && Array.isArray(firstPageGenres)) setGenres(firstPageGenres);
  }, [active, firstPageGenres]);

  // Infinite scroll: load the next page when the sentinel enters the viewport.
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, events.length]);

  const filters = useMemo(() => ["All", ...Array.from(new Set(genres))], [genres]);

  const list = events;

  const featured = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    })[0];
  }, [events]);

  const rememberEvent = (event) => {
    const id = getEventId(event);
    if (!id || typeof window === "undefined") return;

    try {
      const eventJson = JSON.stringify(event);
      sessionStorage.setItem(`unilynk:event:${id}`, eventJson);
      localStorage.setItem(`unilynk:event:${id}`, eventJson);
    } catch (error) {
      console.warn("Could not cache event for navigation:", error);
    }
  };

  const openApply = (event) => {
    const id = getEventId(event);
    if (!id) return;
    rememberEvent(event);
    router.push(`/FormPreview/${id}`);
  };

  const openDetails = (event) => {
    const id = getEventId(event);
    if (!id) return;
    rememberEvent(event);
    router.push(`/dashboard/events/${id}`);
  };

  if (loading) {
    return (
      <DashboardEventsShell>
        <TopBar />
        <div className="flex flex-col sm:px-3.5 gap-6 sm:gap-8">
          <EventsPageSkeleton />
        </div>
      </DashboardEventsShell>
    );
  }

  return (
    <DashboardEventsShell>
      <div  className="pb-15">
      <TopBar />
      <style>{ticketStyles}</style>
      <div className="flex min-w-0 flex-col gap-5 sm:px-3.5 pb-6 sm:gap-8">

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[var(--muted-foreground)]">
              <span className="text-[11px] uppercase tracking-wider sm:text-xs">
                Happening on Campus
              </span>
            </div>
            <h1 className="text-[1.3rem] font-bold leading-tight sm:text-[1.5rem]">Discover Events</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard/events/yourform")}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border)] px-3 py-1.5 text-[13px] transition-colors hover:bg-[var(--accent)] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            type="button"
          >
            <Icon icon="solar:file-linear" className="size-4" />
            Your Forms
            <ArrowRight className="size-4" />
          </button>
        </div>

        {featured && (
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)]">
            <div className="relative h-60 w-full overflow-hidden sm:h-64">
              <ReliableImage
                src={getEventImage(featured)}
                fallbackSrc={DEFAULT_EVENT_IMAGE}
                alt={featured.title || "Featured event"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 text-white sm:gap-3 sm:p-6">
              <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
                Featured - {featured.genre || "Event"}
              </span>
              <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-white sm:text-2xl">{featured.title || "Untitled Event"}</h2>
              <div className="flex flex-col gap-1 text-[13px] text-white/80 sm:flex-row sm:text-sm sm:flex-wrap sm:items-center sm:gap-4">
                <span className="flex items-center gap-1.5">
                  <Icon icon="solar:calendar-outline" className="size-4 shrink-0" />
                  {formatDate(featured.date)}
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <Icon icon="solar:map-point-linear" className="size-4 shrink-0" />
                  <span className="truncate">{featured.location || "Venue TBA"}</span>
                </span>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2 sm:flex">
                <button
                  onClick={() => openApply(featured)}
                  className="w-full rounded-full bg-white px-5 py-2 text-sm text-black transition-colors hover:bg-white/90 sm:w-auto"
                  type="button"
                >
                  {appliedEvents[getEventId(featured)] ? "Applied" : "Apply Now"}
                </button>
                <button
                  onClick={() => openDetails(featured)}
                  className="w-full rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm text-white transition-colors hover:bg-white/20 sm:w-auto"
                  type="button"
                >
                  See Details
                </button>
              </div>
            </div>
          </div>
        )}

        {filters.length > 1 && (
          <div className="events-scroll-x -mx-3.5 flex gap-2 overflow-x-auto px-3.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActive(filter)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition-colors sm:px-4 sm:text-sm ${active === filter
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-[var(--border)] text-foreground/70 hover:bg-[var(--accent)]"
                  }`}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {isError && list.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-10 text-center">
            <p className="text-sm text-[#71717a]">Couldn't load events. Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)]"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !isError && list.length === 0 && (
          <div className="flex min-h-[340px] flex-col sm:min-h-[420px] items-center justify-center px-4 text-center">
            <div className="mb-6 flex h-[170px] w-[220px] max-w-[80vw] sm:h-[220px] sm:w-[280px] items-center justify-center">
              <img
                src="/eventsicons/NoEventsIll.svg"
                alt="No events available"
                className="h-full w-full object-contain"
              />
            </div>

            <h3 className="text-[17px] font-bold tracking-[-0.01em]">
              No Events Right Now
            </h3>

            <p className="mt-1.5 max-w-[320px] text-[13.5px] leading-relaxed text-[#71717a]">
              No events right now. Check back soon!
            </p>
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:gap-3">
          {list.map((event) => {
            const id = getEventId(event);
            const eventDate = getDateParts(event.date);

            return (
              <TicketFit key={id}>
              <EventCard
                userAvatarUrl={event.clubId?.logo || DEFAULT_EVENT_IMAGE}
                userAvatarAlt={`${event.clubId?.clubName || "Club"} logo`}
                posterUrl={getEventImage(event)}
                posterAlt={event.title || "Event"}
                eventName={event.title || "Untitled Event"}
                clubName={event.clubId?.clubName || event.createdBy || "UniLynk"}
                venue={event.location || "Venue TBA"}
                bookingDay={eventDate.day}
                bookingMonth={eventDate.month}
                onClick={() => openDetails(event)}
              />
              </TicketFit>
            );
          })}
        </div>

        {hasNextPage && (
          <div ref={loadMoreRef} className="grid min-w-0 grid-cols-1 gap-2.5 sm:gap-3">
            {isFetchingNextPage ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TicketFit key={i}>
                  <TicketSkeleton />
                </TicketFit>
              ))
            ) : (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                className="mx-auto rounded-full border border-[var(--border)] px-4 py-2 text-sm transition-colors hover:bg-[var(--accent)]"
              >
                Load more events
              </button>
            )}
          </div>
        )}

        <Modal
          open={!!details}
          onClose={() => setDetails(null)}
          className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        >
          {details && (
            <>
              <div className="relative h-40 sm:h-48">
                <ReliableImage
                  src={getEventImage(details)}
                  fallbackSrc={DEFAULT_EVENT_IMAGE}
                  alt={details.title || "Event"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                  {details.genre || "Event"}
                </span>
              </div>
              <div className="flex flex-col gap-4 p-5 sm:p-6">
                <div>
                  <h3>{details.title || "Untitled Event"}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    by {details.clubId?.clubName || details.createdBy || "UniLynk"}
                  </p>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {details.description || "No description available."}
                </p>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:calendar-outline" className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                    {formatDate(details.date)}, {formatTime(details.time)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:map-point-linear" className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                    {details.location || "Venue TBA"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                    Free
                  </div>
                </div>
                <button
                  className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
                  onClick={() => openApply(details)}
                  type="button"
                >
                  {appliedEvents[getEventId(details)] ? "Applied" : "Apply for this event"}
                </button>
              </div>
            </>
          )}
        </Modal>
      </div>
      </div>
    </DashboardEventsShell>
  );
}
