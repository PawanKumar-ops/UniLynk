"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Users,
  Ticket,
  FileText,
  ArrowRight,
  X,
} from "lucide-react";
import ReliableImage from "@/components/ReliableImage";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import EventCard from "@/components/EventCard";
import { TopBar } from "./TopBarEvents";
import { Icon } from "@iconify/react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-lg ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
          type="button"
        >
          <X className="size-4" />
        </button>
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

function EventsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
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

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <SkeletonPulse className="h-3 w-32" />
          <SkeletonPulse className="h-8 w-48" />
        </div>
        <SkeletonPulse className="h-10 w-36 rounded-full" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)]">
        <div className="relative h-72 w-full sm:h-64">
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
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <SkeletonPulse className="h-10 w-full rounded-full sm:w-32" />
            <SkeletonPulse className="h-10 w-full rounded-full sm:w-32" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <article
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
          >
            <div className="relative h-44 overflow-hidden">
              <SkeletonPulse className="absolute inset-0 rounded-none" />
              <SkeletonPulse className="absolute left-3 top-3 h-6 w-20 rounded-full" />
              <SkeletonPulse className="absolute right-3 top-3 h-6 w-14 rounded-full" />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="space-y-2">
                <SkeletonPulse className="h-5 w-3/4" />
                <SkeletonPulse className="h-4 w-1/2" />
              </div>
              <div className="flex flex-col gap-2">
                <SkeletonPulse className="h-4 w-40" />
                <SkeletonPulse className="h-4 w-32" />
              </div>
              <div className="flex gap-2 pt-1">
                <SkeletonPulse className="h-10 flex-1 rounded-full" />
                <SkeletonPulse className="h-10 flex-1 rounded-full" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}


export function EventsPage() {
  const router = useRouter();
  const [active, setActive] = useState("All");
  const [details, setDetails] = useState(null);
  const [events, setEvents] = useState([]);
  const [appliedEvents, setAppliedEvents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/forms/publics", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch events");

        const data = await res.json();
        const eventsData = Array.isArray(data) ? data : [];
        if (ignore) return;

        setEvents(eventsData);

        const appliedMap = {};
        await Promise.all(
          eventsData.map(async (event) => {
            const id = getEventId(event);
            if (!id) return;
            try {
              const applyRes = await fetch(`/api/forms/check-applied?formId=${id}`, {
                cache: "no-store",
              });
              const result = await applyRes.json();
              appliedMap[id] = Boolean(result.applied);
            } catch {
              appliedMap[id] = false;
            }
          })
        );

        if (!ignore) setAppliedEvents(appliedMap);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        if (!ignore) {
          setEvents([]);
          setAppliedEvents({});
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchEvents();
    return () => {
      ignore = true;
    };
  }, []);

  const filters = useMemo(() => {
    const genres = events
      .map((event) => event.genre)
      .filter((genre) => typeof genre === "string" && genre.trim());
    return ["All", ...Array.from(new Set(genres))];
  }, [events]);

  const list = useMemo(
    () => (active === "All" ? events : events.filter((event) => event.genre === active)),
    [active, events]
  );

  const featured = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    })[0];
  }, [events]);

  const openApply = (event) => {
    const id = getEventId(event);
    if (id) router.push(`/FormPreview/${id}`);
  };

  const openDetails = (event) => {
    const id = getEventId(event);
    if (id) router.push(`/dashboard/events/${id}`);
  };

  if (loading) {
    return (
      <DashboardEventsShell>
        <TopBar />
        <div className="flex flex-col px-3.5 gap-6 sm:gap-8">       
          <EventsPageSkeleton />
        </div>
      </DashboardEventsShell>
    );
  }

  return (
    <DashboardEventsShell>
      <TopBar />
      <div className="flex flex-col gap-6 px-3.5 sm:gap-8">
        

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[var(--muted-foreground)]">
              <span className="text-xs uppercase tracking-wider">
                Happening on Campus
              </span>
            </div>
            <h1 className="text-[1.5rem] font-bold">Discover Events</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard/events/yourform")}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm transition-colors hover:bg-[var(--accent)]"
            type="button"
          >
            <Icon icon="solar:file-linear" className="size-4" />
            Your Forms
            <ArrowRight className="size-4" />
          </button>
        </div>

        {featured && (
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)]">
            <div className="relative h-72 w-full sm:h-64 overflow-hidden">
              <ReliableImage
                src={getEventImage(featured)}
                fallbackSrc={DEFAULT_EVENT_IMAGE}
                alt={featured.title || "Featured event"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-4 text-white sm:gap-3 sm:p-6">
              <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
                Featured - {featured.genre || "Event"}
              </span>
              <h2 className="text-white">{featured.title || "Untitled Event"}</h2>
              <div className="flex flex-col gap-1.5 text-sm text-white/80 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <span className="flex items-center gap-1.5">
                  <Icon icon="solar:calendar-outline" className="size-4 shrink-0" />
                  {formatDate(featured.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon icon="solar:map-point-linear" className="size-4 shrink-0" />
                  {featured.location || "Venue TBA"}
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
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
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActive(filter)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${active === filter
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

        {!loading && list.length === 0 && (
          <div className="events-empty-state">
            <img src="/eventsicons/NoEventsIll.svg" alt="No Events" />
            <h2>No Events Right Now</h2>
            <p>
              The event calendar is currently clear. Check out our vibrant clubs and communities to stay connected with campus life.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {list.map((event) => {
            const id = getEventId(event);
            const eventDate = getDateParts(event.date);

            return (
              <EventCard
                key={id}
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
            );
          })}
        </div>

        <Modal
          open={!!details}
          onClose={() => setDetails(null)}
          className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
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
    </DashboardEventsShell>
  );
}
