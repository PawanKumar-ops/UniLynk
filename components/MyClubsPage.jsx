"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Search, ArrowLeft, Sparkles, Star, Layers } from "lucide-react";
import { Icon } from "@iconify/react";
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

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "C";
}

function Shimmer({ className = "" }) {
  return <div className={`animate-pulse rounded-full bg-neutral-200/80 ${className}`} />;
}

function ClubsLoading() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading clubs">
      {[0, 1].map((i) => (
        <div key={i} className="w-full rounded-3xl border border-neutral-200 bg-white p-2" style={{ animationDelay: `${i * 120}ms` }}>
          <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-neutral-100">
            <div className="absolute inset-0 -translate-x-full animate-[myclubs-shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <Shimmer className="absolute left-3 top-3 h-5 w-16 bg-white/80" />
          </div>
          <div className="flex items-center gap-3 px-3 pb-3 pt-4">
            <Shimmer className="h-12 w-12 shrink-0" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-3.5 w-2/5" />
              <Shimmer className="h-3 w-1/4" />
            </div>
            <Shimmer className="h-9 w-16 shrink-0" />
          </div>
        </div>
      ))}
      <style>{`@keyframes myclubs-shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}

function SuggestedLoading() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 sm:gap-4">
          <Shimmer className="size-14 shrink-0 sm:size-16" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-14" />
            <Shimmer className="h-3.5 w-1/2" />
            <Shimmer className="h-3 w-1/4" />
          </div>
          <Shimmer className="h-9 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function NoClubsState({ onExplore, hasSuggestions }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white px-6 py-10 text-center sm:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32" />

      <div className="relative mx-auto mb-6 flex h-[220px] w-[280px] max-w-[80vw] items-center justify-center">
        <img
          src="/illuistrations/noClubs.svg"
          alt="No clubs joined yet"
          className="h-full w-full object-contain"
        />
      </div>

      <h4 className="relative text-lg font-bold text-black">You haven't joined any clubs yet</h4>
      <p className="relative mx-auto mt-1.5 max-w-sm text-sm text-[#536471]">
        Clubs are where campus life happens. Find people who share your interests and get updates on their events.
      </p>
      <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onExplore}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-95"
        >
          <Search className="size-4" /> Explore clubs
        </button>
        {hasSuggestions ? (
          <a
            href="#suggested-clubs"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-50"
          >
            <Sparkles className="size-4" /> See suggestions
          </a>
        ) : null}
      </div>
    </div>
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
      {/* <header
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
 */}


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
              Clubs
            </h1>

            <p className="mt-0.5 text-[13px] leading-4 text-[#536471]">
              Communities you follow and love
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* Add Members */}
          <div className="group relative">
            <button
              onClick={() => router.push('./newsletter')}
              aria-label="Find members looking for a team"
              className="inline-flex items-center gap-2 rounded-full border border-[#e0e0de] bg-[#ffffff] py-2 pl-3 pr-3.5 text-[13px] font-semibold transition-colors hover:bg-[#f4f4f3]"
            >
              <Icon
                icon="solar:documents-minimalistic-linear"
                className="text-[21px] text-[#171717]"
              />
              <span className="hidden sm:inline">Newsletters</span>
            </button>

            <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
              Newsletters
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto sm:px-3.5 flex max-w-3xl flex-col gap-4 pb-5 sm:gap-6">
        {/* Summary strip */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-4 sm:gap-4 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9ebef] text-[#030213] sm:size-12">
              <Layers className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-[#717182]">You're a member of</div>
              {loading ? (
                <Shimmer className="mt-1.5 h-4 w-28" />
              ) : (
                <div className="mt-0.5 text-[#0a0a0a]">
                  {clubCards.length} campus {clubCards.length === 1 ? "club" : "clubs"}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 -space-x-3">
            {clubCards.slice(0, 4).map((club) => (
              <div key={club.id} className="size-8 overflow-hidden rounded-full border-2 border-[#EEEEEE] sm:size-10">
                <ImageWithFallback src={club.logo} alt={club.name} className="size-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* My Clubs */}
        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-bold">Clubs you're part of</h3>
          {loading ? (
            <ClubsLoading />
          ) : clubCards.length === 0 ? (
            <NoClubsState
              hasSuggestions={suggestedCards.length > 0}
              onExplore={() => router.push("/dashboard/clubs")}
            />
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
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#f4f4f3] border-1 border-[#EEEEEE]">
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
                        <Icon icon="solar:user-linear"
                          className="h-3.5 w-3.5"
                        />
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
        {(loading || suggestedCards.length > 0) && (
          <section id="suggested-clubs" className="flex scroll-mt-20 flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">Suggested for you</h3>
            </div>
            {loading ? <SuggestedLoading /> : (
              <div className="flex flex-col gap-3">
                {suggestedCards.map((club) => (
                  <div
                    key={club.id}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-300 hover:shadow-sm sm:gap-4"
                  >
                    <div className="size-14 shrink-0 overflow-hidden rounded-full border-1 border-[#EEEEEE] sm:size-16">
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
                      onClick={() => router.push(`./Club?clubId=${club.id}`)}
                    >
                      <span className="hidden sm:inline">Visit</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default MyClubsPage;
