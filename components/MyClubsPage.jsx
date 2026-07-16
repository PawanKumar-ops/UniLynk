"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Search, ArrowLeft, Sparkles, Star, Layers } from "lucide-react";
import Link from "next/link";

/* ---------- Inline UI primitives (no external ui/figma imports) ---------- */

function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-[#030213] text-white hover:opacity-90",
    secondary: "bg-[#f0f0f3] text-[#030213] hover:bg-[#e4e4ea]",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Badge({ variant = "default", className = "", children }) {
  const variants = {
    default: "bg-[#030213] text-white",
    secondary: "bg-[#f0f0f3] text-[#030213]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
}

function ImageWithFallback({ src, alt = "", className = "", ...props }) {
  const [errored, setErrored] = useState(false);
  const fallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23ececf0'/></svg>`,
    );
  return (
    <img
      src={errored ? fallback : src || fallback}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...props}
    />
  );
}

/* ---------- Page ---------- */

export function MyClubsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [myClubs, setMyClubs] = useState([]);
  const [suggestedClubs, setSuggestedClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    const loadClubs = async () => {
      try {
        setLoading(true);

        const [myClubsResponse, allClubsResponse] = await Promise.all([
          fetch("/api/clubs?memberOf=true", { cache: "no-store" }),
          fetch("/api/clubs", { cache: "no-store" }),
        ]);

        const myClubsData = await myClubsResponse.json();
        const allClubsData = await allClubsResponse.json();

        if (!cancelled) {
          const joinedClubs = Array.isArray(myClubsData?.clubs) ? myClubsData.clubs : [];
          const allClubs = Array.isArray(allClubsData?.clubs) ? allClubsData.clubs : [];
          const joinedIds = new Set(joinedClubs.map((club) => String(club._id)));
          const availableClubs = allClubs.filter((club) => !joinedIds.has(String(club._id)));
          const shuffledSuggestions = [...availableClubs].sort(() => Math.random() - 0.5).slice(0, 3);

          setMyClubs(joinedClubs);
          setSuggestedClubs(shuffledSuggestions);
        }
      } catch (error) {
        console.error("MY CLUBS FETCH ERROR:", error);
        if (!cancelled) {
          setMyClubs([]);
          setSuggestedClubs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadClubs();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const clubCards = useMemo(
    () =>
      myClubs.map((club) => ({
        id: club._id,
        name: club.clubName || "Campus Club",
        role: club.position || club.roleLabel || "Member",
        category: club.category || "General",
        members: club.memberCount || 0,
        img: club.banner || club.logo || "",
        logo: club.logo || "",
      })),
    [myClubs],
  );

  const suggestedCards = useMemo(
    () =>
      suggestedClubs.map((club) => ({
        id: club._id,
        name: club.clubName || "Campus Club",
        category: club.category || "General",
        members: club.memberCount || 0,
        img: club.logo || "",
      })),
    [suggestedClubs],
  );

  return (
    <div className="relative flex-1">
      <header
        className="sticky top-0 z-50 mb-5 flex h-[54px] items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
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
            <h1 className="truncate text-[20px] font-bold leading-5 text-black">Clubs</h1>
            <p className="mt-0.5 text-[13px] leading-4 text-[#536471]">
              Communities you follow and love
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto px-3.5 flex max-w-3xl flex-col gap-4 pb-5 sm:gap-6">
        {/* Summary strip */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-4 sm:gap-4 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9ebef] text-[#030213] sm:size-12">
              <Layers className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-[#717182]">You're a member of</div>
              <div className="mt-0.5 text-[#0a0a0a]">{clubCards.length} campus clubs</div>
            </div>
          </div>
          <div className="flex shrink-0 -space-x-3">
            {clubCards.slice(0, 4).map((club) => (
              <div key={club.id} className="size-8 overflow-hidden rounded-full ring-2 ring-white sm:size-10">
                <ImageWithFallback src={club.logo} alt={club.name} className="size-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* My Clubs */}
        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-bold">Clubs you're part of</h3>
          {loading ? (
            <div className="rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-6 text-sm text-[#717182] shadow-sm">
              Loading clubs...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {clubCards.map((club) => (
                <button
                  key={club.id}
                  onClick={() => router.push(`Club?clubId=${club.id}`)}
                  className="relative w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white p-2 text-left transition hover:border-neutral-300 hover:shadow-sm cursor-pointer"
                >
                    <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-neutral-100">
                      {club?.img ? (
                        <img
                          src={club.img}
                          alt={`${club.name || ''} cover`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                          <span className="text-4xl font-bold text-neutral-300">
                            {initials(club.name)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                      <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm">
                        <span
                          className="text-black uppercase"
                          style={{ fontSize: 10, letterSpacing: "0.08em" }}
                        >
                          {club.category || ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-3 pb-3 pt-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.25)]">
                        {club?.logo ? (
                          <img
                            src={club.logo}
                            alt={`${club.name} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-black leading-tight">{club.name || ''}</h3>
                        <div className="mt-0.5 flex items-center gap-1.5 text-neutral-500">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <span>{club.members.toLocaleString()} members</span>
                        </div>
                      </div>

                      <div className="shrink-0 rounded-full bg-black px-4 py-2 text-white transition hover:bg-neutral-800 active:scale-95">
                        Visit
                      </div>
                    </div>
       
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Suggested Clubs */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">Suggested for you</h3>
          </div>
          <div className="flex flex-col gap-3">
            {suggestedCards.map((club) => (
              <div
                key={club.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-300 hover:shadow-sm sm:gap-4"
              >
                <div className="size-14 shrink-0 overflow-hidden rounded-full sm:size-16">
                  <ImageWithFallback src={club.img} alt={club.name} className="size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge variant="secondary" className="mb-1 rounded-full">{club.category}</Badge>
                  <div className="wrap-break-word text-[#0a0a0a]">{club.name}</div>
                  <div className="flex items-center gap-1 text-sm text-[#717182]">
                    <Star className="size-3.5" /> {club.members} members
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="shrink-0 rounded-full px-3 sm:px-4"
                  onClick={() => router.push(`/Club?clubId=${club.id}`)}
                >
                  <span className="hidden sm:inline">Visit</span>
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MyClubsPage;
